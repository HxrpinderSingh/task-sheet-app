import { useState } from 'react';
import { Task, RoleType } from '../types';
import ConfirmDialog from './ConfirmDialog';
import TaskCompletionModal from './TaskCompletionModal';
import { 
  Calendar, 
  User, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

interface TaskCardProps {
  key?: string;
  task: Task;
  currentUserEmail: string;
  currentUserRole: RoleType;
  currentUserDepartment?: string;
  onToggleStatus: (task: Task, remarks?: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  onOpenDetails: (task: Task) => void;
}

export default function TaskCard({
  task,
  currentUserEmail,
  currentUserRole,
  currentUserDepartment = '',
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenDetails
}: TaskCardProps) {
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'Pending';
  const isCompleted = task.status === 'Completed';

  // Calculate if task is due within the next 24 hours and is still pending
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const isApproaching = task.status === 'Pending' && diffTime > 0 && diffTime <= 24 * 60 * 60 * 1000;

  // Determine priority color
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Low':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  // Determine source/department color
  const getSourceStyle = (source: string) => {
    switch (source) {
      case 'HRMS':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'ATS':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Strategy':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Management':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Personal':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  // Check if current user is authorized to edit/delete this task
  const rVal = currentUserRole?.toLowerCase();
  const dVal = currentUserDepartment?.toLowerCase();
  const isManagementOrAdmin = 
    rVal === 'admin' || 
    dVal === 'management' || 
    dVal === 'executive management' || 
    dVal?.includes('management');

  const canEdit = 
    isManagementOrAdmin || 
    (currentUserRole === 'manager' && task.source !== 'Personal') || 
    task.createdBy === currentUserEmail ||
    task.assigneeEmail === currentUserEmail;

  const canDelete = 
    isManagementOrAdmin || 
    (task.source === 'Personal' && task.createdBy === currentUserEmail);

  // Custom formatted due date
  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return 'No due date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Safe toggler that requests confirmation or completion remarks
  const handleToggleClick = () => {
    if (task.status === 'Pending') {
      setIsCompletionOpen(true);
    } else {
      setToggleConfirmOpen(true);
    }
  };

  const handleConfirmToggle = async () => {
    setToggleConfirmOpen(false);
    await onToggleStatus(task);
  };

  const handleConfirmComplete = async (remarks: string) => {
    setIsCompletionOpen(false);
    await onToggleStatus(task, remarks);
  };

  // Safe deleter that requests confirmation
  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirmOpen(false);
    await onDelete(task.id);
  };

  let logCount = 0;
  try {
    logCount = JSON.parse(task.activityLog || '[]').length;
  } catch {}

  // Calculate completion progress percentage based on status and activity log entries
  const getProgressPercentage = () => {
    if (isCompleted) return 100;
    if (logCount === 0) return 0;
    if (logCount === 1) return 25;
    if (logCount === 2) return 50;
    if (logCount === 3) return 75;
    return 90; // 4 or more updates means 90% near completion
  };

  const progressPercent = getProgressPercentage();
  
  // Circle geometry for circular progress ring
  const strokeWidth = 3;
  const radius = 15; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Dynamic progress ring color matching the status
  const getProgressColor = (percent: number) => {
    if (percent === 100) return 'text-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.3)]';
    if (percent >= 75) return 'text-indigo-400 drop-shadow-[0_0_3px_rgba(129,140,248,0.3)]';
    if (percent >= 50) return 'text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.3)]';
    if (percent >= 25) return 'text-sky-400 drop-shadow-[0_0_3px_rgba(56,189,248,0.3)]';
    return 'text-slate-600';
  };

  return (
    <div 
      id={`task-card-${task.id}`} 
      className={`bg-white/5 backdrop-blur-md rounded-2xl border p-5 shadow-lg transition-all relative flex flex-col justify-between hover:border-indigo-500/50 group ${
        isCompleted 
          ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75' 
          : isOverdue 
            ? 'border-rose-500/40 ring-1 ring-rose-500/15 bg-rose-500/[0.02]' 
            : isApproaching
              ? 'border-amber-500/50 ring-1 ring-amber-500/20 bg-amber-500/[0.03]'
              : 'border-white/10'
      }`}
    >
      <div>
        {/* Card Header: Tags, Priority & Actions */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {task.department && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                {task.department}
              </span>
            )}
            {task.source && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide border border-teal-500/20 bg-teal-500/10 text-teal-300">
                {task.source}
              </span>
            )}
            {task.module && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide border border-purple-500/20 bg-purple-500/10 text-purple-300">
                {task.module}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide border ${getPriorityStyle(task.priority)}`}>
              {task.priority} Priority
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onOpenDetails(task)}
              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all cursor-pointer flex items-center space-x-1 shrink-0"
              title="Workspace & Logs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {logCount > 0 && (
                <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
                  {logCount}
                </span>
              )}
            </button>
            {canEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer"
                title="Edit Task"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-md transition-all cursor-pointer"
                title="Delete Task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Task Title & Progress Ring */}
        <div className="flex items-start justify-between space-x-3 mb-2">
          <div className="flex items-start space-x-2.5 min-w-0 flex-1">
            <button
              onClick={handleToggleClick}
              className={`mt-0.5 focus:outline-none transition-all cursor-pointer shrink-0 ${
                isCompleted ? 'text-emerald-400' : 'text-slate-400 hover:text-indigo-400'
              }`}
              title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
            >
              <CheckCircle2 className={`h-5 w-5 ${isCompleted ? 'fill-emerald-500/10' : ''}`} />
            </button>
            
            <h3 className={`text-sm font-semibold font-sans tracking-tight ${
              isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'
            }`}>
              {task.title}
            </h3>
          </div>

          {/* Progress Ring Visualization */}
          <div 
            className="flex flex-col items-center justify-center shrink-0 mt-0.5" 
            title={`Completion Progress: ${progressPercent}% (Based on task updates)`}
          >
            <div className="relative h-9 w-9 flex items-center justify-center group/ring">
              <svg className="w-9 h-9 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className="text-white/5"
                  strokeWidth={strokeWidth}
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className={`transition-all duration-700 ease-out ${getProgressColor(progressPercent)}`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              {/* Inner Text */}
              <span className={`absolute text-[8px] font-bold font-mono tracking-tighter ${
                isCompleted ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <p className={`text-xs text-slate-300 mb-4 pl-7 leading-relaxed font-normal ${isCompleted ? 'text-slate-500/80' : ''}`}>
          {task.description || <span className="italic text-slate-500">No description provided.</span>}
        </p>
      </div>

      {/* Card Footer: Date, Assignee */}
      <div className="pt-3 border-t border-white/10 pl-7 flex flex-col space-y-2 text-[11px] text-slate-300">
        
        {/* Due Date Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className={isOverdue ? 'text-rose-400 font-semibold' : isApproaching ? 'text-amber-400 font-semibold' : ''}>
              {formatDueDate(task.dueDate)}
            </span>
          </div>
          
          {isOverdue && (
            <span className="flex items-center space-x-1 text-rose-400 font-semibold uppercase tracking-wider text-[9px]">
              <AlertCircle className="h-3 w-3" />
              <span>Overdue</span>
            </span>
          )}
          {isApproaching && (
            <span className="flex items-center space-x-1 text-amber-400 font-semibold uppercase tracking-wider text-[9px] animate-pulse">
              <Clock className="h-3 w-3" />
              <span>Due Soon</span>
            </span>
          )}
          {isCompleted && (
            <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[9px]">
              Done
            </span>
          )}
        </div>

        {/* Assignee Indicator */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={`${task.assigneeName} (${task.assigneeEmail})`}>
              {task.assigneeEmail === currentUserEmail ? 'Me' : task.assigneeName || task.assigneeEmail}
            </span>
          </div>
          
          {task.createdBy && task.createdBy !== task.assigneeEmail && (
            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]" title={`Created by: ${task.createdBy}`}>
              By: {task.createdBy.split('@')[0]}
            </span>
          )}
        </div>

      </div>

      <ConfirmDialog
        isOpen={toggleConfirmOpen}
        title="Confirm Task Update"
        message={`Are you sure you want to mark the task "${task.title}" as ${task.status === 'Pending' ? 'Completed' : 'Pending'}? \n\nThis will synchronize directly to your Google Sheets database.`}
        confirmText="Yes, Update"
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Confirm Task Deletion"
        message={`CRITICAL ACTION: Are you sure you want to delete the task "${task.title}"? \n\nThis will PERMANENTLY delete the row from your Google Sheets database and cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <TaskCompletionModal
        isOpen={isCompletionOpen}
        task={task}
        onClose={() => setIsCompletionOpen(false)}
        onConfirm={handleConfirmComplete}
      />

    </div>
  );
}
