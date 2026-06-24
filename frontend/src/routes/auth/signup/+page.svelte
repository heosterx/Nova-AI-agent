<script lang="ts">
  import { Cpu, Loader2 } from 'lucide-svelte';
  import { signup } from '$lib/api/auth';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email || !password) return;

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }

    loading = true;
    error = '';

    try {
      const user = await signup(email, password);
      authStore.set({ user, loading: false });
      goto('/');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Signup failed';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up - Nova</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-bg-primary p-4">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <div class="inline-flex p-3 rounded-2xl bg-bg-secondary border border-border mb-4">
        <Cpu size={32} class="text-accent-primary" />
      </div>
      <h1 class="font-mono font-bold text-2xl text-text-primary">Create Account</h1>
      <p class="text-sm text-text-secondary mt-1">Set up your Nova instance</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      {#if error}
        <div class="px-4 py-2 rounded-lg bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
          {error}
        </div>
      {/if}

      <div>
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Email</label>
        <input
          type="email"
          bind:value={email}
          required
          class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Password</label>
        <input
          type="password"
          bind:value={password}
          required
          class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none"
          placeholder="At least 6 characters"
        />
      </div>

      <div>
        <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Confirm Password</label>
        <input
          type="password"
          bind:value={confirmPassword}
          required
          class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none"
          placeholder="Repeat password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-glow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {#if loading}
          <Loader2 size={16} class="animate-spin" />
          Creating account...
        {:else}
          Create Account
        {/if}
      </button>
    </form>

    <p class="text-center text-sm text-text-secondary mt-6">
      Already have an account?
      <a href="/auth/login" class="text-accent-primary hover:text-accent-glow transition-colors">Sign in</a>
    </p>
  </div>
</div>
