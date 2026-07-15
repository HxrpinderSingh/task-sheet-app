import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Task, UserRole, DeptMapping } from '../types';

const SANDBOX_COLLECTION = 'sheetflow_sandbox';

export async function saveSandboxTasks(tasks: Task[]): Promise<void> {
  try {
    const docRef = doc(db, SANDBOX_COLLECTION, 'tasks');
    await setDoc(docRef, { list: tasks, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Firestore sandbox save failed (falling back to localStorage only):', err);
  }
}

export async function getSandboxTasks(): Promise<Task[] | null> {
  try {
    const docRef = doc(db, SANDBOX_COLLECTION, 'tasks');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      return docSnap.data().list as Task[];
    }
  } catch (err) {
    console.warn('Firestore sandbox fetch failed:', err);
  }
  return null;
}

export async function saveSandboxRoles(roles: UserRole[]): Promise<void> {
  try {
    const docRef = doc(db, SANDBOX_COLLECTION, 'roles');
    await setDoc(docRef, { list: roles, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Firestore sandbox save failed (falling back to localStorage only):', err);
  }
}

export async function getSandboxRoles(): Promise<UserRole[] | null> {
  try {
    const docRef = doc(db, SANDBOX_COLLECTION, 'roles');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      return docSnap.data().list as UserRole[];
    }
  } catch (err) {
    console.warn('Firestore sandbox fetch failed:', err);
  }
  return null;
}

export async function saveSandboxMappings(mappings: DeptMapping[]): Promise<void> {
  try {
    const docRef = doc(db, SANDBOX_COLLECTION, 'mappings');
    await setDoc(docRef, { list: mappings, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Firestore sandbox save failed (falling back to localStorage only):', err);
  }
}

export async function getSandboxMappings(): Promise<DeptMapping[] | null> {
  try {
    const docRef = doc(db, SANDBOX_COLLECTION, 'mappings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      return docSnap.data().list as DeptMapping[];
    }
  } catch (err) {
    console.warn('Firestore sandbox fetch failed:', err);
  }
  return null;
}
