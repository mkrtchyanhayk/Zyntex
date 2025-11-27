import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import Search from './pages/Search';
import Groups from './pages/Groups';
import Mailbox from './pages/Mailbox';
import ForgotPassword from './pages/ForgotPassword';
import useMe from './hooks/useMe';
import useTheme from './hooks/useTheme';
import Spinner from './components/Spinner';
import Changelog from './components/Changelog';
import api from './api';
import { getImageUrl } from './utils/imageUrl';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();
  const { me, loading: meLoading } = useMe(!!token);
  const [inviteCounts, setInviteCounts] = useState({ total: 0, dm: 0, group: 0 });
  const [showChangelog, setShowChangelog] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited && !token) {
      sessionStorage.setItem('hasVisited', 'true');
      navigate('/register');
    } else if (!token && location.pathname !== '/register' && location.pathname !== '/forgot' && location.pathname !== '/') {
      navigate('/register');
    }
  }, [token, navigate, location.pathname]);

  useEffect(() => {
    let timer;
    const load = async () => {
      try {
        const { data } = await api.get('/api/invitations/counts');
        setInviteCounts(data);
      } catch { }
    };
    if (token) {
      load();
      timer = setInterval(load, 15000);
    }
    return () => timer && clearInterval(timer);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/register');
  };

  const mailboxBadge = inviteCounts.mailboxTotal ?? ((inviteCounts.total || 0) + (inviteCounts.notifications || 0));

  const navLinks = useMemo(() => ([
    {
      to: '/',
      label: 'Feed',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    },
    {
      to: '/search',
      label: 'Search',
      auth: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    },
    {
      to: '/groups',
      label: 'Groups',
      auth: true,
      badge: inviteCounts.group,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    },
    {
      to: '/messages',
      label: 'DMs',
      auth: true,
      badge: inviteCounts.dm,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    },
    {
      to: '/mailbox',
      label: 'Mailbox',
      auth: true,
      badge: mailboxBadge,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
    }
  ]), [inviteCounts, mailboxBadge]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="gradient-grid" />
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle at 10% 20%, #4c1d95, transparent 35%), radial-gradient(circle at 80% 0%, #be185d, transparent 40%)' }} />
      <div className="floating-orb orb-blue" />
      <div className="floating-orb orb-pink" />
      <div className="floating-orb orb-gold" />
      <header className="sticky top-0 z-40 nav-glass">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link className="flex items-center gap-2 text-3xl font-black tracking-tight text-aurora drop-shadow-lg" to="/">
            Zyntex
            <span className="pulse-dot hidden sm:inline-block" />
          </Link>
          <nav className="hidden md:flex items-center gap-2 nav-shell">
            {navLinks.filter(link => !link.auth || token).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link group relative flex items-center justify-center p-3 rounded-full transition-all ${isActive(link.to) ? 'active text-primary' : 'text-secondary hover:text-primary hover:bg-white/10'}`}
                title={link.label}
              >
                {link.icon}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {link.label}
                </span>
                {link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-semibold flex items-center justify-center text-white shadow-lg">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-all text-secondary hover:text-primary"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            {token && (
              <Link to="/profile" className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full pl-1 pr-3 py-1 hover:bg-white/15 transition-all glow-ring">
                {meLoading ? (
                  <Spinner />
                ) : (
                  <>
                    {me?.avatarUrl ? (
                      <img src={getImageUrl(me.avatarUrl)} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-white/30 shadow-lg" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-primary text-sm">{me?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                    <div className="text-left leading-tight">
                      <span className="text-sm font-semibold text-primary">{me?.displayName || me?.username || 'Profile'}</span>
                      <span className="block text-[11px] text-secondary">@{me?.username || 'you'}</span>
                    </div>
                  </>
                )}
              </Link>
            )}
            {!token ? (
              <Link className="neon-btn text-sm" to="/register">Join Zyntex</Link>
            ) : (
              <button className="text-sm text-secondary hover:text-primary px-4 py-2 rounded-full border border-white/20 hover:border-white/50 transition-all" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
          <div className="w-full md:hidden flex gap-2 overflow-x-auto pt-2">
            {navLinks.filter(link => !link.auth || token).map((link) => (
              <Link
                key={`${link.to}-mobile`}
                to={link.to}
                className={`flex-1 flex justify-center items-center py-2 rounded-full border transition ${isActive(link.to) ? 'border-white/40 text-primary bg-white/10' : 'border-white/10 text-secondary'
                  }`}
              >
                {link.icon}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10 page-shell page-fade">
        <Routes>
          <Route path="/" element={<Feed token={token} />} />
          <Route path="/register" element={<Register onAuth={(t) => { setToken(t); navigate('/'); }} />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile token={token} />} />
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/search" element={<Search />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/mailbox" element={<Mailbox />} />
        </Routes>
      </main>
      <Changelog open={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}
