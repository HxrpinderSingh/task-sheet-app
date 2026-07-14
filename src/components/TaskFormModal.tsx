import { useState, useEffect, FormEvent } from 'react';
import { Task, UserRole, TaskPriority, TaskStatus, RoleType, DeptMapping } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => Promise<void>;
  taskToEdit?: Task; // If provided, we are in Edit mode
  usersList: UserRole[];
  currentUserEmail: string;
  currentUserRole: RoleType;
  currentUserDepartment: string;
  systemMappings: DeptMapping[];
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  usersList,
  currentUserEmail,
  currentUserRole,
  currentUserDepartment,
  systemMappings
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Tech Team');
  const [source, setSource] = useState('');
  const [module, setModule] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive available sources and modules based on selected department mapping
  const currentMapping = systemMappings.find(
    m => m.department.toLowerCase().trim() === department.toLowerCase().trim()
  ) || systemMappings[0] || { department: 'Tech Team', sources: ['General'], modules: ['General'] };

  // Sync state when department changes
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const mapping = systemMappings.find(
      m => m.department.toLowerCase().trim() === newDept.toLowerCase().trim()
    ) || { department: newDept, sources: ['General'], modules: ['General'] };
    
    // Default to the first mapped option
    setSource(mapping.sources[0] || 'General');
    setModule(mapping.modules[0] || 'General');
  };

  // Load task details if in edit mode or set defaults
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setDepartment(taskToEdit.department || 'Tech Team');
      setSource(taskToEdit.source || '');
      setModule(taskToEdit.module || '');
      setAssigneeEmail(taskToEdit.assigneeEmail);
      setDueDate(taskToEdit.dueDate);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
    } else {
      // Sensible defaults for a new task
      setTitle('');
      setDescription('');
      
      // Select default department matching user department if valid, else default to 'Tech Team'
      let defaultDept = 'Tech Team';
      const userDeptNormal = currentUserDepartment?.toLowerCase().trim();
      const hasMatchingMapping = systemMappings.some(
        m => m.department.toLowerCase().trim() === userDeptNormal
      );
      if (currentUserRole === 'admin') {
        defaultDept = 'Management';
      } else if (hasMatchingMapping && currentUserDepartment) {
        // Find the matching casing from systemMappings
        const found = systemMappings.find(m => m.department.toLowerCase().trim() === userDeptNormal);
        defaultDept = found ? found.department : currentUserDepartment;
      }

      setDepartment(defaultDept);
      
      // Pull corresponding sources and modules for that department
      const targetMapping = systemMappings.find(
        m => m.department.toLowerCase().trim() === defaultDept.toLowerCase().trim()
      ) || { department: defaultDept, sources: ['General'], modules: ['General'] };

      setSource(targetMapping.sources[0] || 'General');
      setModule(targetMapping.modules[0] || 'General');
      setAssigneeEmail(currentUserEmail);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      
      setPriority('Medium');
      setStatus('Pending');
    }
    setError(null);
  }, [taskToEdit, isOpen, currentUserEmail, currentUserRole, currentUserDepartment, systemMappings]);

  if (!isOpen) return null;

  // Filter assignees that are available
  // Admins, Managers, and Management/Operations users can assign to anyone. Standard employees can only assign to themselves.
  const rVal = currentUserRole?.toLowerCase();
  const dVal = currentUserDepartment?.toLowerCase();
  const isManagementOrAdmin = rVal === 'admin' || rVal === 'manager' || dVal === 'management' || dVal === 'operations' || dVal?.includes('management');

  const assignableUsers = isManagementOrAdmin 
    ? [...usersList]
    : usersList.filter(u => u.email === currentUserEmail);

  // If the list is empty (e.g. before sync completes), add current user
  if (assignableUsers.length === 0) {
    assignableUsers.push({
      email: currentUserEmail,
      name: 'Me',
      role: currentUserRole,
      department: currentUserDepartment
    });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task Title is required');
      return;
    }
    if (!dueDate) {
      setError('Due Date is required');
      return;
    }
    if (!assigneeEmail) {
      setError('Please assign this task to an employee');
      return;
    }
    if (!department) {
      setError('Please select a Department');
      return;
    }
    if (!source) {
      setError('Please select a Source');
      return;
    }
    if (!module) {
      setError('Please select a Module');
      return;
    }

    // Validation Check: Source/Module combination must be mapped to the chosen Department
    const chosenMapping = systemMappings.find(
      m => m.department.toLowerCase().trim() === department.toLowerCase().trim()
    );

    if (chosenMapping) {
      const isSourceMapped = chosenMapping.sources.length === 0
        ? source.toLowerCase().trim() === 'general'
        : chosenMapping.sources.some(s => s.toLowerCase().trim() === source.toLowerCase().trim());

      const isModuleMapped = chosenMapping.modules.length === 0
        ? module.toLowerCase().trim() === 'general'
        : chosenMapping.modules.some(mOpt => mOpt.toLowerCase().trim() === module.toLowerCase().trim());

      if (!isSourceMapped) {
        setError(`Validation Error: The selected Source '${source}' is not mapped to the '${department}' department. Valid sources are: ${chosenMapping.sources.join(', ')}.`);
        return;
      }

      if (!isModuleMapped) {
        setError(`Validation Error: The selected Module '${module}' is not mapped to the '${department}' department. Valid modules are: ${chosenMapping.modules.join(', ')}.`);
        return;
      }
    } else {
      setError(`Validation Error: No mapping configuration found for the chosen Department '${department}'. Please configure its valid Sources and Modules in the Mappings tab.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Find the assignee's name from the list
    const selectedUser = usersList.find(u => u.email.toLowerCase() === assigneeEmail.toLowerCase());
    const assigneeName = selectedUser ? selectedUser.name : assigneeEmail.split('@')[0];

    const finalTask: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      department: department,
      source: source,
      module: module,
      assigneeEmail: assigneeEmail,
      assigneeName: assigneeName,
      dueDate: dueDate,
      status: status,
      priority: priority,
      createdDate: taskToEdit ? taskToEdit.createdDate : new Date().toISOString().split('T')[0],
      createdBy: taskToEdit ? taskToEdit.createdBy : currentUserEmail,
    };

    // Confirm operation with user
    const actionText = taskToEdit ? 'Update' : 'Create';
    const confirmMessage = `Are you sure you want to ${actionText.toLowerCase()} this task? \nThis will write and synchronize changes directly to the Google Sheets database.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await onSave(finalTask);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to save task to Google Sheet. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="task_form_modal_overlay" className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div id="task_form_modal_container" className="bg-[#0f172a]/90 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col backdrop-blur-xl text-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <h2 id="task_form_modal_title" className="text-base font-display font-bold text-white">
            {taskToEdit ? 'Edit Task Details' : 'Create New Task'}
          </h2>
          <button 
            id="task_form_modal_close_btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
          {error && (
            <div id="task_form_error_alert" className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="task_form_title_input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Correct spelling of 'Attendance' on dashboard"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Description / Notes
            </label>
            <textarea
              id="task_form_desc_input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed notes, steps, or budget constraints..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Mapping Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Department */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Department <span className="text-rose-400">*</span>
              </label>
              <select
                id="task_form_dept_select"
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium"
                disabled={isSubmitting || !isManagementOrAdmin}
              >
                {systemMappings.map(m => (
                  <option key={m.department} value={m.department}>
                    {m.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Source <span className="text-rose-400">*</span>
              </label>
              <select
                id="task_form_source_select"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium"
                disabled={isSubmitting || !isManagementOrAdmin}
              >
                {currentMapping.sources.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                {source && !currentMapping.sources.some(s => s.toLowerCase().trim() === source.toLowerCase().trim()) && (
                  <option value={source}>
                    {source} (Unmapped)
                  </option>
                )}
                {currentMapping.sources.length === 0 && !source && (
                  <option value="General">General</option>
                )}
              </select>
            </div>

            {/* Module */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Module <span className="text-rose-400">*</span>
              </label>
              <select
                id="task_form_module_select"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium"
                disabled={isSubmitting || !isManagementOrAdmin}
              >
                {currentMapping.modules.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {module && !currentMapping.modules.some(m => m.toLowerCase().trim() === module.toLowerCase().trim()) && (
                  <option value={module}>
                    {module} (Unmapped)
                  </option>
                )}
                {currentMapping.modules.length === 0 && !module && (
                  <option value="General">General</option>
                )}
              </select>
            </div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Priority Level
              </label>
              <select
                id="task_form_priority_select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0f172a]/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium"
                disabled={isSubmitting}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Assignee Email <span className="text-rose-400">*</span>
              </label>
              {!isManagementOrAdmin ? (
                <input
                  id="task_form_assignee_disabled_input"
                  type="text"
                  value={currentUserEmail}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 text-xs font-medium"
                  disabled
                />
              ) : (
                <select
                  id="task_form_assignee_select"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0f172a]/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium"
                  disabled={isSubmitting}
                >
                  <option value="">-- Assign Employee --</option>
                  {assignableUsers.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="task_form_duedate_input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0f172a]/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Status (Visible only during edit, defaults to pending during creation) */}
          {taskToEdit && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Workflow Status
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-300">
                  <input
                    id="task_form_status_pending_radio"
                    type="radio"
                    name="status"
                    value="Pending"
                    checked={status === 'Pending'}
                    onChange={() => setStatus('Pending')}
                    className="text-indigo-500 focus:ring-indigo-500 bg-white/5 border-white/10"
                    disabled={isSubmitting}
                  />
                  <span>Pending (Active)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-300">
                  <input
                    id="task_form_status_completed_radio"
                    type="radio"
                    name="status"
                    value="Completed"
                    checked={status === 'Completed'}
                    onChange={() => setStatus('Completed')}
                    className="text-indigo-500 focus:ring-indigo-500 bg-white/5 border-white/10"
                    disabled={isSubmitting}
                  />
                  <span>Completed</span>
                </label>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              id="task_form_cancel_btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 font-semibold transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              id="task_form_save_btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Syncing to Sheets...' : 'Save Task'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
