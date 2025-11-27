import { createPortal } from 'react-dom';

export default function FabButton({ onClick, disabled }) {
  return createPortal(
    <button
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-40 z-[9999] border border-white/20"
      aria-label="Compose"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>,
    document.body
  );
}

