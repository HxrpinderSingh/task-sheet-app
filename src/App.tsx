import { useState, useEffect, useMemo } from 'react';
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  setAccessToken, 
  auth 
} from './lib/firebase';
import { 
  findSpreadsheet, 
  createSpreadsheet, 
  fetchTasks, 
  fetchRoles, 
  addTask, 
  updateTask, 
  deleteTask, 
  saveUserRole, 
  deleteUserRole,
  getSpreadsheetDetails,
  fetchMappings,
  saveAllMappings
} from './lib/googleSheets';
import { Task, UserRole, RoleType, TaskPriority, DeptMapping } from './types';
import { defaultTasks, defaultRoles, defaultMappings } from './data/defaultTasks';
import { 
  getSandboxTasks, 
  getSandboxRoles, 
  getSandboxMappings, 
  saveSandboxTasks, 
  saveSandboxRoles, 
  saveSandboxMappings 
} from './lib/firestoreSync';

// Import UI Components
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import TaskFormModal from './components/TaskFormModal';
import AnalyticsView from './components/AnalyticsView';
import RoleManagement from './components/RoleManagement';
import MappingManagement from './components/MappingManagement';
import LoginScreen from './components/LoginScreen';
import TaskDetailsModal from './components/TaskDetailsModal';
import TaskCompletionModal from './components/TaskCompletionModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Icons
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  RefreshCw, 
  SlidersHorizontal,
  FolderLock,
  LayoutGrid,
  FileSpreadsheet,
  AlertTriangle,
  FolderGit,
  Database,
  ArrowRight,
  Download
} from 'lucide-react';

function ensureRequiredMappings(mappings: DeptMapping[]): DeptMapping[] {
  const result = [...mappings];
  const requiredDepts = ['Tech Team', 'Marketing', 'Management', 'Operations'];
  
  requiredDepts.forEach(dept => {
    const exists = result.some(m => m.department.toLowerCase().trim() === dept.toLowerCase().trim());
    if (!exists) {
      const defaultMap = defaultMappings.find(dm => dm.department.toLowerCase().trim() === dept.toLowerCase().trim());
      if (defaultMap) {
        result.push(defaultMap);
      }
    }
  });
  return result;
}

