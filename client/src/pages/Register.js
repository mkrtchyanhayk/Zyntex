import React, { useMemo, useState } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import PasswordStrength from '../components/PasswordStrength';
import zxcvbn from 'zxcvbn';

export default function Register({ onAuth }) {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ username: '', email: '', identifier: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordScore = useMemo(() => form.password ? zxcvbn(form.password).score : 0, [form.password]);
  const usernameOk = useMemo(() => /^[a-z0-9_]{3,20}$/.test(form.username || ''), [form.username]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register' ? { username: form.username, email: form.email, password: form.password } : { identifier: form.identifier || form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      onAuth(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-2 items-center anim-section">
      <div className="hidden lg:flex flex-col gap-6 card-rise">
        <div className="gradient-border hover-lift">
          <div className="gradient-inner rounded-[1.45rem] p-8 space-y-4">
            <p className="uppercase text-xs tracking-[0.45em] text-white/60">The new social canvas</p>
            <h1 className="text-4xl font-black leading-tight">Welcome to <span className="text-aurora">Zyntex</span></h1>
            <p className="text-white/70 text-lg">Blend images, words, groups, and reactions in a single immersive feed.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'DM invites', value: 'Mailbox sync' },
                { label: 'Profile glow', value: 'Custom themes' },
                { label: 'Reactions', value: 'Tap to toggle' },
                { label: 'Recovery', value: 'Secure codes' }
              ].map((item) => (
                <div key={item.label} className="glass-panel px-4 py-3 border-white/5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
                  <p className="text-sm text-white mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 space-y-3">
          <p className="text-sm text-white/70">Dual mode experience</p>
          <p className="text-white text-lg">Register with just a username, or login instantly via username/email. Password strength guidance built-in.</p>
        </div>
      </div>

      <div className="glass-panel p-6 hover-lift card-rise delay-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white capitalize">{mode}</h2>
          <button
            className="text-sm text-white/70 hover:text-white transition"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? (
              <>
                Have an account? <span className="font-semibold text-white">Log in</span>
              </>
            ) : (
              'Need an account?'
            )}
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-white/80">Username</label>
              <input
                className="input-focus w-full text-white placeholder-white/40"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="lowercase, 3-20, a-z 0-9 _"
                required
              />
              {!usernameOk && form.username && (
                <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  <span>Use 3-20 lowercase letters, numbers or underscore.</span>
                </p>
              )}
            </div>
          )}
          {mode === 'register' ? (
            <div>
              <label className="block text-sm font-medium mb-1 text-white/80">Email (optional)</label>
              <input
                type="email"
                className="input-focus w-full text-white placeholder-white/40"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@domain.com"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1 text-white/80">Email or Username</label>
              <input
                className="input-focus w-full text-white placeholder-white/40"
                name="identifier"
                value={form.identifier}
                onChange={onChange}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-focus w-full text-white placeholder-white/40 pr-10"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder={mode === 'register' ? 'Create a strong password' : 'Enter your password'}
                required
              />
              {form.password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              )}
            </div>
            {mode === 'register' && form.password && <PasswordStrength password={form.password} />}
          </div>
          {error && <Alert>{error}</Alert>}
          <button
            className="neon-btn w-full disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={mode === 'register' && (!usernameOk || passwordScore < 2)}
          >
            {mode === 'register' ? 'Create account' : 'Login'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <a href="/forgot" className="text-sm text-white/70 hover:text-white transition">Forgot password?</a>
          </div>
        )}
      </div>
    </div>
  );
}

