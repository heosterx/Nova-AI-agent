<script lang="ts">
  import { toasts } from '$lib/stores/toast';
  import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-svelte';

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: 'border-accent-green text-accent-green',
    error: 'border-accent-red text-accent-red',
    info: 'border-accent-cyan text-accent-cyan',
    warning: 'border-accent-amber text-accent-amber',
  };
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
  {#each $toasts as toast (toast.id)}
    {@const Icon = icons[toast.type]}
    <div class="glass rounded-xl px-4 py-3 border-l-2 {colors[toast.type]} flex items-center gap-3 min-w-[280px] shadow-lg animate-slide-in">
      <Icon size={16} class="shrink-0" />
      <span class="text-sm text-text-primary">{toast.message}</span>
    </div>
  {/each}
</div>

<style>
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in {
    animation: slide-in 0.25s ease-out;
  }
</style>
