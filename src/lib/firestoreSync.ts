import { Task, UserRole, DeptMapping } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function saveSandboxTasks(tasks: Task[]): Promise<void> {
  // 1. Try local server API first
  try {
    const res = await fetch('/api/sandbox/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: tasks })
    });
    if (res.ok) return;
  } catch (err) {
    console.warn('API sandbox tasks save failed, attempting direct client Firestore...', err);
  }

  // 2. Fall back to client-side Firestore directly
  try {
    const docRef = doc(db, 'sheetflow_sandbox', 'tasks');
    await setDoc(docRef, { list: tasks, updatedAt: new Date().toISOString() });
    console.log('Successfully saved tasks directly to Firestore client-side.');
  } catch (fsErr) {
    console.error('Direct client-side Firestore tasks save also failed:', fsErr);
  }
}

export async function getSandboxTasks(): Promise<Task[] | null> {
  // 1. Try local server API first
  try {
    const res = await fetch('/api/sandbox/tasks');
    if (res.ok) {
      const data = await res.json();
      return data.list as Task[];
    }
  } catch (err) {
    console.warn('API sandbox tasks fetch failed, attempting direct client Firestore...', err);
  }

  // 2. Fall back to client-side Firestore directly
  try {
    const docRef = doc(db, 'sheetflow_sandbox', 'tasks');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      console.log('Successfully loaded tasks directly from Firestore client-side.');
      return docSnap.data().list as Task[];
    }
  } catch (fsErr) {
    console.error('Direct client-side Firestore tasks fetch also failed:', fsErr);
  }
  return null;
}

export async function saveSandboxRoles(roles: UserRole[]): Promise<void> {
  // 1. Try local server API first
  try {
    const res = await fetch('/api/sandbox/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: roles })
    });
    if (res.ok) return;
  } catch (err) {
    console.warn('API sandbox roles save failed, attempting direct client Firestore...', err);
  }

  // 2. Fall back to client-side Firestore directly
  try {
    const docRef = doc(db, 'sheetflow_sandbox', 'roles');
    await setDoc(docRef, { list: roles, updatedAt: new Date().toISOString() });
    console.log('Successfully saved roles directly to Firestore client-side.');
  } catch (fsErr) {
    console.error('Direct client-side Firestore roles save also failed:', fsErr);
  }
}

export async function getSandboxRoles(): Promise<UserRole[] | null> {
  // 1. Try local server API first
  try {
    const res = await fetch('/api/sandbox/roles');
    if (res.ok) {
      const data = await res.json();
      return data.list as UserRole[];
    }
  } catch (err) {
    console.warn('API sandbox roles fetch failed, attempting direct client Firestore...', err);
  }

  // 2. Fall back to client-side Firestore directly
  try {
    const docRef = doc(db, 'sheetflow_sandbox', 'roles');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      console.log('Successfully loaded roles directly from Firestore client-side.');
      return docSnap.data().list as UserRole[];
    }
  } catch (fsErr) {
    console.error('Direct client-side Firestore roles fetch also failed:', fsErr);
  }
  return null;
}

export async function saveSandboxMappings(mappings: DeptMapping[]): Promise<void> {
  // 1. Try local server API first
  try {
    const res = await fetch('/api/sandbox/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: mappings })
    });
    if (res.ok) return;
  } catch (err) {
    console.warn('API sandbox mappings save failed, attempting direct client Firestore...', err);
  }

  // 2. Fall back to client-side Firestore directly
  try {
    const docRef = doc(db, 'sheetflow_sandbox', 'mappings');
    await setDoc(docRef, { list: mappings, updatedAt: new Date().toISOString() });
    console.log('Successfully saved mappings directly to Firestore client-side.');
  } catch (fsErr) {
    console.error('Direct client-side Firestore mappings save also failed:', fsErr);
  }
}

export async function getSandboxMappings(): Promise<DeptMapping[] | null> {
  // 1. Try local server API first
  try {
    const res = await fetch('/api/sandbox/mappings');
    if (res.ok) {
      const data = await res.json();
      return data.list as DeptMapping[];
    }
  } catch (err) {
    console.warn('API sandbox mappings fetch failed, attempting direct client Firestore...', err);
  }

  // 2. Fall back to client-side Firestore directly
  try {
    const docRef = doc(db, 'sheetflow_sandbox', 'mappings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      console.log('Successfully loaded mappings directly from Firestore client-side.');
      return docSnap.data().list as DeptMapping[];
    }
  } catch (fsErr) {
    console.error('Direct client-side Firestore mappings fetch also failed:', fsErr);
  }
  return null;
}
