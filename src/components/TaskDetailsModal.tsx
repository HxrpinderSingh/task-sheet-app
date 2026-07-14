import React, { useState } from 'react';
import { X, Calendar, User, MessageSquare, Clock, Send, ShieldAlert, CornerDownRight, CheckSquare } from 'lucide-react';
import { Task, ActivityLogEntry, RoleType } from '../types';

interface TaskDetailsModalProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => Promise<void>;
  currentUserEmail: string;
  currentUserName: string;
  currentUserRole: RoleType;
  currentUserDepartment?: string;
  onOpenCompletionModal: (task: Task) => void;
}

export default function TaskDetailsModal({
  isOpen,
  task,
  onClose,
  onSaveTask,
  currentUserEmail,
  currentUserName,
  currentUserRole,
  currentUserDepartment,
  onOpenCompletionModal,
}: TaskDetailsModalProps) {
  const [updateText, setUpdateText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ActivityLogEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const rNormal = currentUserRole?.toLowerCase();
  const dNormal = currentUserDepartment?.toLowerCase();
  const isManagementOrAdmin = rNormal === 'admin' || dNormal === 'management' || dNormal === 'executive management' || dNormal?.includes('management');
  const canReply = isManagementOrAdmin || rNormal === 'manager';

  // Parse activity log
  let logEntries: ActivityLogEntry[] = [];
  try {
    logEntries = JSON.parse(task.activityLog || '[]');
  } catch (err) {
    console.error('Error parsing activity log:', err);
    logEntries = [];
  }

  // Format date helper: "12 Jul 26 8:34 PM"
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

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timestampStr = formatDateTime(now);
      
      const newEntry: ActivityLogEntry & { id: string; parentId?: string } = {
        id: `log-${now.getTime()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: timestampStr,
        authorName: currentUserName || currentUserEmail.split('@')[0],
        authorEmail: currentUserEmail,
        text: updateText.trim(),
      };

      if (replyingTo) {
        // Find parent entry ID or timestamp (fallback)
        const parentId = (replyingTo as any).id || replyingTo.timestamp + '-' + replyingTo.authorEmail;
        newEntry.parentId = parentId;
      }

      const updatedEntries = [...logEntries, newEntry];
      const updatedTask: Task = {
        ...task,
        activityLog: JSON.stringify(updatedEntries),
      };

      await onSaveTask(updatedTask);
      setUpdateText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to post task progress update:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group logs into parents and replies
  const parentLogs = logEntries.filter(entry => {
    const parentId = (entry as any).parentId;
    if (!parentId) return true;
    // If parent doesn't exist anymore, treat as parent log
    return !logEntries.some(e => ((e as any).id === parentId || e.timestamp + '-' + e.authorEmail === parentId));
  });

  const getRepliesFor = (parent: ActivityLogEntry) => {
    const parentKey = (parent as any).id || parent.timestamp + '-' + parent.authorEmail;
    return logEntries.filter(entry => (entry as any).parentId === parentKey);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4 z-40 animate-fade-in" id="details-modal-overlay">
      <div 
        className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh]"
        id="details-modal-card"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/10 text-indigo-300 p-2 rounded-xl">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">task details.</h3>
              <p className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-widest mt-0.5">collaboration & updates</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 scrollbar-none">
          {/* Section 1: Task Core Details */}
          <div className="bg-white/2 border border-white/5 rounded-[24px] p-5 space-y-4 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                  {task.source.toLowerCase()} stream
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                  task.priority === 'High' 
                    ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' 
                    : task.priority === 'Medium' 
                      ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' 
                      : 'border-slate-500/20 bg-slate-500/10 text-slate-300'
                }`}>
                  {task.priority.toLowerCase()} priority
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider">
                {task.status === 'Completed' ? (
                  <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                    <span>completed ✅</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-slate-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-lg">
                    <span>pending ⌛</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-display font-black tracking-tight text-white leading-snug">{task.title}</h2>
              <p className="text-xs text-slate-300 mt-2.5 whitespace-pre-wrap leading-relaxed">{task.description || "No description provided."}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span className="text-[11px] font-medium">due date: <strong className="text-slate-200">{task.dueDate}</strong></span>
              </div>
              <div className="flex items-center space-x-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <User className="h-4 w-4 text-indigo-400" />
                <span className="truncate text-[11px] font-medium">assignee: <strong className="text-slate-200" title={task.assigneeEmail}>{task.assigneeName?.toLowerCase() || task.assigneeEmail.toLowerCase()}</strong></span>
              </div>
            </div>

            {task.remarks && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 text-xs text-slate-300">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                  completion remarks / closing notes
                </span>
                <p className="italic leading-relaxed font-semibold">"{task.remarks}"</p>
              </div>
            )}
          </div>

          {/* Section 2: Progress Updates Activity Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400 animate-pulse-slow" />
                <span>execution logs & activity</span>
              </h4>
              <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-indigo-300">
                {logEntries.length} updates
              </span>
            </div>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 border border-white/5 rounded-[24px] p-4.5 bg-black/20 scrollbar-none" id="activity-log-container">
              {parentLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 italic">No progress logs recorded for this task yet.</p>
                </div>
              ) : (
                parentLogs.map((entry, idx) => {
                  const replies = getRepliesFor(entry);
                  const entryKey = (entry as any).id || entry.timestamp + '-' + entry.authorEmail;
                  return (
                    <div key={idx} className="space-y-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      {/* Parent Log Block */}
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300 shrink-0">
                          {entry.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-bold text-slate-200 truncate">{entry.authorName.toLowerCase()}</span>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">{entry.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-200 mt-1.5 leading-relaxed bg-white/5 rounded-[18px] p-3 shadow-inner">
                            {entry.text}
                          </p>

                          {/* Reply Trigger */}
                          {canReply && (
                            <button
                              onClick={() => setReplyingTo(entry)}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 mt-1.5 flex items-center space-x-1 cursor-pointer"
                            >
                              <span>💬 reply to update</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {replies.map((reply, replyIdx) => (
                        <div key={replyIdx} className="flex items-start space-x-3 pl-8 pt-1">
                          <CornerDownRight className="h-4 w-4 text-slate-600 mt-2 shrink-0" />
                          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-300 shrink-0">
                            {reply.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-300 truncate">{reply.authorName.toLowerCase()}</span>
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.2 rounded border border-indigo-500/20">staff reply</span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 shrink-0">{reply.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-white/2 border border-white/5 rounded-[16px] p-2.5 mt-1.5 italic">
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Task Footer Panel (Add updates & Complete actions) */}
        <div className="p-4 border-t border-white/5 bg-slate-950/60 backdrop-blur-xl shrink-0 space-y-3 rounded-b-[32px]">
          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5 text-[11px] text-indigo-300">
              <span className="truncate">
                Replying to <strong>{replyingTo.authorName.toLowerCase()}</strong>'s update
              </span>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-indigo-400 hover:text-indigo-200 font-bold shrink-0 cursor-pointer ml-2"
              >
                clear
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Quick Complete Action */}
            {task.status === 'Pending' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCompletionModal(task);
                }}
                className="py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-300 border border-emerald-500/20 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <CheckSquare className="h-4 w-4" />
                <span>close / complete ✅</span>
              </button>
            )}

            {/* Input Form */}
            <form onSubmit={handlePostUpdate} className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder={replyingTo ? "add staff instructions..." : "share a progress update..."}
                className="flex-1 px-4 py-2.5 rounded-[16px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-semibold bg-black/20 text-white placeholder:text-slate-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !updateText.trim()}
                className="h-9.5 w-9.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[16px] flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                title="Send Update"
              >
                <Send className="h-3.5 w-3.5 animate-pulse-slow" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
