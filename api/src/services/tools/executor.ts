import { webSearch, SearchResult } from './search';
import { calculate } from './calculator';
import { storeMemory } from '../memory';
import { supabase } from '../../db/supabase';

export interface ToolResult {
  name: string;
  result: unknown;
  error?: string;
}

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'web_search': {
        const query = args.query as string;
        const results: SearchResult[] = await webSearch(query);
        return { name: toolName, result: results };
      }

      case 'calculator': {
        const expression = args.expression as string;
        const result = calculate(expression);
        return { name: toolName, result };
      }

      case 'store_memory': {
        const content = args.content as string;
        const category = (args.category as string) || 'fact';
        const memory = await storeMemory(userId, content, category);
        return { name: toolName, result: memory };
      }

      case 'create_task': {
        const title = args.title as string;
        const dueAt = args.due_at as string | undefined;
        const description = (args.description as string) || '';

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            title,
            description,
            due_at: dueAt || null,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        return { name: toolName, result: data };
      }

      case 'get_current_time': {
        return {
          name: toolName,
          result: {
            utc: new Date().toISOString(),
            unix: Date.now(),
            readable: new Date().toLocaleString(),
          },
        };
      }

      default:
        return { name: toolName, result: null, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: toolName, result: null, error: message };
  }
}

export const availableTools = [
  {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'calculator',
    description: 'Evaluate a mathematical expression',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Math expression to evaluate' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'store_memory',
    description: 'Store a fact or preference in long-term memory',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The information to remember' },
        category: {
          type: 'string',
          enum: ['fact', 'preference', 'project', 'contact', 'goal', 'custom'],
          description: 'Category of the memory',
        },
      },
      required: ['content', 'category'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a task or reminder',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        due_at: { type: 'string', description: 'ISO 8601 due date' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
