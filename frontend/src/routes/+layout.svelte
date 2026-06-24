<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import InputBar from '$lib/components/InputBar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { authStore } from '$lib/stores/auth';
  import { getMe } from '$lib/api/auth';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let { children } = $props();

  const isAuthRoute = $derived($page.url.pathname.startsWith('/auth'));
  const showInputBar = $derived($page.url.pathname === '/');

  onMount(async () => {
    const user = await getMe();
    authStore.set({ user, loading: false });
    if (!user && !$page.url.pathname.startsWith('/auth')) {
      goto('/auth/login');
    }
  });
</script>

{#if isAuthRoute}
  {@render children()}
{:else}
  <div class="flex flex-col h-screen bg-bg-primary overflow-hidden">
    <Header />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <main class="flex-1 overflow-y-auto p-6">
        {@render children()}
      </main>
    </div>
    {#if showInputBar}
      <InputBar />
    {/if}
  </div>
{/if}

<Toast />
