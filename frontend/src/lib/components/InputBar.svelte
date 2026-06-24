<script lang="ts">
  import { Send, Paperclip, Mic, Loader2, Square } from 'lucide-svelte';
  import { chatStore } from '$lib/stores/chat';
  import { sendMessage } from '$lib/api/chat';
  import { toasts } from '$lib/stores/toast';

  let message = $state('');
  let textareaEl: HTMLTextAreaElement | undefined = $state();
  let abortController: AbortController | null = $state(null);

  const isStreaming = $derived($chatStore.isStreaming);

  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 200) + 'px';
  }

  function handleSend() {
    const content = message.trim();
    if (!content || isStreaming) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      createdAt: new Date().toISOString(),
    };

    chatStore.update((s) => ({
      ...s,
      messages: [...s.messages, userMsg],
      isStreaming: true,
      error: null,
    }));

    message = '';
    if (textareaEl) textareaEl.style.height = 'auto';

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    chatStore.update((s) => ({
      ...s,
      messages: [
        ...s.messages,
        { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
      ],
    }));

    abortController = sendMessage(
      $chatStore.sessionId,
      content,
      (chunk: string) => {
        assistantContent += chunk;
        chatStore.update((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          ),
        }));
      },
      () => {
        chatStore.update((s) => ({ ...s, isStreaming: false }));
        abortController = null;
      },
      (err: Error) => {
        chatStore.update((s) => ({ ...s, isStreaming: false, error: err.message }));
        toasts.error(err.message);
        abortController = null;
      }
    );
  }

  function handleStop() {
    if (abortController) {
      abortController.abort();
      chatStore.update((s) => ({ ...s, isStreaming: false }));
      abortController = null;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="border-t border-border bg-bg-secondary p-3 shrink-0">
  <div class="max-w-3xl mx-auto flex items-end gap-2">
    <button
      class="p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors shrink-0"
      title="Attach file"
    >
      <Paperclip size={18} />
    </button>

    <div class="flex-1 relative">
      <textarea
        bind:this={textareaEl}
        bind:value={message}
        oninput={autoResize}
        onkeydown={handleKeydown}
        placeholder="Message Nova..."
        rows={1}
        class="w-full bg-bg-tertiary text-text-primary placeholder-text-secondary rounded-xl px-4 py-3 pr-12 text-sm resize-none border border-border focus:border-accent-primary focus:outline-none transition-colors"
        disabled={isStreaming}
      ></textarea>
    </div>

    <button
      class="p-2.5 rounded-lg text-text-secondary hover:text-accent-cyan hover:bg-bg-tertiary transition-colors shrink-0"
      title="Voice input"
    >
      <Mic size={18} />
    </button>

    {#if isStreaming}
      <button
        onclick={handleStop}
        class="p-2.5 rounded-lg bg-accent-red text-white hover:bg-red-600 transition-colors shrink-0"
        title="Stop"
      >
        <Square size={18} />
      </button>
    {:else}
      <button
        onclick={handleSend}
        disabled={!message.trim()}
        class="p-2.5 rounded-lg transition-colors shrink-0
          {message.trim() ? 'bg-accent-primary text-white hover:bg-accent-glow' : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'}"
        title="Send"
      >
        {#if isStreaming}
          <Loader2 size={18} class="animate-spin" />
        {:else}
          <Send size={18} />
        {/if}
      </button>
    {/if}
  </div>
</div>
