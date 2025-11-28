import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getImageUrl } from '../utils/imageUrl';
import TimeAgo from './TimeAgo';
import HeartAnimation from './HeartAnimation';
import SavePostButton from './SavePostButton';

const normalizeUserId = (user) => {
    if (!user) return '';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
        if (user._id) return user._id.toString();
        if (typeof user.toString === 'function') return user.toString();
    }
    return String(user);
};

const extractReactionEntries = (post) => {
    if (!post?.reactions) return [];
    if (post.reactions instanceof Map) {
        return Array.from(post.reactions.entries());
    }
    return Object.entries(post.reactions);
};

const getUserReactionEmoji = (post, userId) => {
    if (!userId) return null;
    const entries = extractReactionEntries(post);
    const id = userId.toString();
    for (const [emoji, users] of entries) {
        if ((users || []).some((user) => normalizeUserId(user) === id)) {
            return emoji;
        }
    }
    return null;
};

const getReactionSummary = (post) => {
    const entries = extractReactionEntries(post);
    const emojiMap = new Map();
    entries.forEach(([emoji, users]) => {
        const count = (users || []).length;
        if (count > 0) {
            const existing = emojiMap.get(emoji) || 0;
            emojiMap.set(emoji, existing + count);
        }
    });
    const summary = Array.from(emojiMap.entries())
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count);
    const total = summary.reduce((sum, item) => sum + item.count, 0);
    return { summary, total };
};

const formatText = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
        if (part.startsWith('#')) {
            return <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span>;
        }
        if (part.startsWith('@')) {
            return <span key={i} className="text-pink-400 font-medium hover:underline cursor-pointer">{part}</span>;
        }
        return part;
    });
};

