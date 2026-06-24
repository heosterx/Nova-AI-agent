<script lang="ts">
  const providers = [
    { name: 'Groq', color: 'bg-accent-green' },
    { name: 'Cerebras', color: 'bg-accent-green' },
    { name: 'OpenRouter', color: 'bg-accent-green' },
  ];
</script>

<div class="flex items-center gap-1.5 ml-4" title="AI Provider Status">
  {#each providers as provider}
    <div class="flex items-center gap-1">
      <div class="w-2 h-2 rounded-full {provider.color}"></div>
      <span class="text-[10px] text-text-secondary hidden md:inline">{provider.name}</span>
    </div>
  {/each}
</div>
