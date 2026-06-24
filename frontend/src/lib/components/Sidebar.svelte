<script lang="ts">
  import { page } from '$app/stores';
  import {
    MessageSquare,
    Brain,
    CheckSquare,
    FolderOpen,
    Mic,
    Settings as SettingsIcon,
    PanelLeftClose,
    PanelLeftOpen,
  } from 'lucide-svelte';

  let collapsed = $state(false);

  const navItems = [
    { path: '/', icon: MessageSquare, label: 'Chat' },
    { path: '/memory', icon: Brain, label: 'Memory' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/files', icon: FolderOpen, label: 'Files' },
    { path: '/voice', icon: Mic, label: 'Voice' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];
</script>

<nav
  class="flex flex-col border-r border-border bg-bg-secondary shrink-0 transition-all duration-200"
  style="width: {collapsed ? '60px' : '200px'}"
>
  <div class="flex flex-col flex-1 py-3 gap-1">
    {#each navItems as item}
      {@const isActive = $page.url.pathname === item.path || ($page.url.pathname.startsWith(item.path) && item.path !== '/')}
      <a
        href={item.path}
        class="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors
          {isActive ? 'bg-bg-tertiary border-l-2 border-accent-primary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}"
      >
        <item.icon size={20} />
        {#if !collapsed}
          <span class="text-sm font-medium">{item.label}</span>
        {/if}
      </a>
    {/each}
  </div>

  <button
    onclick={() => (collapsed = !collapsed)}
    class="flex items-center justify-center p-3 border-t border-border text-text-secondary hover:text-text-primary transition-colors"
  >
    {#if collapsed}
      <PanelLeftOpen size={18} />
    {:else}
      <PanelLeftClose size={18} />
    {/if}
  </button>
</nav>
