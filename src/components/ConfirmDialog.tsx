import React from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog: React.FC = () => {
  const confirmDialog = useStore(state => state.confirmDialog);
  const hideConfirm = useStore(state => state.hideConfirm);

  if (!confirmDialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl border border-border-primary bg-card-bg p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-neutral-450 leading-relaxed">
              {confirmDialog.message}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirmDialog.onCancel) confirmDialog.onCancel();
              hideConfirm();
            }}
            className="flex-1 py-2.5 rounded-lg border border-border-primary text-neutral-400 hover:text-text-primary hover:border-border-hover text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              confirmDialog.onConfirm();
              hideConfirm();
            }}
            className="flex-1 py-2.5 rounded-lg bg-text-primary text-bg-primary hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors select-none"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
