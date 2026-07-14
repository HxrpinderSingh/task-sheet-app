import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-2xl text-slate-100 font-sans overflow-hidden"
          >
            {/* Top highlight bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${isDestructive ? 'bg-rose-500' : 'bg-indigo-500'}`} />

            <div className="flex items-start space-x-3.5 mt-2">
              <div className={`p-2 rounded-xl shrink-0 ${isDestructive ? 'bg-rose-500/15 text-rose-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                {isDestructive ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <HelpCircle className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line font-medium">
                  {message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6 pt-3 border-t border-white/5">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer text-slate-300"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
