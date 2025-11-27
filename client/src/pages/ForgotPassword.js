import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import PasswordStrength from '../components/PasswordStrength';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const request = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot', { identifier });
      setSuccess(data.message || 'Code sent!');
      if (data?.devCode) {
        setSuccess(`Code sent! Development code: ${data.devCode}`);
      }
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to request reset code');
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset', { identifier, code: code.trim(), newPassword: password });
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/register'), 2000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto gradient-border hover-lift anim-section">
      <div className="gradient-inner rounded-[1.45rem] p-6 card-rise">
        <h1 className="text-2xl font-bold text-primary mb-2">Account Recovery</h1>
        <p className="text-secondary text-sm mb-6">Enter your email or username to receive a reset code</p>

        {step === 1 && (
          <form onSubmit={request} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">Email or Username</label>
              <input
                className="w-full input-focus text-primary placeholder-secondary/40"
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            {error && <Alert>{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
            <button
              className="neon-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <div className="text-center">
              <Link to="/register" className="text-sm text-secondary hover:text-primary transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={reset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">6-Digit Code</label>
              <input
                className="w-full input-focus text-primary placeholder-secondary/40 text-center text-2xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">New Password</label>
              <input
                className="w-full input-focus text-primary placeholder-secondary/40"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && <PasswordStrength password={password} />}
            </div>
            {error && <Alert>{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
            <button
              className="neon-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !code || code.length !== 6 || !password}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setPassword(''); setError(''); setSuccess(''); }}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
