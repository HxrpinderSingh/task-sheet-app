import React, { useState } from 'react';
import { X, CheckSquare, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskCompletionModalProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
}

export default function TaskCompletionModal({
  isOpen,
  task,
  onClose,
  onConfirm,
}: TaskCompletionModalProps) {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Remarks are mandatory to complete and close this task.');
      return;
    }
    setError('');
    onConfirm(remarks.trim());
    setRemarks('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in" id="completion-modal-overlay">
      <div 
        className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative"
        id="completion-modal-card"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-500/10 text-emerald-300 p-2 rounded-xl">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">complete task.</h3>
              <p className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-widest mt-0.5">final verification ✅</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-white/2 border border-white/5 rounded-2xl p-4 shadow-inner">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold">
              task to complete
            </span>
            <p className="text-xs font-semibold text-white mt-1.5 line-clamp-2">
              {task.title.toLowerCase()}
            </p>
          </div>

          <div>
            <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-2 pl-1">
              closing remarks <span className="text-rose-400 font-bold">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              placeholder="provide completion remarks or client feedback..."
              rows={4}
              className="w-full px-4 py-3 rounded-[18px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-xs font-semibold bg-black/20 text-white placeholder:text-slate-500 transition-all"
            />
            {error && (
              <div className="flex items-center space-x-1.5 mt-2.5 text-rose-300 text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                <span>⚠️ {error.toLowerCase()}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold rounded-[16px] border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs font-bold rounded-[16px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_8px_24px_-4px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer active:scale-95 border border-emerald-500/20"
            >
              complete & close 🎉
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
