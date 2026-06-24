import { Router, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { supabase } from '../db/supabase';
import { aiRouter } from '../services/ai/router';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { executeTool, availableTools } from '../services/tools/executor';
import { searchMemory } from '../services/memory';
import { AIMessage } from '../services/ai/types';

const router = Router();

const DEFAULT_SYSTEM_PROMPT = `You are Nova, a personal AI assistant. You are helpful, concise, and proactive.
You have access to these tools: ${availableTools.map((t) => t.name).join(', ')}.
When you need to use a tool, respond with a JSON block in the format:
<tool_call>{"name": "tool_name", "arguments": {...}}</tool_call>
Only use tools when necessary. Always be direct and helpful.`;

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, content } = req.body;
    const userId = req.userId!;

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          title: content.substring(0, 50),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      activeSessionId = session.id;
    }

    await supabase.from('messages').insert({
      id: uuid(),
      session_id: activeSessionId,
      role: 'user',
      content,
    });

    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    const messages: AIMessage[] = (historyData || []).map((m: { role: string; content: string }) => ({
      role: m.role as AIMessage['role'],
      content: m.content,
    }));

    let contextAddition = '';
    try {
      const relevantMemories = await searchMemory(userId, content, 5);
      if (relevantMemories.length > 0) {
        contextAddition = '\n\nRelevant memories:\n' +
          relevantMemories.map((m) => `- [${m.category}] ${m.content}`).join('\n');
      }
    } catch {
      // Memory search is optional
    }

    const systemPrompt = DEFAULT_SYSTEM_PROMPT + contextAddition;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Session-Id': activeSessionId,
    });

    let fullResponse = '';

    const aiResponse = await aiRouter.complete(messages, systemPrompt, (chunk: string) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    });

    const toolCallMatch = fullResponse.match(/<tool_call>(.*?)<\/tool_call>/s);
    if (toolCallMatch) {
      try {
        const toolCall = JSON.parse(toolCallMatch[1]);
        res.write(`data: ${JSON.stringify({ type: 'tool_call', name: toolCall.name, arguments: toolCall.arguments })}\n\n`);

        const toolResult = await executeTool(toolCall.name, toolCall.arguments, userId);
        res.write(`data: ${JSON.stringify({ type: 'tool_result', ...toolResult })}\n\n`);

        await supabase.from('messages').insert({
          id: uuid(),
          session_id: activeSessionId,
          role: 'tool',
          content: JSON.stringify(toolResult.result),
          tool_name: toolCall.name,
          tool_input: toolCall.arguments,
          tool_output: toolResult.result,
        });
      } catch (toolError: unknown) {
        const message = toolError instanceof Error ? toolError.message : 'Tool execution failed';
        res.write(`data: ${JSON.stringify({ type: 'tool_error', error: message })}\n\n`);
      }
    }

    await supabase.from('messages').insert({
      id: uuid(),
      session_id: activeSessionId,
      role: 'assistant',
      content: fullResponse,
      model: aiResponse.model,
      tokens_used: aiResponse.tokensUsed,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', sessionId: activeSessionId, model: aiResponse.model, tokensUsed: aiResponse.tokensUsed })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
      res.end();
    }
  }
});

router.get('/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, model, created_at, updated_at')
      .eq('user_id', req.userId!)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ sessions: data });
  } catch (err) {
    next(err);
  }
});

router.get('/sessions/:sessionId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/:sessionId/fork', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { messageId } = req.body;
    const userId = req.userId!;

    const { data: originalMessages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    const messagesToCopy = messageId
      ? (originalMessages || []).slice(0, (originalMessages || []).findIndex((m: { id: string }) => m.id === messageId) + 1)
      : originalMessages || [];

    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        title: `Fork of conversation`,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    if (messagesToCopy.length > 0) {
      await supabase.from('messages').insert(
        messagesToCopy.map((m: { role: string; content: string; tool_name: string | null; tool_input: unknown; tool_output: unknown; model: string | null; tokens_used: number | null }) => ({
          id: uuid(),
          session_id: newSession.id,
          role: m.role,
          content: m.content,
          tool_name: m.tool_name,
          tool_input: m.tool_input,
          tool_output: m.tool_output,
          model: m.model,
          tokens_used: m.tokens_used,
        }))
      );
    }

    res.json({ session: newSession });
  } catch (err) {
    next(err);
  }
});

export default router;
