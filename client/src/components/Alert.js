export default function Alert({ type = 'error', children }) {
  const getColors = () => {
    if (type === 'success') return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (type === 'info') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };
  return (
    <div className={`border rounded-lg px-3 py-2 text-sm ${getColors()} backdrop-blur-sm`}>{children}</div>
  );
}

