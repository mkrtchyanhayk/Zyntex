import React, { useState, useEffect } from 'react';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';
import { Link } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

export default function Explore() {
    const [posts, setPosts] = useState([]);
    const [category, setCategory] = useState('all');
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExplore();
        loadTrending();
    }, [category]);

    const loadExplore = async () => {
        try {
            const { data } = await api.get(`/api/explore/feed?category=${category}&limit=30`);
            setPosts(data);
        } catch (err) {
            console.error('Failed to load explore', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTrending = async () => {
        try {
            const { data } = await api.get('/api/explore/trending?limit=10');
            setTrending(data);
        } catch (err) {
            console.error('Failed to load trending', err);
        }
    };

    const categories = [
        { id: 'all', label: 'All', icon: '🌟' },
        { id: 'photos', label: 'Photos', icon: '📸' },
        { id: 'videos', label: 'Videos', icon: '🎥' },
        { id: 'reels', label: 'Reels', icon: '🎬' }
    ];

    return (
        <div className="space-y-6">
            {/* Trending Hashtags */}
            {trending.length > 0 && (
                <div className="glass-panel p-4">
                    <h2 className="text-lg font-semibold text-primary mb-3">🔥 Trending</h2>
                    <div className="flex flex-wrap gap-2">
                        {trending.map((tag) => (
                            <Link
                                key={tag.hashtag}
                                to={`/search?q=${encodeURIComponent(tag.hashtag)}`}
                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-primary"
                            >
                                #{tag.hashtag} <span className="text-secondary">({tag.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full transition-all ${category === cat.id
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                : 'bg-white/5 border border-white/10 text-secondary hover:bg-white/10'
                            }`}
                    >
                        <span className="mr-1">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Explore Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-2 border-aurora border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {posts.map((post, idx) => (
                        <Link
                            key={post._id}
                            to={`/post/${post._id}`}
                            className="glass-panel overflow-hidden hover-tilt group relative aspect-square"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            {post.images && post.images.length > 0 ? (
                                <img
                                    src={getImageUrl(post.images[0].url)}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : post.imageUrl ? (
                                <img
                                    src={getImageUrl(post.imageUrl)}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-4">
                                    <p className="text-primary text-sm line-clamp-6">{post.textContent}</p>
                                </div>
                            )}

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                                <div className="flex items-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span className="font-bold">{post.likeCount || post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    <span className="font-bold">{post.viewCount || 0}</span>
                                </div>
                            </div>

                            {/* Multi-image indicator */}
                            {post.images && post.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}

            {posts.length === 0 && !loading && (
                <div className="glass-panel p-12 text-center">
                    <p className="text-secondary">No posts to explore yet</p>
                </div>
            )}
        </div>
    );
}
