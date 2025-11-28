import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';

export default function StoryViewer() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        loadStories();
    }, [username]);

    useEffect(() => {
        if (stories.length === 0) return;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory();
                    return 0;
                }
                return prev + 2;
            });
        }, 100); // 5 seconds per story

        return () => clearInterval(timer);
    }, [currentIndex, stories]);

    const loadStories = async () => {
        try {
            const { data } = await api.get(`/api/stories/user/${username}`);
            setStories(data);
            if (data.length > 0) {
                viewStory(data[0]._id);
            }
        } catch (err) {
            console.error('Failed to load stories', err);
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const viewStory = async (storyId) => {
        try {
            await api.post(`/api/stories/${storyId}/view`);
        } catch (err) {
            console.error('Failed to view story', err);
        }
    };

    const nextStory = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            viewStory(stories[currentIndex + 1]._id);
            setProgress(0);
        } else {
            navigate(-1);
        }
    };

    const previousStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        } else {
            navigate(-1);
        }
    };

    const handleClick = (e) => {
        const clickX = e.clientX;
        const screenWidth = window.innerWidth;
        if (clickX < screenWidth / 2) {
            previousStory();
        } else {
            nextStory();
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (stories.length === 0) {
        return null;
    }

    const currentStory = stories[currentIndex];

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            {/* Close button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 right-4 z-50 text-white w-10 h-10 flex items-center justify-center bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
                ✕
            </button>

            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 z-40 flex gap-1">
                {stories.map((_, idx) => (
                    <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-100"
                            style={{
                                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Author info */}
            <div className="absolute top-12 left-4 right-4 z-40 flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                    {currentStory.author.avatarUrl ? (
                        <img src={getImageUrl(currentStory.author.avatarUrl)} alt={currentStory.author.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-sm font-bold">
                            {currentStory.author.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-semibold">{currentStory.author.displayName || currentStory.author.username}</p>
                    <p className="text-xs text-white/70">{new Date(currentStory.createdAt).toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Story content */}
            <div onClick={handleClick} className="relative w-full max-w-md h-full cursor-pointer flex items-center justify-center">
                {currentStory.mediaType === 'video' ? (
                    <video
                        src={getImageUrl(currentStory.mediaUrl)}
                        className="max-w-full max-h-full object-contain"
                        autoPlay
                        onEnded={nextStory}
                    />
                ) : (
                    <img
                        src={getImageUrl(currentStory.mediaUrl)}
                        alt="Story"
                        className="max-w-full max-h-full object-contain"
                    />
                )}

                {/* Caption */}
                {currentStory.caption && (
                    <div className="absolute bottom-20 left-0 right-0 px-6 text-white text-center">
                        <p className="bg-black/50 rounded-lg px-4 py-2 inline-block">{currentStory.caption}</p>
                    </div>
                )}
            </div>

            {/* Navigation hints */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm flex items-center gap-4">
                <span>← Tap left</span>
                <span>Tap right →</span>
            </div>
        </div>
    );
}
