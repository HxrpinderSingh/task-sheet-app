import { useState, FormEvent } from 'react';
import { UserRole, RoleType, DeptMapping } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  UserCheck, 
  AlertCircle, 
  FolderSync, 
  Mail,
  User,
  Plus
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface RoleManagementProps {
  users: UserRole[];
  currentUserEmail: string;
  onSaveRole: (userRole: UserRole) => Promise<void>;
  onDeleteRole: (email: string) => Promise<void>;
  isUpdating: boolean;
  systemMappings: DeptMapping[];
}

export default function RoleManagement({
  users,
  currentUserEmail,
  onSaveRole,
  onDeleteRole,
  isUpdating,
  systemMappings
}: RoleManagementProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('employee');
  const [department, setDepartment] = useState(systemMappings[0]?.department || 'Tech Team');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom confirmation dialog states
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [pendingUserToSave, setPendingUserToSave] = useState<UserRole | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingUserToDelete, setPendingUserToDelete] = useState<UserRole | null>(null);

  // Auto-generate safe random password
  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newPass = '';
    for (let i = 0; i < 8; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPass);
  };

  // Form submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formattedEmail = email.trim().toLowerCase();
    const formattedName = name.trim();
    const finalPassword = password.trim();

    if (!formattedEmail) {
      setError('User Email is required');
      return;
    }
    if (!formattedName) {
      setError('Full Name is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formattedEmail)) {
      setError('Please provide a valid email address');
      return;
    }

    const newUserRole: UserRole = {
      email: formattedEmail,
      name: formattedName,
      role: role,
      department: role === 'admin' ? 'Management' : department,
      password: finalPassword || 'password123',
    };

    // Stage user for custom ConfirmDialog instead of window.confirm
    setPendingUserToSave(newUserRole);
    setSaveConfirmOpen(true);
  };

  // Real action execution when confirm is clicked
  const handleConfirmSave = async () => {
    if (!pendingUserToSave) return;
    setSaveConfirmOpen(false);
    setError(null);
    setSuccess(null);

    try {
      await onSaveRole(pendingUserToSave);
      setSuccess(`User ${pendingUserToSave.name} successfully registered in Google Sheets!`);
      setEmail('');
      setName('');
      setRole('employee');
      setDepartment('HRMS');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to save role data to Google Sheets.');
    } finally {
      setPendingUserToSave(null);
    }
  };

  // Safe delete handler with confirmation
  const handleDeleteClick = async (userToDelete: UserRole) => {
    if (userToDelete.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      alert('Security lock: You cannot delete your own Administrator role!');
      return;
    }

    // Stage user for custom ConfirmDialog instead of window.confirm
    setPendingUserToDelete(userToDelete);
    setDeleteConfirmOpen(true);
  };

  // Real action execution when delete confirm is clicked
  const handleConfirmDelete = async () => {
    if (!pendingUserToDelete) return;
    setDeleteConfirmOpen(false);
    setError(null);
    setSuccess(null);

    try {
      await onDeleteRole(pendingUserToDelete.email);
      setSuccess(`User ${pendingUserToDelete.name} was successfully removed from the backend.`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete role.');
    } finally {
      setPendingUserToDelete(null);
    }
  };

  const getRoleBadge = (r: RoleType) => {
    switch (r) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'manager':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Left Column: Form to Add/Update Users (takes 5 cols) */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg lg:col-span-5 self-start backdrop-blur-md text-slate-100">
        <div className="flex items-center space-x-2 mb-1">
          <UserPlus className="h-4.5 w-4.5 text-slate-300" />
          <h3 className="text-sm font-semibold text-white">Register / Update User Role</h3>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">
          Changes will write instantly as new lines or updates inside your Google Sheet &quot;Roles&quot; tab.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-xl flex items-start space-x-2">
              <UserCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium text-xs leading-relaxed">{success}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Employee Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. employee@company.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-white placeholder:text-slate-500"
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sandra Bullock"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-white placeholder:text-slate-500"
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Password field with generate button */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Login Password
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password or auto-generate"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-white placeholder:text-slate-500 font-mono"
                  disabled={isUpdating}
                />
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="px-3.5 bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-xl font-semibold transition-all cursor-pointer text-xs"
                disabled={isUpdating}
              >
                Generate
              </button>
            </div>
          </div>

          {/* Grid role & department */}
          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#0f172a]/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-white"
                disabled={isUpdating}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#0f172a]/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-white"
                disabled={isUpdating || role === 'admin'}
              >
                {systemMappings.map((m) => (
                  <option key={m.department} value={m.department}>
                    {m.department}
                  </option>
                ))}
                {!systemMappings.some(m => m.department === 'General') && (
                  <option value="General">General</option>
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 cursor-pointer disabled:opacity-50"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <FolderSync className="h-4 w-4 animate-spin" />
                <span>Writing to Sheets...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Register User</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: List of Existing Users (takes 7 cols) */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg lg:col-span-7 backdrop-blur-md text-slate-100">
        <div className="flex items-center space-x-2 mb-1">
          <Users className="h-4.5 w-4.5 text-slate-300" />
          <h3 className="text-sm font-semibold text-white">Team Roster ({users.length})</h3>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">
          Authorized accounts extracted from your spreadsheet. They can log in to view or manage tasks based on their role.
        </p>

        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">User Details</th>
                  <th className="px-4 py-3 font-semibold">Role & Department</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-white/5 transition-all">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-xs">{u.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 text-[10px] font-mono">{u.email}</span>
                        {u.password && (
                          <span className="text-slate-400 text-[9px] font-mono bg-white/5 border border-white/10 px-1 py-0.2 rounded" title="Login Password">
                            PWD: <span className="text-indigo-300 font-semibold select-all">{u.password}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-block self-start px-2 py-0.5 rounded-md text-[9px] font-bold border ${getRoleBadge(u.role)}`}>
                          {u.role.toUpperCase()}
                        </span>
                        <span className="text-slate-300 text-[10px] font-medium font-sans">
                          {u.role === 'admin' ? 'Executive Management' : `${u.department} Department`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteClick(u)}
                        className={`p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer ${
                          u.email.toLowerCase() === currentUserEmail.toLowerCase() 
                            ? 'opacity-30 cursor-not-allowed' 
                            : ''
                        }`}
                        title={u.email.toLowerCase() === currentUserEmail.toLowerCase() ? "Protected" : "Remove user access"}
                        disabled={u.email.toLowerCase() === currentUserEmail.toLowerCase() || isUpdating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                      No team members registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={saveConfirmOpen}
        title="Confirm User Registration"
        message={`Are you sure you want to write role details and password for "${pendingUserToSave?.name || ''}" to Google Sheets? \n\nThis will instantly synchronize and grant them "${pendingUserToSave?.role || ''}" permissions.`}
        confirmText="Register"
        cancelText="Cancel"
        onConfirm={handleConfirmSave}
        onCancel={() => {
          setSaveConfirmOpen(false);
          setPendingUserToSave(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Confirm Permanent Deletion"
        message={`CRITICAL ACTION: Are you sure you want to remove the permissions for "${pendingUserToDelete?.name || ''}" (${pendingUserToDelete?.email || ''})? \n\nThis will PERMANENTLY delete their role mapping from your Google Sheets backend and they will fall back to basic Employee permissions.`}
        confirmText="Delete User"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setPendingUserToDelete(null);
        }}
      />

    </div>
  );
}
