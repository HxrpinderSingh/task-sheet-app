import { useState } from 'react';
import { User } from 'firebase/auth';
import { RoleType } from '../types';
import { 
  Database, 
  RefreshCw, 
  LogOut, 
  User as UserIcon, 
  BarChart3, 
  CheckSquare, 
  Clock, 
  ListTodo, 
  ExternalLink,
  Settings,
  ChevronDown,
  Layers
} from 'lucide-react';

interface HeaderProps {
  user: {
    email: string;
    name: string;
    photoURL?: string;
  };
  role: RoleType;
  department: string;
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  activeView: 'my-tasks' | 'overdue-tasks' | 'completed-tasks' | 'admin-dashboard' | 'all-tasks';
  setActiveView: (view: 'my-tasks' | 'overdue-tasks' | 'completed-tasks' | 'admin-dashboard' | 'all-tasks') => void;
  onLogout: () => void;
  onRefresh: () => void;
  onSelectSpreadsheet: () => void;
  isSyncing: boolean;
}

export default function Header({
  user,
  role,
  department,
  spreadsheetId,
  spreadsheetName,
  spreadsheetUrl,
  activeView,
  setActiveView,
  onLogout,
  onRefresh,
  onSelectSpreadsheet,
  isSyncing
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const rNormal = role?.toLowerCase();
  const dNormal = department?.toLowerCase();
  const isManagementOrAdmin = rNormal === 'admin' || dNormal === 'management' || dNormal === 'executive management' || dNormal?.includes('management');
  const hasAllTasksAccess = isManagementOrAdmin || rNormal === 'manager';

  const getRoleLabel = (r: RoleType) => {
    switch (r) {
      case 'admin':
        return { text: 'Administrator', bg: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 'manager':
        return { text: `Manager - ${department || 'General'}`, bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { text: 'Employee', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
    }
  };

  const roleStyle = getRoleLabel(role);

  return (
    <header id="app-header" className="sticky top-0 z-40 text-slate-100 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Floating Glass Dock / Dynamic Island */}
        <div className="glass-panel bg-slate-950/60 rounded-[24px] border border-white/10 px-4 sm:px-6 py-3 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.6)] backdrop-blur-3xl flex flex-col md:flex-row gap-3 items-center justify-between transition-all duration-300">
          
          {/* Logo & Sheet Status */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5 group cursor-pointer">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white p-2 rounded-2xl shadow-[0_4px_12px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-all duration-300">
                <Database className="h-4.5 w-4.5 animate-bounce-subtle" />
              </div>
              <div>
                <h1 className="text-base font-display font-black tracking-tight text-white leading-none">
                  task manager.
                </h1>
                <p className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                  sheets sync 🚀
                </p>
              </div>
            </div>

            {/* Google Sheets Status Indicator - Visible to Admins ONLY */}
            {role === 'admin' && spreadsheetId && (
              <div className="hidden md:flex items-center space-x-2.5 pl-4 border-l border-white/10">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[150px]" title={spreadsheetName}>
                      {spreadsheetName.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-400">
                    <a 
                      href={spreadsheetUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-indigo-300 flex items-center space-x-0.5 transition-all"
                    >
                      <span>open sheet</span>
                      <ExternalLink className="h-2 w-2" />
                    </a>
                    <span>•</span>
                    <button 
                      onClick={onSelectSpreadsheet} 
                      className="hover:text-slate-200 underline font-semibold transition-all cursor-pointer"
                    >
                      switch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links - iOS Segmented Control Dock */}
          <nav className="flex items-center space-x-1 bg-black/40 p-1 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveView('my-tasks')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'my-tasks'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10 scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>my tasks</span>
            </button>

            <button
              onClick={() => setActiveView('overdue-tasks')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'overdue-tasks'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>overdue 🚨</span>
            </button>

            <button
              onClick={() => setActiveView('completed-tasks')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'completed-tasks'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>done ✅</span>
            </button>

            {hasAllTasksAccess && (
              <button
                onClick={() => setActiveView('all-tasks')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'all-tasks'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>feed 📋</span>
              </button>
            )}

            {(role === 'admin' || role === 'manager') && (
              <button
                onClick={() => setActiveView('admin-dashboard')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'admin-dashboard'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{role === 'admin' ? 'admin' : 'manager'}</span>
              </button>
            )}
          </nav>

          {/* User Controls & Sync */}
          <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className={`p-2.5 text-slate-300 hover:text-white bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer active:scale-95 ${
                isSyncing ? 'cursor-not-allowed opacity-50' : ''
              }`}
              title="Sync with Google Sheets"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block pr-1.5 pl-0.5">
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                    {user.name.toLowerCase()}
                  </p>
                  <span className={`inline-block px-1.5 py-0.2 text-[8px] font-bold font-mono uppercase border rounded-md mt-0.5 ${roleStyle.bg}`}>
                    {roleStyle.text.toLowerCase()}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1 text-xs">
                    {/* Add Sheet Link to Menu for Mobile - Visible to Admins ONLY */}
                    {role === 'admin' && spreadsheetId && (
                      <a
                        href={spreadsheetUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg md:hidden"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        <span>Open Google Sheet</span>
                      </a>
                    )}
                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onSelectSpreadsheet();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg text-left cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5 text-slate-400" />
                        <span>Change Spreadsheet ID</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg text-left cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </header>
  );
}
