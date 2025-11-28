import React, { useState } from 'react';
import api from '../api';

export default function SavePostButton({ postId, initialSaved = false, token, onAuthRequired }) {
    const [saved, setSaved] = useState(initialSaved);
    const [loading, setLoading] = useState(false);

    const toggleSave = async () => {
        if (!token) {
            if (onAuthRequired) onAuthRequired();
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post(`/api/posts/${postId}/save`);
            setSaved(data.saved);
        } catch (error) {
            console.error('Failed to save post:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleSave}
            disabled={loading}
            className="p-2 hover:bg-white/5 rounded-lg transition disabled:opacity-50"
            title={saved ? 'Unsave post' : 'Save post'}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>
    );
}