export default function App() {
  // Auth state
  const [user, setUser] = useState<{ email: string; name: string; photoURL?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Sheets configuration state
  const [isLocalSandboxMode, setIsLocalSandboxMode] = useState(() => localStorage.getItem('sheetflow_sandbox_mode') === 'true');
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetName, setSpreadsheetName] = useState('Task_Management_App_Backend');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [showSheetIdInput, setShowSheetIdInput] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');

  // Data states
  const [tasks, setTasks] = useState<Task[]>(() => {
    const cached = localStorage.getItem('sheetflow_tasks_cache');
    return cached ? JSON.parse(cached) : defaultTasks;
  });
  const [roles, setRoles] = useState<UserRole[]>(() => {
    const cached = localStorage.getItem('sheetflow_roles_cache');
    return cached ? JSON.parse(cached) : defaultRoles;
  });
  const [systemMappings, setSystemMappings] = useState<DeptMapping[]>(() => {
    const cached = localStorage.getItem('sheetflow_mappings_cache');
    const parsed = cached ? JSON.parse(cached) : defaultMappings;
    return ensureRequiredMappings(parsed);
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandboxFallbackWarning, setSandboxFallbackWarning] = useState(false);

  // App Navigation & Filters
  const [activeView, setActiveView] = useState<'my-tasks' | 'overdue-tasks' | 'completed-tasks' | 'admin-dashboard' | 'all-tasks'>('my-tasks');
  const [adminSubView, setAdminSubView] = useState<'tasks' | 'analytics' | 'roles' | 'mappings'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [managerDepartmentToggle, setManagerDepartmentToggle] = useState(false); // Toggle to show full department tasks or only self

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [taskToCompleteFromDetails, setTaskToCompleteFromDetails] = useState<Task | null>(null);

  // 1. Initialize Auth on page load
  useEffect(() => {
    // Restore custom user credential sessions from local storage
    const cachedCustomUser = localStorage.getItem('sheetflow_custom_user');
    const cachedCustomToken = localStorage.getItem('sheetflow_custom_token');
    
    if (cachedCustomUser && cachedCustomToken) {
      setUser(JSON.parse(cachedCustomUser));
      setToken(cachedCustomToken);
      
      const cachedSheetId = localStorage.getItem('task_manager_spreadsheet_id');
      if (cachedSheetId) {
        setSpreadsheetId(cachedSheetId);
      }
      
      const cachedRoles = localStorage.getItem('sheetflow_roles_cache');
      const cachedTasks = localStorage.getItem('sheetflow_tasks_cache');
      const cachedMappings = localStorage.getItem('sheetflow_mappings_cache');
      if (cachedRoles) setRoles(JSON.parse(cachedRoles));
      if (cachedTasks) setTasks(JSON.parse(cachedTasks));
      if (cachedMappings) setSystemMappings(JSON.parse(cachedMappings));
      
      setAuthInitialized(true);
      return;
    }

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setToken(accessToken);
        setUser({
          email: currentUser.email || '',
          name: currentUser.displayName || currentUser.email || 'Google User',
          photoURL: currentUser.photoURL || undefined
        });
        setAuthInitialized(true);
      },
      () => {
        // Only clear if we don't have a custom credential session running
        if (!localStorage.getItem('sheetflow_custom_user')) {
          setToken(null);
          setUser(null);
        }
        setAuthInitialized(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch or create Spreadsheet backend on successful login
  useEffect(() => {
    if (!token || !user) return;
    
    if (token === 'local-credentials-token' || isLocalSandboxMode) {
      // In Sandbox/Offline Mode, load from Firestore (shared central database) with Local Storage backup
      const loadSandboxData = async () => {
        setIsSyncing(true);
        try {
          const [fsTasks, fsRoles, fsMappings] = await Promise.all([
            getSandboxTasks(),
            getSandboxRoles(),
            getSandboxMappings()
          ]);

          const cachedTasks = localStorage.getItem('sheetflow_tasks_cache');
          const cachedRoles = localStorage.getItem('sheetflow_roles_cache');
          const cachedMappings = localStorage.getItem('sheetflow_mappings_cache');

          if (fsTasks && fsTasks.length > 0) {
            setTasks(fsTasks);
            localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(fsTasks));
          } else if (cachedTasks) {
            setTasks(JSON.parse(cachedTasks));
          } else {
            setTasks(defaultTasks);
          }

          if (fsRoles && fsRoles.length > 0) {
            setRoles(fsRoles);
            localStorage.setItem('sheetflow_roles_cache', JSON.stringify(fsRoles));
          } else if (cachedRoles) {
            setRoles(JSON.parse(cachedRoles));
          } else {
            setRoles(defaultRoles);
          }

          if (fsMappings && fsMappings.length > 0) {
            setSystemMappings(ensureRequiredMappings(fsMappings));
            localStorage.setItem('sheetflow_mappings_cache', JSON.stringify(fsMappings));
          } else if (cachedMappings) {
            setSystemMappings(ensureRequiredMappings(JSON.parse(cachedMappings)));
          } else {
            setSystemMappings(defaultMappings);
          }
        } catch (err) {
          console.error('Error loading Firestore sandbox data:', err);
        } finally {
          setIsSyncing(false);
        }
      };
      loadSandboxData();
      return;
    }

    const setupBackend = async () => {
      setIsSyncing(true);
      setError(null);
      try {
        let sheetId = localStorage.getItem('task_manager_spreadsheet_id');
        
        // If not in localStorage, search user's Drive
        if (!sheetId) {
          sheetId = await findSpreadsheet(token);
        }

        // If sheet not found in Drive either, automatically create and seed it
        if (!sheetId) {
          const newSheet = await createSpreadsheet(token, user.email, user.name);
          sheetId = newSheet.id;
          setSpreadsheetUrl(newSheet.url);
        } else {
          // Fetch existing sheet metadata
          const details = await getSpreadsheetDetails(token, sheetId);
          setSpreadsheetName(details.name);
          setSpreadsheetUrl(details.url);
        }

        setSpreadsheetId(sheetId);
        localStorage.setItem('task_manager_spreadsheet_id', sheetId);

        // Fetch tasks and roles
        await syncData(token, sheetId);

      } catch (err: any) {
        console.error('Error establishing Google Sheet backend:', err);
        const errMsg = err.message || String(err);
        const isApiDisabled = errMsg.includes('403') || errMsg.includes('disabled') || errMsg.includes('not been used');
        
        if (isApiDisabled) {
          setIsLocalSandboxMode(true);
          localStorage.setItem('sheetflow_sandbox_mode', 'true');
          setSandboxFallbackWarning(true);
          setError(null);
        } else {
          setError(`Failed to synchronize with Google Sheets: ${errMsg}. Please verify spreadsheet access rights.`);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    setupBackend();
  }, [token, user?.email, isLocalSandboxMode]);

  // Sync data utility
  const syncData = async (accessToken: string, sheetId: string) => {
    if (accessToken === 'local-credentials-token' || isLocalSandboxMode) {
      const cachedTasks = localStorage.getItem('sheetflow_tasks_cache');
      const cachedRoles = localStorage.getItem('sheetflow_roles_cache');
      const cachedMappings = localStorage.getItem('sheetflow_mappings_cache');
      if (cachedTasks) setTasks(JSON.parse(cachedTasks));
      if (cachedRoles) setRoles(JSON.parse(cachedRoles));
      if (cachedMappings) setSystemMappings(ensureRequiredMappings(JSON.parse(cachedMappings)));
      return;
    }

    setIsSyncing(true);
    try {
      const fetchedTasks = await fetchTasks(accessToken, sheetId);
      const fetchedRoles = await fetchRoles(accessToken, sheetId);
      const fetchedMappings = await fetchMappings(accessToken, sheetId);
      const finalMappings = ensureRequiredMappings(fetchedMappings);
      setTasks(fetchedTasks);
      setRoles(fetchedRoles);
      setSystemMappings(finalMappings);
      
      // Update local storage cache
      localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(fetchedTasks));
      localStorage.setItem('sheetflow_roles_cache', JSON.stringify(fetchedRoles));
      localStorage.setItem('sheetflow_mappings_cache', JSON.stringify(finalMappings));
      setError(null);

      // Crucial Sync: Save the Google Sheet data directly to the Firestore Sandbox shared DB
      // so employee credentials can be fetched even if they log in via a sandbox session on another device/browser
      try {
        await Promise.all([
          saveSandboxTasks(fetchedTasks),
          saveSandboxRoles(fetchedRoles),
          saveSandboxMappings(finalMappings)
        ]);
        console.log('Successfully backed up/synced Google Sheets data to Firestore sandbox DB.');
      } catch (fsErr) {
        console.warn('Silent warning: Could not sync Sheets data to Firestore sandbox DB:', fsErr);
      }
    } catch (err: any) {
      console.error('Error syncing sheet data:', err);
      // Fallback to cache
      const cachedTasks = localStorage.getItem('sheetflow_tasks_cache');
      const cachedRoles = localStorage.getItem('sheetflow_roles_cache');
      const cachedMappings = localStorage.getItem('sheetflow_mappings_cache');
      if (cachedTasks) setTasks(JSON.parse(cachedTasks));
      if (cachedRoles) setRoles(JSON.parse(cachedRoles));
      if (cachedMappings) setSystemMappings(ensureRequiredMappings(JSON.parse(cachedMappings)));
      
      const errMsg = err.message || String(err);
      const isApiDisabled = errMsg.includes('403') || errMsg.includes('disabled') || errMsg.includes('not been used');
      
      if (isApiDisabled) {
        setIsLocalSandboxMode(true);
        localStorage.setItem('sheetflow_sandbox_mode', 'true');
        setSandboxFallbackWarning(true);
        setError(null);
      } else {
        setError(`Sync failure: ${errMsg}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger manual sync
  const handleManualSync = () => {
    if (token && spreadsheetId) {
      syncData(token, spreadsheetId);
    }
  };

  // Log in action
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser({
          email: result.user.email || '',
          name: result.user.displayName || result.user.email || 'Google User',
          photoURL: result.user.photoURL || undefined
        });
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setError(`Login failed: ${err.message || 'Please check popup authorization permissions'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Credential-based Team Login
  const handleCustomLogin = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoggingIn(true);
    try {
      // 1. Try to fetch up-to-date roles from Firestore sandbox first (shared central database)
      let roster: UserRole[] = [];
      try {
        const fsRoles = await getSandboxRoles();
        if (fsRoles && fsRoles.length > 0) {
          roster = fsRoles;
          localStorage.setItem('sheetflow_roles_cache', JSON.stringify(fsRoles));
        }
      } catch (fsErr) {
        console.warn('Could not load roles from Firestore on login, falling back to cache:', fsErr);
      }

      // 2. Fall back to local storage cache if Firestore load is unsuccessful or empty
      if (roster.length === 0) {
        const cachedRolesStr = localStorage.getItem('sheetflow_roles_cache');
        if (cachedRolesStr) {
          roster = JSON.parse(cachedRolesStr);
        } else {
          roster = defaultRoles;
        }
      }

      const matched = roster.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matched) {
        const customUser = {
          email: matched.email,
          name: matched.name,
        };
        const customToken = 'local-credentials-token';
        
        setUser(customUser);
        setToken(customToken);
        setRoles(roster);
        
        localStorage.setItem('sheetflow_custom_user', JSON.stringify(customUser));
        localStorage.setItem('sheetflow_custom_token', customToken);

        // Fetch up-to-date tasks from Firestore sandbox as well
        let tasksList: Task[] = [];
        try {
          const fsTasks = await getSandboxTasks();
          if (fsTasks && fsTasks.length > 0) {
            tasksList = fsTasks;
            localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(fsTasks));
          }
        } catch (fsErr) {
          console.warn('Could not load tasks from Firestore on login, falling back to cache:', fsErr);
        }

        if (tasksList.length === 0) {
          const cachedTasks = localStorage.getItem('sheetflow_tasks_cache');
          if (cachedTasks) {
            tasksList = JSON.parse(cachedTasks);
          } else {
            tasksList = defaultTasks;
          }
        }
        
        setTasks(tasksList);

        // Fetch mappings from Firestore sandbox as well
        let mappingsList: DeptMapping[] = [];
        try {
          const fsMappings = await getSandboxMappings();
          if (fsMappings && fsMappings.length > 0) {
            mappingsList = fsMappings;
            localStorage.setItem('sheetflow_mappings_cache', JSON.stringify(fsMappings));
          }
        } catch (fsErr) {
          console.warn('Could not load mappings from Firestore on login, falling back to cache:', fsErr);
        }

        if (mappingsList.length === 0) {
          const cachedMappings = localStorage.getItem('sheetflow_mappings_cache');
          if (cachedMappings) {
            mappingsList = ensureRequiredMappings(JSON.parse(cachedMappings));
          } else {
            mappingsList = defaultMappings;
          }
        }

        setSystemMappings(mappingsList);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Custom login failed:', err);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Log out action
  const handleLogout = async () => {
    try {
      if (localStorage.getItem('sheetflow_custom_user')) {
        localStorage.removeItem('sheetflow_custom_user');
        localStorage.removeItem('sheetflow_custom_token');
        setUser(null);
        setToken(null);
        setTasks([]);
        setActiveView('my-tasks');
        return;
      }

      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setTasks([]);
      setRoles([]);
      localStorage.removeItem('task_manager_spreadsheet_id');
      setActiveView('my-tasks');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Active user's computed role & department from Roles sheet
  const activeUserRole = useMemo(() => {
    if (!user) return { role: 'employee' as RoleType, department: 'General' };
    
    // Explicit override for the main workspace owner to ensure they have admin command
    const isOwner = user.email.toLowerCase() === 'harpinder@ablyworks.com';
    
    const matched = roles.find(r => r.email.toLowerCase() === user.email.toLowerCase());
    if (matched) {
      const normalizedRole = isOwner ? 'admin' : ((matched.role || 'employee').toLowerCase() as RoleType);
      const normalizedDept = isOwner ? 'Management' : (matched.department || 'General');
      return { role: normalizedRole, department: normalizedDept };
    }

    // Default to admin if they are the sheet owner/creator or owner
    if (roles.length === 0 || isOwner) {
      return { role: 'admin' as RoleType, department: 'Management' };
    }

    // Standard employee fallback
    return { role: 'employee' as RoleType, department: 'General' };
  }, [user, roles]);

  // Handle saving custom Spreadsheet ID manually
  const handleSaveCustomSheetId = async () => {
    if (!customSheetId.trim() || !token) return;
    
    setIsSyncing(true);
    setError(null);
    try {
      let id = customSheetId.trim();
      // Handle spreadsheet url format as input too (extremely user-friendly!)
      if (id.includes('/d/')) {
        const parts = id.split('/d/');
        if (parts[1]) {
          id = parts[1].split('/')[0];
        }
      }

      const details = await getSpreadsheetDetails(token, id);
      setSpreadsheetName(details.name);
      setSpreadsheetUrl(details.url);
      setSpreadsheetId(id);
      localStorage.setItem('task_manager_spreadsheet_id', id);
      
      setShowSheetIdInput(false);
      setCustomSheetId('');
      
      // Sync tasks & roles from this spreadsheet
      await syncData(token, id);

    } catch (err: any) {
      console.error('Error changing sheet ID:', err);
      setError(`Invalid Spreadsheet ID or missing permissions: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Task API Operations
  const handleSaveTask = async (task: Task) => {
    if (!token) return;
    
    // Optimistic state update
    const previousTasks = [...tasks];
    const isEdit = tasks.some(t => t.id === task.id);
    
    let nextTasks = [];
    if (isEdit) {
      nextTasks = tasks.map(t => t.id === task.id ? task : t);
    } else {
      nextTasks = [...tasks, task];
    }
    setTasks(nextTasks);
    localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(nextTasks));

    if (selectedTaskForDetails && selectedTaskForDetails.id === task.id) {
      setSelectedTaskForDetails(task);
    }

    if (token === 'local-credentials-token' || isLocalSandboxMode || !spreadsheetId) {
      // Offline/credential-based: write to local storage and Firestore
      await saveSandboxTasks(nextTasks);
      return;
    }

    try {
      if (isEdit) {
        await updateTask(token, spreadsheetId, task);
      } else {
        await addTask(token, spreadsheetId, task);
      }
      // Re-sync to guarantee alignment
      await syncData(token, spreadsheetId);
    } catch (err) {
      // Revert state on error
      setTasks(previousTasks);
      localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(previousTasks));
      throw err;
    }
  };

  const handleToggleTaskStatus = async (task: Task, remarks?: string) => {
    if (!token) return;

    const nextStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    
    let activityLogStr = task.activityLog || '[]';
    if (nextStatus === 'Completed' && remarks) {
      try {
        const logs = JSON.parse(activityLogStr);
        const formatDateTime = (date: Date) => {
          const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          };
          return date.toLocaleString('en-US', options).replace(',', '');
        };
        logs.push({
          timestamp: formatDateTime(new Date()),
          authorName: user?.name || user?.email.split('@')[0] || 'Unknown User',
          authorEmail: user?.email || '',
          text: `Closed/Completed task with remarks: "${remarks}"`
        });
        activityLogStr = JSON.stringify(logs);
      } catch (e) {
        console.error(e);
      }
    } else if (nextStatus === 'Pending') {
      try {
        const logs = JSON.parse(activityLogStr);
        const formatDateTime = (date: Date) => {
          const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          };
          return date.toLocaleString('en-US', options).replace(',', '');
        };
        logs.push({
          timestamp: formatDateTime(new Date()),
          authorName: user?.name || user?.email.split('@')[0] || 'Unknown User',
          authorEmail: user?.email || '',
          text: `Reopened task back to Pending queue.`
        });
        activityLogStr = JSON.stringify(logs);
      } catch (e) {
        console.error(e);
      }
    }

    const updated: Task = { 
      ...task, 
      status: nextStatus,
      remarks: remarks || (nextStatus === 'Pending' ? '' : task.remarks || ''),
      activityLog: activityLogStr
    };

    // Optimistic update
    const previousTasks = [...tasks];
    const nextTasks = tasks.map(t => t.id === task.id ? updated : t);
    setTasks(nextTasks);
    localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(nextTasks));

    // Also update selected task for details modal if open so it updates live
    if (selectedTaskForDetails && selectedTaskForDetails.id === task.id) {
      setSelectedTaskForDetails(updated);
    }

    if (token === 'local-credentials-token' || isLocalSandboxMode || !spreadsheetId) {
      // Offline/credential-based
      await saveSandboxTasks(nextTasks);
      return;
    }

    try {
      await updateTask(token, spreadsheetId, updated);
      await syncData(token, spreadsheetId);
    } catch (err: any) {
      setTasks(previousTasks);
      localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(previousTasks));
      setError(`Failed to update task status in Google Sheets: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;

    // Optimistic update
    const previousTasks = [...tasks];
    const nextTasks = tasks.filter(t => t.id !== taskId);
    setTasks(nextTasks);
    localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(nextTasks));

    if (token === 'local-credentials-token' || isLocalSandboxMode || !spreadsheetId) {
      // Offline/credential-based
      await saveSandboxTasks(nextTasks);
      return;
    }

    try {
      await deleteTask(token, spreadsheetId, taskId);
      await syncData(token, spreadsheetId);
    } catch (err: any) {
      setTasks(previousTasks);
      localStorage.setItem('sheetflow_tasks_cache', JSON.stringify(previousTasks));
      setError(`Failed to delete task from Google Sheets: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (activeUserRole.role !== 'admin') return;

    // Build the CSV headers and data
    const headers = [
      'Task ID',
      'Title',
      'Description',
      'Department/Source',
      'Assignee Email',
      'Assignee Name',
      'Due Date',
      'Status',
      'Priority',
      'Created Date',
      'Created By',
      'Remarks',
      'Activity Log Count'
    ];

    const rows = filteredTasks.map(t => {
      let logCount = 0;
      try {
        logCount = JSON.parse(t.activityLog || '[]').length;
      } catch {}

      return [
        t.id,
        t.title,
        t.description || '',
        t.source,
        t.assigneeEmail,
        t.assigneeName,
        t.dueDate,
        t.status,
        t.priority,
        t.createdDate,
        t.createdBy,
        t.remarks || '',
        logCount
      ];
    });

    // Escape and format fields for CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(field => {
          const stringified = String(field).replace(/"/g, '""');
          return `"${stringified}"`;
        }).join(',')
      )
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create clean file name based on filter settings
    const dateStr = new Date().toISOString().split('T')[0];
    const viewName = activeView.replace('-tasks', '');
    const filename = `sheetflow_tasks_${viewName}_${dateStr}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // User Role API Operations
  const handleSaveUserRole = async (userRole: UserRole) => {
    // Save to local storage roster cache instantly
    const previousRoles = [...roles];
    const isEdit = roles.some(r => r.email.toLowerCase() === userRole.email.toLowerCase());
    let nextRoles = [];
    if (isEdit) {
      nextRoles = roles.map(r => r.email.toLowerCase() === userRole.email.toLowerCase() ? userRole : r);
    } else {
      nextRoles = [...roles, userRole];
    }
    setRoles(nextRoles);
    localStorage.setItem('sheetflow_roles_cache', JSON.stringify(nextRoles));

    if (token === 'local-credentials-token' || isLocalSandboxMode || !spreadsheetId) {
      await saveSandboxRoles(nextRoles);
      return;
    }
    
    try {
      await saveUserRole(token, spreadsheetId, userRole);
      await syncData(token, spreadsheetId);
    } catch (err: any) {
      setRoles(previousRoles);
      localStorage.setItem('sheetflow_roles_cache', JSON.stringify(previousRoles));
      setError(`Failed to save user role details to Sheets: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteUserRole = async (email: string) => {
    const previousRoles = [...roles];
    const nextRoles = roles.filter(r => r.email.toLowerCase() !== email.toLowerCase());
    setRoles(nextRoles);
    localStorage.setItem('sheetflow_roles_cache', JSON.stringify(nextRoles));

    if (token === 'local-credentials-token' || isLocalSandboxMode || !spreadsheetId) {
      await saveSandboxRoles(nextRoles);
      return;
    }

    try {
      await deleteUserRole(token, spreadsheetId, email);
      await syncData(token, spreadsheetId);
    } catch (err: any) {
      setRoles(previousRoles);
      localStorage.setItem('sheetflow_roles_cache', JSON.stringify(previousRoles));
      setError(`Failed to delete user role from Sheets: ${err.message}`);
      throw err;
    }
  };

  // Department Mapping API Operations
  const handleSaveMappings = async (updatedMappings: DeptMapping[]) => {
    const previousMappings = [...systemMappings];
    setSystemMappings(updatedMappings);
    localStorage.setItem('sheetflow_mappings_cache', JSON.stringify(updatedMappings));

    if (token === 'local-credentials-token' || isLocalSandboxMode || !spreadsheetId) {
      await saveSandboxMappings(updatedMappings);
      return;
    }

    try {
      setIsSyncing(true);
      await saveAllMappings(token, spreadsheetId, updatedMappings);
      await syncData(token, spreadsheetId);
      setError(null);
    } catch (err: any) {
      setSystemMappings(previousMappings);
      localStorage.setItem('sheetflow_mappings_cache', JSON.stringify(previousMappings));
      setError(`Failed to save department mappings: ${err.message || err}`);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Collect all unique sources across all system mappings dynamically for filter lists
  const allAvailableSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    systemMappings.forEach(m => {
      m.sources.forEach(s => {
        if (s) sourcesSet.add(s);
      });
    });
    // Add Personal Checklist as standard fallback source option
    sourcesSet.add('Personal');
    return Array.from(sourcesSet);
  }, [systemMappings]);

  // Filter Tasks dynamically based on active view and user role
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const emailMatch = t.assigneeEmail.toLowerCase() === user?.email.toLowerCase();
      const isOverdue = new Date(t.dueDate) < new Date() && t.status === 'Pending';
      const departmentMatch = (t.department || t.source || '').toLowerCase().trim() === activeUserRole.department.toLowerCase().trim();

      const rVal = activeUserRole.role?.toLowerCase();
      const dVal = activeUserRole.department?.toLowerCase();
      const isManagementOrAdmin = rVal === 'admin' || dVal === 'management' || dVal === 'executive management' || dVal?.includes('management');

      // VIEW BOUNDARIES
      if (activeView === 'my-tasks') {
        if (t.status !== 'Pending') return false;

        if (!isManagementOrAdmin) {
          if (activeUserRole.role === 'employee') {
            if (!emailMatch) return false;
          } else if (activeUserRole.role === 'manager') {
            // If manager toggle is active, show entire department tasks, else only self
            if (managerDepartmentToggle) {
              if (!departmentMatch && !emailMatch) return false;
            } else {
              if (!emailMatch) return false;
            }
          }
        }
      }

      else if (activeView === 'overdue-tasks') {
        if (!isOverdue) return false;

        if (!isManagementOrAdmin) {
          if (activeUserRole.role === 'employee') {
            if (!emailMatch) return false;
          } else if (activeUserRole.role === 'manager') {
            if (!departmentMatch && !emailMatch) return false;
          }
        }
      }

      else if (activeView === 'completed-tasks') {
        if (t.status !== 'Completed') return false;

        if (!isManagementOrAdmin) {
          if (activeUserRole.role === 'employee') {
            if (!emailMatch) return false;
          } else if (activeUserRole.role === 'manager') {
            if (!departmentMatch && !emailMatch) return false;
          }
        }
      }

      else if (activeView === 'all-tasks') {
        // Hide personal tasks of other users unless assigned to me or created by me
        if (t.source === 'Personal' && t.createdBy !== user?.email && !emailMatch) {
          return false;
        }

        if (isManagementOrAdmin) {
          // Can see everyone's tasks across all departments/users
        } else if (activeUserRole.role === 'manager') {
          // Can only see their departmental tasks (or tasks assigned to/created by them)
          if (!departmentMatch && !emailMatch) {
            return false;
          }
        } else {
          // Employee fallback (though they shouldn't access this tab, be safe)
          if (!emailMatch) return false;
        }
      }

      else if (activeView === 'admin-dashboard') {
        // Admin subview handles task dashboard listing.
        // Managers can see all non-personal tasks or department tasks
        // Anyone in Management department can see everything too!
        if (!isManagementOrAdmin) {
          if (activeUserRole.role === 'manager') {
            if (t.source === 'Personal' && t.createdBy !== user?.email) return false;
          }
        }
      }

      // SEARCH QUERY MATCHING
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesAssignee = t.assigneeName.toLowerCase().includes(query) || t.assigneeEmail.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      // DROPDOWN FILTER MATCHING
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [tasks, activeView, activeUserRole, user?.email, managerDepartmentToggle, searchQuery, sourceFilter, priorityFilter]);

  // Load screen during initial authorization
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-500 border-t-transparent mb-3"></div>
        <p className="text-xs font-mono text-slate-500 tracking-wider">SECURE AUTHORIZATION CHECK...</p>
      </div>
    );
  }

  // Not logged in view
  if (!user || !token) {
    return <LoginScreen onLogin={handleLogin} onCustomLogin={handleCustomLogin} isLoggingIn={isLoggingIn} error={error} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-100 relative overflow-x-hidden">
      
      {/* Radial background gradient and glass meshes */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-[-10%] w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Navigation Header */}
      <Header
        user={user}
        role={activeUserRole.role}
        department={activeUserRole.department}
        spreadsheetId={spreadsheetId}
        spreadsheetName={spreadsheetName}
        spreadsheetUrl={spreadsheetUrl}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        onRefresh={handleManualSync}
        onSelectSpreadsheet={() => setShowSheetIdInput(true)}
        isSyncing={isSyncing}
        isLocalSandboxMode={isLocalSandboxMode}
        onToggleSandboxMode={(val) => {
          setIsLocalSandboxMode(val);
          localStorage.setItem('sheetflow_sandbox_mode', val ? 'true' : 'false');
          if (!val) {
            // Turning off sandbox mode: try to sync with sheet backend
            setError(null);
            setTimeout(() => {
              if (token && token !== 'local-credentials-token') {
                handleManualSync();
              }
            }, 100);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">

        {/* Sync/Error Banner alerts */}
        {sandboxFallbackWarning && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg backdrop-blur-md relative z-10">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-semibold text-xs leading-none mb-1 text-amber-300">Google Sheets API Disabled - Offline Sandbox Activated</p>
                <p className="text-[11px] text-amber-400 leading-relaxed font-medium">
                  We detected that Google Drive or Google Sheets API is disabled in your Google Cloud Project. 
                  To ensure a fast, seamless experience, the app has **automatically switched to Sandbox Mode (Offline)**.
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  All task changes, role updates, and department mappings will be saved locally in your browser. 
                  To use real-time Google Sheets sync, enable Google Drive & Sheets API in Google Cloud Console and click "try syncing google sheets" in the top bar.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSandboxFallbackWarning(false)} 
              className="px-3 py-1 text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 cursor-pointer transition-all whitespace-nowrap self-end md:self-center"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg backdrop-blur-md relative z-10">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-semibold text-xs leading-none mb-1 text-red-300">Database Sync Error</p>
                <p className="text-[11px] text-red-400 leading-relaxed font-medium">{error}</p>
                <p className="text-[10px] text-amber-400 mt-1.5 font-semibold">
                  Google Drive / Google Sheets API may be disabled in your Google Cloud Project. 
                  You can enable it using the links above, or switch to Sandbox Mode below to run fully offline.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
              <button 
                onClick={() => {
                  setIsLocalSandboxMode(true);
                  localStorage.setItem('sheetflow_sandbox_mode', 'true');
                  setError(null);
                }}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg transition-all"
              >
                Switch to Sandbox Mode (Offline)
              </button>
              <button onClick={() => setError(null)} className="text-xs font-semibold text-red-400 hover:text-red-300">Dismiss</button>
            </div>
          </div>
        )}

        {/* Syncing Overlay Loader */}
        {isSyncing && tasks.length === 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12 text-center shadow-lg flex flex-col items-center justify-center min-h-[300px]">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-white font-display">Synchronizing Spreadsheet</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs">
              Pulling latest columns and roles from your Google Sheets backend to map permissions...
            </p>
          </div>
        )}

        {/* App Main Content Area */}
        {(!isSyncing || tasks.length > 0) && (
          <div className="space-y-6">

            {/* HEADER SUB-BAR (Search & Actions) for standard view tabs */}
            {activeView !== 'admin-dashboard' && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* View Titles */}
                <div>
                  <h2 className="text-base font-display font-bold text-white leading-none">
                    {activeView === 'my-tasks' && 'My Active Queue'}
                    {activeView === 'overdue-tasks' && 'Overdue Milestones'}
                    {activeView === 'completed-tasks' && 'Completed Archives'}
                    {activeView === 'all-tasks' && 'All Team Tasks'}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight font-medium">
                    {activeView === 'my-tasks' && 'Active checklist assigned to you across department logs.'}
                    {activeView === 'overdue-tasks' && 'High-priority items past deadline date. Immediate response requested.'}
                    {activeView === 'completed-tasks' && 'Successfully completed and synced milestones.'}
                    {activeView === 'all-tasks' && 'Comprehensive team execution log and project milestone records.'}
                  </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Text Search */}
                  <div className="relative max-w-xs w-full sm:w-48 text-xs">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold placeholder:text-slate-500 text-white bg-white/5"
                    />
                  </div>

                  {/* Source Stream Filter */}
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 bg-[#0f172a]/90 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="all">All Sources</option>
                    {allAvailableSources.map(src => (
                      <option key={src} value={src}>
                        {src === 'Personal' ? 'Personal Checklist' : `${src} Stream`}
                      </option>
                    ))}
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 bg-[#0f172a]/90 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="all">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  {/* Manager Department Toggle */}
                  {activeView === 'my-tasks' && activeUserRole.role === 'manager' && (
                    <button
                      onClick={() => setManagerDepartmentToggle(!managerDepartmentToggle)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        managerDepartmentToggle
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 font-bold'
                          : 'border-white/10 text-slate-300 hover:bg-white/10 bg-white/5'
                      }`}
                    >
                      {managerDepartmentToggle ? `Viewing ${activeUserRole.department} Dept` : 'Viewing Only Self'}
                    </button>
                  )}

                  {/* Export CSV Button */}
                  {activeUserRole.role === 'admin' && (
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-md shrink-0"
                      title="Export filtered list to CSV"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}

                  {/* Add task button */}
                  <button
                    onClick={() => {
                      setTaskToEdit(undefined);
                      setIsTaskModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Task</span>
                  </button>

                </div>

              </div>
            )}

            {/* RENDER TASKS GRID FOR MY-TASKS / OVERDUE / COMPLETED */}
            {activeView !== 'admin-dashboard' && (
              <div>
                {filteredTasks.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 py-16 text-center shadow-lg flex flex-col items-center justify-center">
                    <div className="p-3 bg-white/5 text-slate-300 border border-white/10 rounded-2xl mb-3">
                      <LayoutGrid className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white font-display">No tasks found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
                      Try resetting filters, matching search text, or add a new task straight to Google Sheets.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserEmail={user.email}
                        currentUserRole={activeUserRole.role}
                        currentUserDepartment={activeUserRole.department}
                        onToggleStatus={handleToggleTaskStatus}
                        onEdit={(t) => {
                          setTaskToEdit(t);
                          setIsTaskModalOpen(true);
                        }}
                        onDelete={handleDeleteTask}
                        onOpenDetails={(t) => setSelectedTaskForDetails(t)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RENDER ADMIN / MANAGER DASHBOARD */}
            {activeView === 'admin-dashboard' && (activeUserRole.role === 'admin' || activeUserRole.role === 'manager') && (
              <div className="space-y-6">
                
                {/* Admin Subbar Header (KPIs and sub tabs) */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-display font-bold text-white leading-none">
                      {activeUserRole.role === 'admin' ? 'Administrator Operations Command' : `${activeUserRole.department} Manager Station`}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                      Execute full workflow monitoring, audit task logs, review departmental charts, and manage roster permissions.
                    </p>
                  </div>

                  {/* Sub Navigation */}
                  <div className="flex space-x-1.5 bg-[#0f172a]/90 p-1 rounded-xl border border-white/10 self-start md:self-center">
                    <button
                      onClick={() => setAdminSubView('tasks')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        adminSubView === 'tasks' 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Task Database
                    </button>
                    <button
                      onClick={() => setAdminSubView('analytics')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        adminSubView === 'analytics' 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Departmental Reports
                    </button>
                    {activeUserRole.role === 'admin' && (
                      <>
                        <button
                          onClick={() => setAdminSubView('roles')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            adminSubView === 'roles' 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          Roster Setup (Roles)
                        </button>
                        <button
                          onClick={() => setAdminSubView('mappings')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            adminSubView === 'mappings' 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          Field Mappings
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sub View 1: Task Database Grid & Table */}
                {adminSubView === 'tasks' && (
                  <div className="space-y-4">
                    
                    {/* Database Filters Bar */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Search Input */}
                        <div className="relative max-w-xs w-full sm:w-48 text-xs">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                            <Search className="h-3.5 w-3.5" />
                          </div>
                          <input
                            type="text"
                            placeholder="Filter database..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold placeholder:text-slate-500 text-white bg-white/5"
                          />
                        </div>

                        {/* Source Filter */}
                        <select
                          value={sourceFilter}
                          onChange={(e) => setSourceFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 bg-[#0f172a]/90 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        >
                          <option value="all">All Department Sources</option>
                          {allAvailableSources.map(src => (
                            <option key={src} value={src}>
                              {src === 'Personal' ? 'Personal Checklist' : `${src} Stream`}
                            </option>
                          ))}
                        </select>

                        {/* Priority Filter */}
                        <select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 bg-[#0f172a]/90 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        >
                          <option value="all">All Priorities</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      {/* Export CSV Button */}
                      {activeUserRole.role === 'admin' && (
                        <button
                          onClick={handleExportCSV}
                          className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-md shrink-0"
                          title="Export filtered list to CSV"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export CSV</span>
                        </button>
                      )}

                      {/* DB Create Action */}
                      <button
                        onClick={() => {
                          setTaskToEdit(undefined);
                          setIsTaskModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Task Row</span>
                      </button>
                    </div>

                    {/* Master Tasks Grid */}
                    {filteredTasks.length === 0 ? (
                      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 py-16 text-center shadow-lg flex flex-col items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-400">No matching database lines found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            currentUserEmail={user.email}
                            currentUserRole={activeUserRole.role}
                            currentUserDepartment={activeUserRole.department}
                            onToggleStatus={handleToggleTaskStatus}
                            onEdit={(t) => {
                              setTaskToEdit(t);
                              setIsTaskModalOpen(true);
                            }}
                            onDelete={handleDeleteTask}
                            onOpenDetails={(t) => setSelectedTaskForDetails(t)}
                          />
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {/* Sub View 2: Analytics Charts */}
                {adminSubView === 'analytics' && <AnalyticsView tasks={tasks} />}

                {/* Sub View 3: Role and user management */}
                {adminSubView === 'roles' && activeUserRole.role === 'admin' && (
                  <RoleManagement
                    users={roles}
                    currentUserEmail={user.email}
                    onSaveRole={handleSaveUserRole}
                    onDeleteRole={handleDeleteUserRole}
                    isUpdating={isSyncing}
                    systemMappings={systemMappings}
                  />
                )}

                {/* Sub View 4: Mapping Configuration Management */}
                {adminSubView === 'mappings' && activeUserRole.role === 'admin' && (
                  <MappingManagement
                    mappings={systemMappings}
                    onSaveMappings={handleSaveMappings}
                    isUpdating={isSyncing}
                  />
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0f172a]/60 border-t border-white/10 py-6 mt-12 text-center text-slate-500 text-[10px] font-mono tracking-widest backdrop-blur-md relative z-10">
        <span>SHEETFLOW TASK MATRIX • AUTOMATIC GOOGLE WORKSPACE PROTOCOL IN EFFECT</span>
      </footer>

      {/* MODAL 1: CREATE/EDIT TASK */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(undefined);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        usersList={roles}
        currentUserEmail={user.email}
        currentUserRole={activeUserRole.role}
        currentUserDepartment={activeUserRole.department}
        systemMappings={systemMappings}
      />

      {/* MODAL 2: CHANGE SPREADSHEET ID */}
      {showSheetIdInput && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 text-xs">
          <div className="bg-[#0f172a]/90 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-150 text-slate-100">
            <h3 className="text-sm font-display font-bold text-white mb-1.5 flex items-center space-x-2">
              <Database className="h-4.5 w-4.5 text-indigo-400" />
              <span>Connect Custom Google Sheet</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 font-sans leading-relaxed">
              Paste a custom Google Spreadsheet URL or unique file ID to map. Make sure your account has permissions to edit it.
            </p>

            <div className="space-y-3.5 mb-5">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={customSheetId}
                onChange={(e) => setCustomSheetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold"
              />
              <div className="p-3 rounded-xl border border-white/5 bg-white/5 text-[10px] font-mono leading-relaxed text-slate-400 flex items-start space-x-2">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Default file will revert to &quot;{spreadsheetName}&quot; inside your Google Drive if cancelled.</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => {
                  setShowSheetIdInput(false);
                  setCustomSheetId('');
                }}
                className="px-3.5 py-2 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl font-bold font-sans cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomSheetId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-sans cursor-pointer flex items-center space-x-1 transition-all shadow-lg shadow-indigo-500/20"
              >
                <span>Connect Sheet</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TASK DETAILS WORKSPACE */}
      {selectedTaskForDetails && (
        <TaskDetailsModal
          isOpen={true}
          task={selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
          onSaveTask={handleSaveTask}
          currentUserEmail={user.email}
          currentUserName={user.name}
          currentUserRole={activeUserRole.role}
          currentUserDepartment={activeUserRole.department}
          onOpenCompletionModal={(task) => setTaskToCompleteFromDetails(task)}
        />
      )}

      {/* MODAL 4: TASK DETAILS COMPLETION REMARKS */}
      {taskToCompleteFromDetails && (
        <TaskCompletionModal
          isOpen={true}
          task={taskToCompleteFromDetails}
          onClose={() => setTaskToCompleteFromDetails(null)}
          onConfirm={async (remarks) => {
            const task = taskToCompleteFromDetails;
            setTaskToCompleteFromDetails(null);
            await handleToggleTaskStatus(task, remarks);
          }}
        />
      )}

      {/* PWA Installation Triggers for iOS & Android */}
      <PWAInstallPrompt />

    </div>
  );
}
