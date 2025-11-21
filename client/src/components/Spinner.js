export default function Spinner({ className = '' }) {
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 w-5 h-5 ${className}`} />
  );
}

