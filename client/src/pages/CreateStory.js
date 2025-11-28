import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateStory() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [mediaType, setMediaType] = useState('image');

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setMediaType(file.type.startsWith('video/') ? 'video' : 'image');

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('media', selectedFile);
            formData.append('caption', caption);
            formData.append('mediaType', mediaType);

            await api.post('/api/stories', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            navigate(-1);
        } catch (err) {
            console.error('Failed to create story', err);
            alert('Failed to create story');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            <div className="glass-panel p-4 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-primary hover:text-aurora transition-colors">
                    Cancel
                </button>
                <h1 className="text-lg font-semibold text-primary">Create Story</h1>
                <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || uploading}
                    className="text-aurora hover:text-secondary transition-colors disabled:opacity-50"
                >
                    {uploading ? 'Posting...' : 'Share'}
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                {preview ? (
                    <div className="relative max-w-md w-full">
                        {mediaType === 'video' ? (
                            <video src={preview} controls className="w-full rounded-lg" />
                        ) : (
                            <img src={preview} alt="Preview" className="w-full rounded-lg" />
                        )}

                        <div className="mt-4">
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full input-field"
                                maxLength={200}
                            />
                        </div>
                    </div>
                ) : (
                    <label className="glass-panel p-12 text-center cursor-pointer hover:bg-white/10 transition-colors rounded-xl">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className="text-6xl mb-4">📸</div>
                        <p className="text-primary font-semibold mb-2">Select Photo or Video</p>
                        <p className="text-secondary text-sm">Your story will disappear after 24 hours</p>
                    </label>
                )}
            </div>
        </div>
    );
}
