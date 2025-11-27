import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';
import useMe from '../hooks/useMe';

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { me } = useMe(!!token);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    (async () => {
      try {
        const [{ data: u }, { data: p }] = await Promise.all([
          api.get(`/api/users/${username}`),
          api.get(`/api/users/${username}/posts`)
        ]);
        setUser(u);
        setPosts(p);
        setIsFollowing(u.isFollowing || false);
      } catch (e) {
        setError('Failed to load profile');
      }
    })();
  }, [username]);

  const handleFollow = async () => {
    if (!token) {
      navigate('/register');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/api/users/${username}/follow`);
      setIsFollowing(data.isFollowing);
      setUser((prev) => ({
        ...prev,
        followerCount: data.isFollowing ? (prev.followerCount || 0) + 1 : Math.max(0, (prev.followerCount || 1) - 1)
      }));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(a.createdAt || Date.now());
    const dateB = new Date(b.createdAt || Date.now());
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (error && !user) return <p className="text-red-500 text-sm">{error}</p>;
  if (!user) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-aurora border-t-transparent rounded-full animate-spin" /></div>;

  const isOwnProfile = me?._id === user._id;
  const isPrivate = user.isPrivate && !isOwnProfile && !isFollowing;

  return (
    <div className="space-y-6 anim-section">
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {user.avatarUrl ? (
            <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-xl" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div className="flex-1 text-center md:text-left space-y-2">
            <div>
              <h1 className="text-2xl font-bold text-primary">{user.displayName || user.username}</h1>
              <p className="text-secondary">@{user.username}</p>
            </div>

            {user.bio && <p className="text-primary/90 max-w-2xl mx-auto md:mx-0">{user.bio}</p>}

            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
              <div className="text-center md:text-left">
                <span className="block font-bold text-primary text-lg">{user.followerCount || 0}</span>
                <span className="text-secondary">Followers</span>
              </div>
              <div className="text-center md:text-left">
                <span className="block font-bold text-primary text-lg">{user.followingCount || 0}</span>
                <span className="text-secondary">Following</span>
              </div>
              <div className="text-center md:text-left">
                <span className="block font-bold text-primary text-lg">{posts.length}</span>
                <span className="text-secondary">Posts</span>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              className={`px-6 py-2 rounded-full font-semibold transition-all ${isFollowing
                  ? 'bg-surface border border-white/10 text-secondary hover:text-primary hover:border-white/30'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105'
                }`}
              onClick={handleFollow}
              disabled={loading}
            >
              {loading ? '...' : isFollowing ? 'Following' : isPrivate ? 'Request' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {isPrivate ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-secondary">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary">This account is private</h3>
          <p className="text-secondary">Follow this account to see their photos and videos.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Posts</h2>
            <div className="flex bg-surface-muted rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setSortOrder('newest')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${sortOrder === 'newest' ? 'bg-white/10 text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${sortOrder === 'oldest' ? 'bg-white/10 text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
              >
                Oldest
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPosts.map((post, idx) => (
              <div key={post._id} className="glass-panel overflow-hidden hover-tilt group" style={{ animationDelay: `${idx * 0.05}s` }}>
                {post.imageUrl && (
                  <div className="relative aspect-square">
                    <img src={getImageUrl(post.imageUrl)} alt={post.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                      <div className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span className="font-bold">{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        <span className="font-bold">{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {post.textContent && <p className="text-primary text-sm line-clamp-3">{post.textContent}</p>}
                  <div className="flex items-center justify-between text-xs text-secondary pt-2 border-t border-white/5">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-3">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>{post.comments?.length || 0} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sortedPosts.length === 0 && (
              <div className="col-span-full text-center py-12 text-secondary">
                No posts to show.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

