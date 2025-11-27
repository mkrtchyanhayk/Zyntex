import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Mailbox() {
  const [invites, setInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
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

  const pendingInvites = invites;
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const pendingCount = pendingInvites.length + unreadNotifications.length;

  const getIcon = (type) => {
    switch (type) {
      case 'follow': return '👤';
      case 'like': return '❤️';
      case 'comment': return '💬';
      default: return '🔔';
    }
  };

  const NotificationCard = ({ note }) => (
    <div className={`glass-panel p-4 flex flex-col gap-2 card-rise ${note.read ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getIcon(note.type)}</span>
          <div>
            <p className="text-primary font-medium">{note.title}</p>
            <p className="text-sm text-secondary">{note.body}</p>
            <p className="text-xs text-secondary/60 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {!note.read && <span className="pill bg-rose-500/30 border-rose-300/40 text-rose-100">New</span>}
      </div>
      <div className="flex gap-2 pl-11">
        {note.link && (
          <button
            onClick={() => navigate(note.link)}
            className="px-4 py-2 rounded-full bg-white/10 text-primary hover:bg-white/20 text-sm"
          >
            View
          </button>
        )}
        {!note.read && (
          <button
            onClick={() => markRead(note._id)}
            className="px-3 py-2 rounded-full border border-white/10 text-secondary hover:text-primary text-sm"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 anim-section">
      <div className="gradient-border card-rise">
        <div className="gradient-inner rounded-[1.45rem] p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-secondary">Activity Center</p>
            <h1 className="text-2xl font-bold text-primary">Mailbox</h1>
          </div>
          <span className="pill text-primary">{pendingCount} pending</span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-1">
        <button
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'inbox' ? 'text-aurora border-b-2 border-aurora' : 'text-secondary hover:text-primary'}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'history' ? 'text-aurora border-b-2 border-aurora' : 'text-secondary hover:text-primary'}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {loading ? (
        <p className="text-center text-secondary">Loading mailbox...</p>
      ) : (
        <div className="space-y-6">
          {activeTab === 'inbox' && (
            <>
              {pendingInvites.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-secondary uppercase text-xs tracking-[0.5em]">Pending Invites</h2>
                  {pendingInvites.map((inv) => (
                    <div key={inv._id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 card-rise">
                      <div className="text-primary">
                        <div className="font-medium">From: {inv.from?.displayName || inv.from?.username}</div>
                        <div className="text-secondary text-sm capitalize">Type: {inv.type}{inv.group ? ` • ${inv.group.name}` : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => respond(inv._id, 'accept')} className="px-4 py-2 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-white text-sm">Accept</button>
                        <button onClick={() => respond(inv._id, 'decline')} className="px-4 py-2 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white text-sm">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-secondary uppercase text-xs tracking-[0.5em]">Notifications</h2>
                {unreadNotifications.length === 0 && pendingInvites.length === 0 && (
                  <p className="text-secondary text-center py-8">You're all caught up!</p>
                )}
                {unreadNotifications.map((note) => (
                  <NotificationCard key={note._id} note={note} />
                ))}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h2 className="text-secondary uppercase text-xs tracking-[0.5em]">Past Notifications</h2>
              {readNotifications.length === 0 && <p className="text-secondary text-center py-8">No history yet.</p>}
              {readNotifications.map((note) => (
                <NotificationCard key={note._id} note={note} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

