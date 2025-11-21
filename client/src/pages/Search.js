import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 anim-section">
      <div className="gradient-border hover-lift card-rise">
        <div className="gradient-inner rounded-[1.45rem] p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Search Users</h2>
          <input
            className="w-full input-focus text-white placeholder-white/40"
            placeholder="Search by username or display name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <p className="text-white/70 mt-2">Searching...</p>}
        </div>
      </div>
      <div className="space-y-2">
        {results.map((user) => (
          <Link
            key={user._id}
            to={`/u/${user.username}`}
            className="glass-panel flex items-center gap-3 p-3 hover-lift card-rise"
          >
            {user.avatarUrl ? (
              <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20" />
            )}
            <div>
              <div className="text-white font-medium">{user.displayName || user.username}</div>
              <div className="text-white/70 text-sm">@{user.username}</div>
            </div>
          </Link>
        ))}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="text-white/70 text-center">No users found</p>
        )}
      </div>
    </div>
  );
}

