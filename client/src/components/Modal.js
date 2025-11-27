import React from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl gradient-border modal-shell animate-in fade-in zoom-in duration-200">
          <div className="gradient-inner p-0 rounded-[1.45rem] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary">{title}</h3>
              <button className="w-9 h-9 rounded-full bg-white/10 text-primary hover:bg-white/20 transition flex items-center justify-center" onClick={onClose}>✕</button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto soft-scrollbar">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
