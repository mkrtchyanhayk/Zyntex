import React, { useState, useEffect } from 'react';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';
import { Link } from 'react-router-dom';
import useMe from '../hooks/useMe';

export default function StoriesBar() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { me } = useMe(true);

    useEffect(() => {
        loadStories();
    }, []);

    const loadStories = async () => {
        try {
            const { data } = await api.get('/api/stories/feed');
            setStories(data);
        } catch (err) {
            console.error('Failed to load stories', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="glass-panel p-4 mb-6 overflow-hidden">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {/* Your story */}
                <Link to="/stories/create" className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full overflow-hidden">
                                {me?.avatarUrl ? (
                                    <img src={getImageUrl(me.avatarUrl)} alt="Your story" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-primary text-xl font-bold">
                                        {me?.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mt-1 truncate w-16">Your Story</p>
                </Link>

                {/* Stories from following */}
                {stories.map((storyGroup) => (
                    <Link
                        key={storyGroup.author._id}
                        to={`/stories/${storyGroup.author.username}`}
                        className="flex-shrink-0 text-center"
                    >
                        <div className={`w-16 h-16 rounded-full p-[2px] ${storyGroup.hasViewed
                                ? 'bg-gray-400'
                                : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                            }`}>
                            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full overflow-hidden">
                                    {storyGroup.author.avatarUrl ? (
                                        <img
                                            src={getImageUrl(storyGroup.author.avatarUrl)}
                                            alt={storyGroup.author.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-primary text-xl font-bold">
                                            {storyGroup.author.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-secondary mt-1 truncate w-16">
                            {storyGroup.author.displayName || storyGroup.author.username}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
