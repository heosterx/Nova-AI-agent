import { apiFetch } from './client';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  due_at: string | null;
  recurring_cron: string | null;
  created_at: string;
  updated_at: string;
}

export async function listTasks(status?: string): Promise<{ tasks: Task[] }> {
  const query = status ? `?status=${status}` : '';
  return apiFetch(`/api/tasks${query}`);
}

export async function createTask(title: string, description?: string, dueAt?: string): Promise<{ task: Task }> {
  return apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, description, due_at: dueAt }),
  });
}

export async function updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'due_at'>>): Promise<{ task: Task }> {
  return apiFetch(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
}
