export default function FabButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl bg-[radial-gradient(circle_at_30%_30%,#f472b6,transparent),radial-gradient(circle_at_70%_70%,#6366f1,transparent)] text-white text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-40 z-[120] border border-white/20 pointer-events-auto"
      aria-label="Compose"
    >
      +
    </button>
  );
}

