<script lang="ts">
  import { Cpu, Mic, Settings, LogOut } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth';
  import { logout } from '$lib/api/auth';
  import { goto } from '$app/navigation';
  import ProviderStatus from './ProviderStatus.svelte';

  async function handleLogout() {
    await logout();
    authStore.set({ user: null, loading: false });
    goto('/auth/login');
  }
</script>

<header class="h-14 flex items-center justify-between px-4 border-b border-border bg-bg-secondary shrink-0">
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <Cpu size={24} class="text-accent-primary" />
      <span class="font-mono font-bold text-lg text-text-primary">Nova</span>
    </div>
    <ProviderStatus />
  </div>

  <div class="flex items-center gap-2">
    <a href="/voice"
      class="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
      title="Voice Mode"
    >
      <Mic size={18} class="text-accent-cyan" />
    </a>
    <a href="/settings"
      class="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
      title="Settings"
    >
      <Settings size={18} class="text-text-secondary" />
    </a>
    {#if $authStore.user}
      <button
        onclick={handleLogout}
        class="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        title="Logout"
      >
        <LogOut size={18} class="text-text-secondary" />
      </button>
    {/if}
  </div>
</header>