export default function PostCard({ post, token, me, onUpdate, onDelete, onAuthRequired }) {
    const [comments, setComments] = useState([]);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [reactionViewer, setReactionViewer] = useState({ open: false, data: [], filter: 'All' });
    const [seen, setSeen] = useState(false);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const lastTap = useRef(0);

    const pickerTimeoutRef = useRef(null);
    const cardRef = useRef(null);

    const reactionOptions = ['❤️', '👍', '😂', '😮', '😢', '😡', '🔥'];

    const handleDoubleTap = (e) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            e.preventDefault();
            setShowHeartAnim(true);
            setTimeout(() => setShowHeartAnim(false), 1000);
            sendReaction('❤️');
        }
        lastTap.current = now;
    };

    useEffect(() => {
        if (seen || !token || !post._id) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setSeen(true);
                    api.post(`/api/posts/${post._id}/seen`).catch(console.error);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [post._id, token, seen]);

    const handlePickerEnter = () => {
        if (!token) return;
        if (pickerTimeoutRef.current) {
            clearTimeout(pickerTimeoutRef.current);
            pickerTimeoutRef.current = null;
        }
        setPickerOpen(true);
    };

    const handlePickerLeave = () => {
        if (pickerTimeoutRef.current) {
            clearTimeout(pickerTimeoutRef.current);
        }
        pickerTimeoutRef.current = setTimeout(() => {
            setPickerOpen(false);
            pickerTimeoutRef.current = null;
        }, 120);
    };

    const sendReaction = async (emoji = '❤️') => {
        if (!token) {
            if (onAuthRequired) onAuthRequired();
            return;
        }
        try {
            const { data } = await api.post(`/api/posts/${post._id}/react/${encodeURIComponent(emoji)}`);
            onUpdate(data);
            setPickerOpen(false);
        } catch (e) {
            console.error('Failed to react', e);
        }
    };

    const openReactionViewer = async () => {
        try {
            const { data } = await api.get(`/api/posts/${post._id}/reactions`);
            setReactionViewer({ open: true, data, filter: 'All' });
        } catch (e) {
            console.error('Failed to load reactions', e);
        }
    };

    const toggleComments = async () => {
        setCommentsOpen(!commentsOpen);
        if (!commentsOpen) {
            setCommentsLoading(true);
            try {
                const { data } = await api.get(`/api/posts/${post._id}/comments`);
                setComments(data);
            } catch (e) {
                console.error('Failed to load comments', e);
            } finally {
                setCommentsLoading(false);
            }
        }
    };

    const [replyingTo, setReplyingTo] = useState(null);

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setCommentInput(`@${comment.author.username} `);
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!token) {
            if (onAuthRequired) onAuthRequired();
            return;
        }
        if (!commentInput.trim()) return;
        try {
            const parentId = replyingTo ? replyingTo._id : null;
            // Clean input if it starts with the mention
            let textToSend = commentInput;
            if (replyingTo && commentInput.startsWith(`@${replyingTo.author.username} `)) {
                textToSend = commentInput.substring(replyingTo.author.username.length + 2);
            }

            const { data } = await api.post(`/api/posts/${post._id}/comments`, { text: textToSend, parentId });
            setComments([...comments, data]);
            setCommentInput('');
            setReplyingTo(null);
            onUpdate({ ...post, commentCount: (post.commentCount || 0) + 1 });
        } catch (e) {
            console.error('Failed to comment', e);
        }
    };

    const deleteComment = async (commentId) => {
        try {
            await api.delete(`/api/posts/${post._id}/comments/${commentId}`);
            setComments(comments.filter(c => c._id !== commentId));
            onUpdate({ ...post, commentCount: Math.max(0, (post.commentCount || 0) - 1) });
        } catch (e) {
            console.error('Failed to delete comment', e);
        }
    };

    // Helper to organize comments into a tree
    const getCommentTree = (comments) => {
        const map = {};
        const roots = [];
        comments.forEach(c => {
            map[c._id] = { ...c, replies: [] };
        });
        comments.forEach(c => {
            if (c.parentId && map[c.parentId]) {
                map[c.parentId].replies.push(map[c._id]);
            } else {
                roots.push(map[c._id]);
            }
        });
        return roots;
    };

    const CommentItem = ({ comment, depth = 0 }) => (
        <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-8 border-l-2 border-white/10 pl-3' : ''}`}>
            <div className="flex items-start gap-3">
                {comment.author?.avatarUrl ? (
                    <img src={getImageUrl(comment.author.avatarUrl)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                )}
                <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl px-3 py-2 inline-block">
                        <div className="text-xs text-secondary font-bold">@{comment.author?.username}</div>
                        <div className="text-primary text-sm">{formatText(comment.text)}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-secondary">
                        <span><TimeAgo date={comment.createdAt} /></span>
                        <button onClick={() => handleReply(comment)} className="hover:text-primary font-medium">Reply</button>
                        {comment.author?._id === me?._id && (
                            <button onClick={() => deleteComment(comment._id)} className="hover:text-red-400">Delete</button>
                        )}
                    </div>
                </div>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-2 mt-1">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );

    const commentTree = getCommentTree(comments);

    const hideCounts = Boolean(post.hideLikeCount && me?._id !== post.author?._id);
    const { summary, total } = getReactionSummary(post);
    const leadingReactions = summary.slice(0, 2);
    const userReaction = getUserReactionEmoji(post, me?._id);

    const filteredReactions = reactionViewer.filter === 'All'
        ? reactionViewer.data
        : reactionViewer.data.filter(r => r.emoji === reactionViewer.filter);

    return (
        <article ref={cardRef} className="gradient-border hover-lift stagger-item">
            <div className="gradient-inner rounded-[1.45rem] overflow-hidden">
                <div className="px-5 py-4 text-sm text-primary flex items-center gap-3">
                    <Link to={post.author?.username ? `/u/${post.author.username}` : '#'} className="flex items-center gap-3 hover:opacity-80 transition">
                        {post.author?.avatarUrl ? (
                            <img src={getImageUrl(post.author.avatarUrl)} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary/70">{post.author?.username?.[0]?.toUpperCase() || '?'}</div>
                        )}
                        <div>
                            <div className="font-semibold text-primary">{post.author?.displayName || post.author?.username || 'unknown'}</div>
                            <div className="text-secondary text-xs">@{post.author?.username || 'unknown'}</div>
                        </div>
                    </Link>
                    <span className="ml-auto text-xs text-secondary"><TimeAgo date={post.createdAt} /></span>
                </div>

                {post.imageUrl && (
                    <div
                        className="relative group cursor-pointer"
                        onClick={handleDoubleTap}
                    >
                        <img src={getImageUrl(post.imageUrl)} alt={post.caption} className="w-full object-cover max-h-[520px]" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                        <HeartAnimation active={showHeartAnim} />
                    </div>
                )}

                {post.caption && (
                    <div className="px-5 pt-4">
                        <p className="text-[11px] uppercase tracking-[0.4em] text-secondary/50">Title</p>
                        <p className="text-primary text-xl font-semibold mt-1">{formatText(post.caption)}</p>
                    </div>
                )}

                {post.textContent && <div className="px-5 py-4 whitespace-pre-wrap text-primary text-base">{formatText(post.textContent)}</div>}

                <div className="px-5 pb-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div
                            className="flex items-center gap-3 relative"
                            onMouseEnter={handlePickerEnter}
                            onMouseLeave={handlePickerLeave}
                        >
                            <div className="relative">
                                <button
                                    className="flex items-center gap-2 px-2 py-2 rounded-full text-secondary hover:bg-white/5 transition disabled:opacity-40"
                                    onClick={() => sendReaction('❤️')}
                                    disabled={!token}
                                >
                                    <span role="img" aria-label="reaction" className={userReaction ? 'grayscale-0' : 'grayscale opacity-60'}>{userReaction || '👍'}</span>
                                    <span className={userReaction ? 'text-pink-400 font-medium' : ''}>Like</span>
                                </button>

                                {pickerOpen && (
                                    <div
                                        className="reaction-popover absolute -top-14 left-0 bg-white/10 backdrop-blur-md rounded-full px-2 py-1 flex gap-1 border border-white/20 shadow-xl animate-in fade-in zoom-in duration-200 z-10"
                                        onMouseEnter={handlePickerEnter}
                                        onMouseLeave={handlePickerLeave}
                                    >
                                        {reactionOptions.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => sendReaction(emoji)}
                                                className="w-9 h-9 flex items-center justify-center text-2xl hover:scale-125 transition-transform active:scale-95"
                                                disabled={!token}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-secondary">
                                <div className="flex items-center gap-1 hover:underline cursor-pointer" onClick={openReactionViewer}>
                                    {total > 0 && !hideCounts && (
                                        <>
                                            <div className="flex items-center -space-x-1">
                                                {leadingReactions.map((item) => (
                                                    <span key={item.emoji} className="w-4 h-4 flex items-center justify-center bg-surface rounded-full ring-2 ring-surface text-[10px]">
                                                        {item.emoji}
                                                    </span>
                                                ))}
                                            </div>
                                            <span>{total}</span>
                                        </>
                                    )}
                                </div>
                                {((total > 0 && !hideCounts) || post.commentCount > 0) && <span>•</span>}
                                <div className="hover:underline cursor-pointer" onClick={toggleComments}>
                                    {post.commentCount > 0 ? `${post.commentCount} comments` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary border-t border-white/5 pt-2">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 py-1 hover:bg-white/5 rounded-lg transition"
                                onClick={() => {
                                    if (!token && onAuthRequired) {
                                        onAuthRequired();
                                    } else {
                                        toggleComments();
                                    }
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                Comment
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-2 py-1 hover:bg-white/5 rounded-lg transition"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                Share
                            </button>
                            <SavePostButton
                                postId={post._id}
                                initialSaved={post.isSaved}
                                token={token}
                                onAuthRequired={onAuthRequired}
                            />
                        </div>

                        {commentsOpen && (
                            <div className="space-y-3 border-t border-white/10 pt-3 w-full relative">
                                <button
                                    onClick={() => setCommentsOpen(false)}
                                    className="absolute top-0 right-0 p-1 text-secondary hover:text-primary"
                                    title="Close comments"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>

                                {commentsLoading ? (
                                    <p className="text-secondary text-sm">Loading comments...</p>
                                ) : (
                                    <>
                                        {comments.length === 0 && (
                                            <p className="text-secondary text-sm">Be the first to comment.</p>
                                        )}
                                        <div className="space-y-4">
                                            {commentTree.map((comment) => (
                                                <CommentItem key={comment._id} comment={comment} />
                                            ))}
                                        </div>
                                    </>
                                )}
                                {token && (
                                    <div className="mt-3">
                                        {replyingTo && (
                                            <div className="flex items-center justify-between text-xs text-secondary mb-1 px-2">
                                                <span>Replying to @{replyingTo.author.username}</span>
                                                <button onClick={() => { setReplyingTo(null); setCommentInput(''); }} className="hover:text-primary">Cancel</button>
                                            </div>
                                        )}
                                        <form className="flex gap-2" onSubmit={submitComment}>
                                            <input
                                                className="flex-1 input-focus text-primary placeholder-secondary/40"
                                                placeholder={replyingTo ? `Reply to @${replyingTo.author.username}...` : "Leave a comment..."}
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                            />
                                            <button className="neon-btn text-xs" type="submit">
                                                {replyingTo ? 'Reply' : 'Comment'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {reactionViewer.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setReactionViewer({ ...reactionViewer, open: false })}
                            className="absolute top-4 right-4 text-secondary hover:text-primary"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <h3 className="text-xl font-semibold text-primary mb-4">Reactions</h3>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            <button
                                onClick={() => setReactionViewer(prev => ({ ...prev, filter: 'All' }))}
                                className={`px-3 py-1 rounded-full text-sm transition ${reactionViewer.filter === 'All' ? 'bg-white/20 text-white' : 'bg-white/5 text-secondary hover:bg-white/10'}`}
                            >
                                All
                            </button>
                            {reactionViewer.data.map(r => (
                                <button
                                    key={r.emoji}
                                    onClick={() => setReactionViewer(prev => ({ ...prev, filter: r.emoji }))}
                                    className={`px-3 py-1 rounded-full text-sm transition ${reactionViewer.filter === r.emoji ? 'bg-white/20 text-white' : 'bg-white/5 text-secondary hover:bg-white/10'}`}
                                >
                                    {r.emoji} {r.count}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto soft-scrollbar">
                            {filteredReactions.map((entry) => (
                                <div key={entry.emoji} className="space-y-2">
                                    {entry.users.map((user) => (
                                        <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition">
                                            {user.avatarUrl ? (
                                                <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-primary">{user.displayName || user.username}</div>
                                                <div className="text-xs text-secondary">@{user.username}</div>
                                            </div>
                                            <span className="text-xl">{entry.emoji}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            {filteredReactions.length === 0 && (
                                <p className="text-center text-secondary py-4">No reactions found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}
