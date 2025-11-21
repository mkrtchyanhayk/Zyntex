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

  if (error && !user) return <p className="text-red-600 text-sm">{error}</p>;
  if (!user) return <p className="text-white/70">Loading...</p>;
  const isOwnProfile = me?._id === user._id;

  return (
    <div className="space-y-6 anim-section">
      <div className="gradient-border card-rise">
        <div className="gradient-inner rounded-[1.45rem] p-6">
          <div className="flex items-center gap-4 mb-4">
            {user.avatarUrl ? (
              <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-purple-400" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <div className="text-xl font-semibold text-white">{user.displayName || user.username}</div>
              <div className="text-white/70">@{user.username}</div>
              {user.bio && <p className="mt-2 text-white/90 max-w-2xl">{user.bio}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                <span>{user.followerCount || 0} followers</span>
                <span>{user.followingCount || 0} following</span>
              </div>
            </div>
            {!isOwnProfile && (
              <button
                className={`neon-btn ${isFollowing ? 'opacity-70' : ''}`}
                onClick={handleFollow}
                disabled={loading}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post, idx) => (
          <div key={post._id} className="gradient-border hover-lift card-rise" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="gradient-inner rounded-[1.45rem] overflow-hidden">
            {post.imageUrl && <img src={getImageUrl(post.imageUrl)} alt={post.caption} className="w-full h-60 object-cover" />}
            {post.textContent && <div className="p-4 whitespace-pre-wrap text-white">{post.textContent}</div>}
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-white/70">No posts yet.</p>}
      </div>
    </div>
  );
}

