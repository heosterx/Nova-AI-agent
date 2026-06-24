<script lang="ts">
  import { onMount } from 'svelte';
  import { Upload, FolderOpen } from 'lucide-svelte';
  import FileChip from '$lib/components/FileChip.svelte';
  import { listFiles, uploadFile, processFile, deleteFile as deleteFileApi, type UploadedFile } from '$lib/api/files';
  import { toasts } from '$lib/stores/toast';

  let files: UploadedFile[] = $state([]);
  let loading = $state(true);
  let uploading = $state(false);
  let dragOver = $state(false);

  onMount(async () => {
    try {
      const result = await listFiles();
      files = result.files;
    } catch (err) {
      toasts.error('Failed to load files');
    } finally {
      loading = false;
    }
  });

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    uploading = true;
    try {
      for (const file of Array.from(fileList)) {
        const result = await uploadFile(file);
        files = [result.file, ...files];
      }
      toasts.success('File uploaded');
    } catch (err) {
      toasts.error('Upload failed');
    } finally {
      uploading = false;
    }
  }

  async function handleProcess(id: string) {
    try {
      const result = await processFile(id);
      files = files.map((f) =>
        f.id === id ? { ...f, processed: true, chunks_count: result.chunks_count } : f
      );
      toasts.success('File processed for RAG');
    } catch (err) {
      toasts.error('Processing failed');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFileApi(id);
      files = files.filter((f) => f.id !== id);
      toasts.success('File deleted');
    } catch (err) {
      toasts.error('Failed to delete file');
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    handleUpload(e.dataTransfer?.files ?? null);
  }
</script>

<svelte:head>
  <title>Files - Nova</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <FolderOpen size={24} class="text-accent-primary" />
    <h1 class="font-mono font-bold text-xl">Files</h1>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="border-2 border-dashed rounded-2xl p-8 text-center mb-6 transition-colors
      {dragOver ? 'border-accent-primary bg-accent-primary/5' : 'border-border'}"
    ondragover={(e) => { e.preventDefault(); dragOver = true; }}
    ondragleave={() => (dragOver = false)}
    ondrop={handleDrop}
  >
    <Upload size={32} class="mx-auto text-text-secondary mb-3" />
    <p class="text-sm text-text-secondary mb-2">
      {uploading ? 'Uploading...' : 'Drag & drop files here or'}
    </p>
    <label class="inline-block px-4 py-2 rounded-lg bg-accent-primary text-white text-sm cursor-pointer hover:bg-accent-glow transition-colors">
      Browse Files
      <input type="file" class="hidden" multiple onchange={(e) => handleUpload((e.target as HTMLInputElement).files)} />
    </label>
    <p class="text-[10px] text-text-secondary mt-2">PDF, TXT, MD, DOCX up to 10MB</p>
  </div>

  {#if loading}
    <div class="space-y-3">
      {#each Array(3) as _}
        <div class="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse h-16"></div>
      {/each}
    </div>
  {:else if files.length === 0}
    <div class="text-center py-16">
      <FolderOpen size={48} class="mx-auto text-text-secondary/30 mb-4" />
      <p class="text-text-secondary">No files uploaded yet.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each files as file (file.id)}
        <FileChip {file} onProcess={handleProcess} onDelete={handleDelete} />
      {/each}
    </div>
  {/if}
</div>
