<script lang="ts">
  import { FileText, Trash2, MessageSquare, Loader2 } from 'lucide-svelte';
  import type { UploadedFile } from '$lib/api/files';

  interface Props {
    file: UploadedFile;
    onDelete?: (id: string) => void;
    onProcess?: (id: string) => void;
  }

  let { file, onDelete, onProcess }: Props = $props();

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
</script>

<div class="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent-primary/30 transition-colors group">
  <div class="flex items-center gap-3">
    <div class="p-2 rounded-lg bg-bg-tertiary shrink-0">
      <FileText size={20} class="text-accent-primary" />
    </div>

    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-text-primary truncate">{file.filename}</p>
      <p class="text-[10px] text-text-secondary">
        {formatSize(file.file_size)} &middot; {file.file_type}
        {#if file.processed}
          &middot; {file.chunks_count} chunks
        {/if}
      </p>
    </div>

    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {#if !file.processed && onProcess}
        <button
          onclick={() => onProcess?.(file.id)}
          class="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
          title="Process for RAG"
        >
          <MessageSquare size={14} class="text-accent-cyan" />
        </button>
      {/if}
      {#if onDelete}
        <button
          onclick={() => onDelete?.(file.id)}
          class="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
          title="Delete"
        >
          <Trash2 size={14} class="text-accent-red" />
        </button>
      {/if}
    </div>
  </div>
</div>
