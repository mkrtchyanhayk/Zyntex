import React, { useEffect, useState } from 'react';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';
import PostCard from '../components/PostCard';

export default function Profile({ token }) {
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [stats, setStats] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '', isPrivate: false });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [usernameForm, setUsernameForm] = useState('');

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/users/me');
      setMe(data);
      setForm({
        displayName: data.displayName || '',
        bio: data.bio || '',
        isPrivate: data.isPrivate || false
      });
      fetchPosts(data.username);
    } catch (e) {
      setMe(null);
      setMsg('Unable to load profile. Please ensure the API is running.');
    }
  };

  const fetchPosts = async (username) => {
    try {
      const { data } = await api.get(`/api/users/${username}/posts`);
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLikedPosts = async () => {
    setLikedPosts([]);
  };

  const fetchMyComments = async () => {
    setMyComments([]);
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/users/me/stats');
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'liked') fetchLikedPosts();
    if (activeTab === 'comments') fetchMyComments();
    if (activeTab === 'dashboard') fetchStats();
  }, [activeTab]);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      let body;
      if (file) {
        const fd = new FormData();
        fd.append('displayName', form.displayName || '');
        fd.append('bio', form.bio || '');
        fd.append('isPrivate', form.isPrivate);
        fd.append('avatar', file);
        body = fd;
      } else {
        body = {
          displayName: form.displayName || '',
          bio: form.bio || '',
          isPrivate: form.isPrivate
        };
      }
      await api.put('/api/users/me', body);
      setMsg('Profile updated successfully!');
      setFile(null);
      fetchMe();
      setTimeout(() => setIsEditing(false), 1500);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to update profile');
    }
  };

  const updatePostState = (updated) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updated._id ? { ...p, ...updated, author: updated.author || p.author } : p))
    );
  };

  if (!token) return <p className="text-secondary">Please log in to manage your profile.</p>;
  if (!me) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-aurora border-t-transparent rounded-full animate-spin" /></div>;

  const memberYear = me?.createdAt ? new Date(me.createdAt).getFullYear() : '—';

  // Calculate stats
  const totalReach = posts.reduce((acc, post) => acc + (post.seenBy?.length || 0), 0);
  const totalEngagement = posts.reduce((acc, post) => {
    const likes = post.likes?.length || 0;
    // Reactions are stored in a Map or Object, need to count them if 'likes' field isn't used for reactions
    // But Post model has 'reactions' map. 'likes' might be legacy or specific.
    // Let's check Post model again. It has 'reactions' map.
    // The 'likes' field might not be there or might be different.
    // Wait, Post model has `reactions` map. It doesn't seem to have `likes` array in the schema I saw earlier?
    // Let's check the schema I viewed.
    // Schema: reactions: Map, seenBy: [ObjectId], hideLikeCount: Boolean.
    // It does NOT have `likes` array in the snippet I saw.
    // But `getFeed` aggregation adds `commentCount`.
    // And `PostCard` uses `getReactionSummary` to count reactions.

    let reactionCount = 0;
    if (post.reactions) {
      if (post.reactions instanceof Map) {
        post.reactions.forEach(users => reactionCount += users.length);
      } else {
        Object.values(post.reactions).forEach(users => reactionCount += users.length);
      }
    }
    return acc + reactionCount + (post.commentCount || post.comments?.length || 0);
  }, 0);

  const totalFollowers = me.followers?.length || 0;

  return (
    <div className="space-y-8 anim-section">
      <div className="gradient-border hover-lift card-rise">
        <div className="gradient-inner rounded-[1.45rem] p-6 flex flex-col lg:flex-row gap-6 relative">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="absolute top-6 right-6 px-4 py-2 rounded-full bg-white/10 text-primary hover:bg-white/20 transition-all z-10 text-sm font-medium backdrop-blur-md border border-white/10"
            title="Professional Dashboard"
          >
            Dashboard
          </button>

          <div className="relative w-28 h-28">
            {me.avatarUrl ? (
              <img src={getImageUrl(me.avatarUrl)} alt="avatar" className="w-28 h-28 rounded-3xl object-cover border-2 border-white/20 shadow-2xl" />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl font-bold text-primary/80">
                {me.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-3 -right-3 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] uppercase tracking-[0.4em] text-primary/80 backdrop-blur-md">You</span>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-secondary">Profile resonance</p>
            <h2 className="text-3xl font-black text-primary">{me.displayName || me.username}</h2>
            <p className="text-secondary">@{me.username}</p>
            {me.bio && <p className="text-primary/80 max-w-2xl">{me.bio}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="pill text-secondary">Member since {memberYear}</span>
              {me.isPrivate && <span className="pill text-aurora border-aurora/30">Private Account</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-2 overflow-x-auto">
        {['posts', 'liked', 'comments', 'dashboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${activeTab === tab
              ? 'bg-white/10 text-primary font-semibold'
              : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {posts.map((post, idx) => (
              <div key={post._id} style={{ animationDelay: `${idx * 0.05}s` }} className="stagger-item">
                <PostCard
                  post={post}
                  token={token}
                  me={me}
                  onUpdate={updatePostState}
                />
              </div>
            ))}
            {posts.length === 0 && (
              <div className="glass-panel p-12 text-center text-secondary">
                You haven't posted anything yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="text-center py-12 text-secondary glass-panel">
            <p>Liked posts will appear here.</p>
            <p className="text-xs mt-2 opacity-60">(Feature coming soon)</p>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="text-center py-12 text-secondary glass-panel">
            <p>Your comments history.</p>
            <p className="text-xs mt-2 opacity-60">(Feature coming soon)</p>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 space-y-2">
                <h4 className="text-secondary text-sm uppercase tracking-wider">Total Reach</h4>
                <p className="text-3xl font-bold text-primary">{totalReach}</p>
                <div className="text-secondary text-xs">Lifetime views</div>
              </div>
              <div className="glass-panel p-6 space-y-2">
                <h4 className="text-secondary text-sm uppercase tracking-wider">Engagement</h4>
                <p className="text-3xl font-bold text-primary">{totalEngagement}</p>
                <div className="text-secondary text-xs">Reactions & Comments</div>
              </div>
              <div className="glass-panel p-6 space-y-2">
                <h4 className="text-secondary text-sm uppercase tracking-wider">Followers</h4>
                <p className="text-3xl font-bold text-primary">{totalFollowers}</p>
                <div className="text-secondary text-xs">Total audience</div>
              </div>
            </div>

            <div className="glass-panel p-8">
              <h3 className="text-xl font-semibold text-primary mb-6 flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Profile Settings
              </h3>
              <form className="space-y-6" onSubmit={save}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Display Name</label>
                    <input className="input-focus w-full text-primary placeholder-secondary/40 bg-surface/50 border-white/10" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="relative group cursor-pointer overflow-hidden rounded-full w-12 h-12 border border-white/10">
                        {file ? (
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        ) : me?.avatarUrl ? (
                          <img src={getImageUrl(me.avatarUrl)} alt="current" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-secondary">?</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="text-xs text-secondary">
                        <p>Click to upload new avatar</p>
                        <p className="opacity-60">Recommended: 400x400px</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Bio</label>
                  <textarea className="input-focus w-full min-h-[100px] text-primary placeholder-secondary/40 bg-surface/50 border-white/10" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${form.isPrivate ? 'bg-aurora' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isPrivate ? 'left-5' : 'left-1'}`} />
                  </div>
                  <div>
                    <span className="font-semibold block text-primary text-sm">Private Account</span>
                    <span className="text-xs text-secondary">Only followers can see your posts</span>
                  </div>
                </div>

                {msg && (
                  <div className={`p-3 rounded-lg text-sm ${msg.includes('Failed') || msg.includes('error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {msg}
                  </div>
                )}
                <div className="flex justify-end">
                  <button className="neon-btn px-8" type="submit">Save Changes</button>
                </div>
              </form>

              <div className="pt-8 mt-8 border-t border-white/10 space-y-6">
                <h4 className="text-primary font-semibold flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Account Management
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input className="flex-1 input-focus text-primary placeholder-secondary/40 bg-surface/50 border-white/10" placeholder="New username" value={usernameForm} onChange={(e) => setUsernameForm(e.target.value)} />
                  <button
                    className="px-6 py-2 rounded-full bg-white/10 text-primary hover:bg-white/20 transition border border-white/10"
                    type="button"
                    onClick={async () => {
                      try {
                        await api.patch('/api/users/me/username', { newUsername: usernameForm });
                        setMsg('Username updated');
                        setUsernameForm('');
                        fetchMe();
                      } catch (e) {
                        setMsg(e.response?.data?.message || 'Failed to change username');
                      }
                    }}
                  >
                    Update Username
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
