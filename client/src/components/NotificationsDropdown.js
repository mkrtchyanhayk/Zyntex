import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TimeAgo from './TimeAgo';

export default function NotificationsDropdown({ onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/api/notifications');
                setNotifications(data);
            } catch (e) {
                console.error('Failed to fetch notifications', e);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    return (
        <div className="absolute top-12 right-0 w-80 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-semibold text-primary">Notifications</h3>
                <button onClick={onClose} className="text-secondary hover:text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto soft-scrollbar">
                {loading ? (
                    <p className="p-4 text-center text-secondary text-sm">Loading...</p>
                ) : notifications.length === 0 ? (
                    <p className="p-4 text-center text-secondary text-sm">No notifications yet.</p>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n._id}
                            className={`p-3 border-b border-white/5 hover:bg-white/5 transition flex gap-3 ${!n.read ? 'bg-white/5' : ''}`}
                            onClick={() => markRead(n._id)}
                        >
                            <div className="mt-1">
                                {n.title === 'New Like' && <span className="text-pink-500">❤️</span>}
                                {n.title === 'New Comment' && <span className="text-blue-400">💬</span>}
                                {n.title === 'New Follower' && <span className="text-green-400">👤</span>}
                                {n.title === 'New Reply' && <span className="text-purple-400">↩️</span>}
                                {n.title === 'New Reaction' && <span className="text-yellow-400">✨</span>}
                            </div>
                            <div className="flex-1">
                                <Link to={n.link || '#'} className="block" onClick={onClose}>
                                    <p className="text-sm text-primary">{n.body}</p>
                                    <p className="text-xs text-secondary mt-1"><TimeAgo date={n.createdAt} /></p>
                                </Link>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-accent-primary mt-2"></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
