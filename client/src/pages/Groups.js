import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import { getImageUrl } from '../utils/imageUrl';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', memberIds: [] });
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/api/groups');
      setGroups(data);
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[a-zA-Z0-9\s\-_]{3,50}$/.test(form.name)) {
      setError('Group name must be 3-50 chars, alphanumeric with spaces, hyphens, underscores');
      return;
    }
    try {
      let body;
      if (file) {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('memberIds', JSON.stringify(form.memberIds));
        fd.append('avatar', file);
        body = fd;
      } else {
        body = { name: form.name, memberIds: form.memberIds };
      }
      await api.post('/api/groups', body);
      setShowCreate(false);
      setForm({ name: '', memberIds: [] });
      setFile(null);
      const { data } = await api.get('/api/groups');
      setGroups(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create group');
    }
  };

  const addMember = (userId) => {
    if (!form.memberIds.includes(userId)) {
      setForm({ ...form, memberIds: [...form.memberIds, userId] });
    }
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 anim-section">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="card-rise">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary/60">Curate your circles</p>
          <h1 className="text-3xl font-bold text-primary">Groups</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="neon-btn"
        >
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto max-h-[calc(100vh-200px)] soft-scrollbar">
        {groups.map((group) => (
          <div
            key={group._id}
            onClick={async () => {
              // ensure we navigate to conversation id, not group id
              const convoId = group.conversationId || (await api.get(`/api/groups/${group._id}/conversation`)).data._id;
              navigate(`/messages/${convoId}`);
            }}
            className="gradient-border cursor-pointer hover-lift card-rise"
          >
            <div className="gradient-inner rounded-[1.45rem] p-5 text-center space-y-3">
              {group.avatarUrl ? (
                <img src={getImageUrl(group.avatarUrl)} alt="group" className="w-16 h-16 rounded-full mx-auto object-cover border border-white/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/15 mx-auto flex items-center justify-center text-secondary">✨</div>
              )}
              <div>
                <div className="text-primary font-semibold">{group.name}</div>
                <div className="text-secondary text-sm">{group.members.length} members</div>
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-secondary">No groups yet</p>}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm({ name: '', memberIds: [] }); setFile(null); }} title="Create Group">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-primary">Group Name</label>
            <input
              className="w-full input-focus text-primary placeholder-secondary/40"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="3-50 chars, alphanumeric"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-primary">Avatar (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-secondary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-primary">Add Members</label>
            <input
              className="w-full input-focus mb-2 text-primary placeholder-secondary/40"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => addMember(user._id)}
                className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg"
              >
                {user.avatarUrl ? (
                  <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                )}
                <div className="text-primary">{user.displayName || user.username}</div>
              </button>
            ))}
            {form.memberIds.length > 0 && (
              <div className="mt-2 text-sm text-secondary">{form.memberIds.length} member(s) selected</div>
            )}
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex gap-2 justify-end">
            <button type="button" className="px-4 py-2 rounded-full border border-white/20 text-secondary hover:bg-white/10 transition" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="neon-btn">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
