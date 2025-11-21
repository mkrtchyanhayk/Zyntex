import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Mailbox() {
  const [invites, setInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [inviteRes, notifRes] = await Promise.all([
        api.get('/api/invitations'),
        api.get('/api/notifications')
      ]);
      setInvites(inviteRes.data);
      setNotifications(notifRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const respond = async (id, action) => {
    const { data } = await api.post(`/api/invitations/${id}/respond`, { action });
    if (action === 'accept' && data?.conversationId) {
      navigate(`/messages/${data.conversationId}`);
    } else {
      load();
    }
  };

  const markRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`);
    load();
  };

  const pendingCount = invites.length + notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4 anim-section">
      <div className="gradient-border card-rise">
        <div className="gradient-inner rounded-[1.45rem] p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Invites & approvals</p>
            <h1 className="text-2xl font-bold text-white">Mailbox</h1>
          </div>
          <span className="pill">{pendingCount} pending</span>
        </div>
      </div>
      {loading ? (
        <p className="text-center text-white/70">Loading mailbox...</p>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-white/80 uppercase text-xs tracking-[0.5em]">Invites</h2>
            {invites.length === 0 && <p className="text-white/70 text-center">No pending invites</p>}
            {invites.map((inv)=> (
              <div key={inv._id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 card-rise">
                <div className="text-white">
                  <div className="font-medium">From: {inv.from?.displayName || inv.from?.username}</div>
                  <div className="text-white/70 text-sm capitalize">Type: {inv.type}{inv.group ? ` • ${inv.group.name}`: ''}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>respond(inv._id, 'accept')} className="px-4 py-2 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-white">Accept</button>
                  <button onClick={()=>respond(inv._id, 'decline')} className="px-4 py-2 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white">Decline</button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-white/80 uppercase text-xs tracking-[0.5em]">Reminders</h2>
            {notifications.length === 0 && <p className="text-white/70 text-center">No reminders</p>}
            {notifications.map((note) => (
              <div key={note._id} className="glass-panel p-4 flex flex-col gap-2 card-rise">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{note.title}</p>
                    <p className="text-sm text-white/70">{note.body}</p>
                  </div>
                  {!note.read && <span className="pill bg-rose-500/30 border-rose-300/40 text-rose-100">New</span>}
                </div>
                <div className="flex gap-2">
                  {note.link && (
                    <button
                      onClick={() => navigate(note.link)}
                      className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      Open
                    </button>
                  )}
                  {!note.read && (
                    <button
                      onClick={() => markRead(note._id)}
                      className="px-3 py-2 rounded-full border border-white/10 text-white/70 hover:text-white"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

