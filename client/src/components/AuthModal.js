import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from './Modal';

export default function AuthModal({ open, onClose, onSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                await api.post('/api/auth/register', {
                    username: formData.username,
                    password: formData.password
                });
            }

            // Login after registration or direct login
            const { data } = await api.post('/api/auth/login', {
                username: formData.username,
                password: formData.password
            });

            localStorage.setItem('token', data.token);
            if (onSuccess) onSuccess(data.token);
            onClose();
            window.location.reload(); // Reload to update authentication state
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${mode}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setFormData({ username: '', password: '', confirmPassword: '' });
    };

    return (
        <Modal open={open} onClose={onClose} title={mode === 'login' ? 'Welcome Back' : 'Create Account'}>
            <div className="space-y-6">
                <p className="text-sm text-secondary text-center">
                    {mode === 'login'
                        ? 'Sign in to like, comment, and share posts'
                        : 'Join our community to start sharing'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full input-focus text-primary placeholder-secondary/40"
                            placeholder="Enter your username"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full input-focus text-primary placeholder-secondary/40"
                            placeholder="Enter your password"
                            required
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full input-focus text-primary placeholder-secondary/40"
                                placeholder="Confirm your password"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full neon-btn justify-center"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={toggleMode}
                        className="text-sm text-secondary hover:text-primary transition"
                    >
                        {mode === 'login'
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
