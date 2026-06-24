<script lang="ts">
  import { onMount } from 'svelte';
  import { Settings, Save } from 'lucide-svelte';
  import { getSettings, updateSettings, type UserSettings } from '$lib/api/settings';
  import { toasts } from '$lib/stores/toast';

  let settings: UserSettings | null = $state(null);
  let loading = $state(true);
  let saving = $state(false);

  let systemPrompt = $state('');
  let defaultModel = $state('');
  let voiceId = $state('');
  let theme = $state<'dark' | 'light'>('dark');

  onMount(async () => {
    try {
      const result = await getSettings();
      settings = result.settings;
      systemPrompt = settings.system_prompt || '';
      defaultModel = settings.default_model || 'llama-3.3-70b-versatile';
      voiceId = settings.voice_id || '';
      theme = settings.theme || 'dark';
    } catch (err) {
      toasts.error('Failed to load settings');
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    saving = true;
    try {
      await updateSettings({
        system_prompt: systemPrompt,
        default_model: defaultModel,
        voice_id: voiceId,
        theme,
      });
      toasts.success('Settings saved');
    } catch (err) {
      toasts.error('Failed to save settings');
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - Nova</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <Settings size={24} class="text-accent-primary" />
    <h1 class="font-mono font-bold text-xl">Settings</h1>
  </div>

  {#if loading}
    <div class="space-y-6">
      {#each Array(4) as _}
        <div class="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse h-20"></div>
      {/each}
    </div>
  {:else}
    <div class="space-y-6">
      <div class="bg-bg-secondary border border-border rounded-xl p-4">
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-2 block">System Prompt</label>
        <textarea
          bind:value={systemPrompt}
          rows={4}
          placeholder="You are Nova, a personal AI assistant..."
          class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none resize-none"
        ></textarea>
      </div>

      <div class="bg-bg-secondary border border-border rounded-xl p-4">
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Default Model</label>
        <select
          bind:value={defaultModel}
          class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
        >
          <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
          <option value="llama-3.3-70b">Llama 3.3 70B (Cerebras)</option>
          <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (OpenRouter)</option>
        </select>
      </div>

      <div class="bg-bg-secondary border border-border rounded-xl p-4">
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Voice ID (Cartesia)</label>
        <input
          type="text"
          bind:value={voiceId}
          placeholder="Enter Cartesia voice ID..."
          class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none"
        />
      </div>

      <div class="bg-bg-secondary border border-border rounded-xl p-4">
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-2 block">Theme</label>
        <div class="flex gap-3">
          <button
            onclick={() => (theme = 'dark')}
            class="px-4 py-2 rounded-lg text-sm transition-colors
              {theme === 'dark' ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}"
          >
            Dark
          </button>
          <button
            onclick={() => (theme = 'light')}
            class="px-4 py-2 rounded-lg text-sm transition-colors
              {theme === 'light' ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}"
          >
            Light
          </button>
        </div>
      </div>

      <button
        onclick={handleSave}
        disabled={saving}
        class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent-primary text-white font-medium hover:bg-accent-glow transition-colors disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  {/if}
</div>
