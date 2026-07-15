import { Task, UserRole, DeptMapping } from '../types';

export async function saveSandboxTasks(tasks: Task[]): Promise<void> {
  try {
    const res = await fetch('/api/sandbox/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: tasks })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('API sandbox tasks save failed:', err);
  }
}

export async function getSandboxTasks(): Promise<Task[] | null> {
  try {
    const res = await fetch('/api/sandbox/tasks');
    if (res.ok) {
      const data = await res.json();
      return data.list as Task[];
    }
  } catch (err) {
    console.warn('API sandbox tasks fetch failed:', err);
  }
  return null;
}

export async function saveSandboxRoles(roles: UserRole[]): Promise<void> {
  try {
    const res = await fetch('/api/sandbox/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: roles })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('API sandbox roles save failed:', err);
  }
}

export async function getSandboxRoles(): Promise<UserRole[] | null> {
  try {
    const res = await fetch('/api/sandbox/roles');
    if (res.ok) {
      const data = await res.json();
      return data.list as UserRole[];
    }
  } catch (err) {
    console.warn('API sandbox roles fetch failed:', err);
  }
  return null;
}

export async function saveSandboxMappings(mappings: DeptMapping[]): Promise<void> {
  try {
    const res = await fetch('/api/sandbox/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: mappings })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('API sandbox mappings save failed:', err);
  }
}

export async function getSandboxMappings(): Promise<DeptMapping[] | null> {
  try {
    const res = await fetch('/api/sandbox/mappings');
    if (res.ok) {
      const data = await res.json();
      return data.list as DeptMapping[];
    }
  } catch (err) {
    console.warn('API sandbox mappings fetch failed:', err);
  }
  return null;
}
