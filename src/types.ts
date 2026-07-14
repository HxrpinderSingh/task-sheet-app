export interface DeptMapping {
  department: string;
  sources: string[];
  modules: string[];
}

export type TaskStatus = 'Pending' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface ActivityLogEntry {
  timestamp: string; // formatted date-time, e.g., "12 Jul 26 8:34 PM"
  authorName: string;
  authorEmail: string;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  department: string; // New separate column
  source: string;     // Split from Department/Source
  module: string;     // New module column
  assigneeEmail: string;
  assigneeName: string;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  createdDate: string;
  createdBy: string;
  remarks?: string;
  activityLog?: string; // stringified JSON of ActivityLogEntry[]
}

export type RoleType = 'employee' | 'manager' | 'admin';

export interface UserRole {
  email: string;
  name: string;
  role: RoleType;
  department: string;
  password?: string;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

export interface AppState {
  user: {
    email: string;
    name: string;
    photoURL?: string;
  } | null;
  role: RoleType;
  department: string;
  spreadsheetId: string | null;
  spreadsheetName: string;
  tasks: Task[];
  users: UserRole[];
  isLoading: boolean;
  activeView: 'my-tasks' | 'overdue-tasks' | 'completed-tasks' | 'admin-dashboard';
  error: string | null;
}
