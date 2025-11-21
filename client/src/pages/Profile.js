import React, { useEffect, useState } from 'react';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';

export default function Profile({ token }) {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ displayName: '', bio: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [usernameForm, setUsernameForm] = useState('');

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/users/me');
      setMe(data);
      setForm({ displayName: data.displayName || '', bio: data.bio || '' });
    } catch (e) {
      setMe(null);
      setMsg('Unable to load profile. Please ensure the API is running.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      let body;
      if (file) {
        const fd = new FormData();
        fd.append('displayName', form.displayName || '');
        fd.append('bio', form.bio || '');
        fd.append('avatar', file);
        body = fd;
      } else {
        body = { displayName: form.displayName || '', bio: form.bio || '' };
      }
      await api.put('/api/users/me', body);
      setMsg('Profile updated successfully!');
      setFile(null);
      fetchMe();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to update profile');
    }
  };

  if (!token) return <p>Please log in to manage your profile.</p>;
  if (!me) return <p>Loading...</p>;

  const memberYear = me?.createdAt ? new Date(me.createdAt).getFullYear() : '—';

  return (
    <div className="space-y-8 anim-section">
      <div className="gradient-border hover-lift card-rise">
        <div className="gradient-inner rounded-[1.45rem] p-6 flex flex-col lg:flex-row gap-6">
          <div className="relative w-28 h-28">
            {me.avatarUrl ? (
              <img src={getImageUrl(me.avatarUrl)} alt="avatar" className="w-28 h-28 rounded-3xl object-cover border-2 border-white/20 shadow-2xl" />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl font-bold text-white/80">
                {me.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-3 -right-3 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] uppercase tracking-[0.4em] text-white/80">You</span>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Profile resonance</p>
            <h2 className="text-3xl font-black">{me.displayName || me.username}</h2>
            <p className="text-white/70">@{me.username}</p>
            {me.bio && <p className="text-white/80 max-w-2xl">{me.bio}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="pill">Member since {memberYear}</span>
              <span className="pill">Live invites synced</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-6 card-rise delay-2">
        <h3 className="text-2xl font-semibold text-white">Edit profile</h3>
        <form className="space-y-5" onSubmit={save}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1 text-white/80">Display name</label>
              <input className="input-focus w-full text-white placeholder-white/40" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white/80">Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-500 file:to-pink-500 file:text-white hover:file:opacity-90 transition"
              />
              {file && <p className="text-xs text-white/60 mt-1">Selected: {file.name}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Bio</label>
            <textarea className="input-focus w-full min-h-[140px] text-white placeholder-white/40" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          {msg && (
            <div className={`p-3 rounded-lg text-sm ${msg.includes('Failed') || msg.includes('error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
              {msg}
            </div>
          )}
          <button className="neon-btn" type="submit">Save changes</button>
        </form>
        <div className="pt-5 border-t border-white/10 space-y-3">
          <h4 className="text-white font-semibold">Change username</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input className="flex-1 input-focus text-white placeholder-white/40" placeholder="new username" value={usernameForm} onChange={(e) => setUsernameForm(e.target.value)} />
            <button
              className="px-5 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
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
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

