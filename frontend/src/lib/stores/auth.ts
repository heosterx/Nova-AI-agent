import { writable } from 'svelte/store';
import type { AuthUser } from '$lib/api/auth';

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
}

export const authStore = writable<AuthStore>({
  user: null,
  loading: true,
});
