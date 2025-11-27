import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import FabButton from '../components/FabButton';
import { getImageUrl } from '../utils/imageUrl';
import useMe from '../hooks/useMe';

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

export default function Feed({ token }) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ imageUrl: '', caption: '', textContent: '', hideLikes: false });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [pickerPost, setPickerPost] = useState(null);
  const [reactionViewer, setReactionViewer] = useState({ open: false, data: [], postId: null });
  const [comments, setComments] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { me } = useMe(!!token);
  const pickerTimeoutRef = useRef(null);

  const handlePickerEnter = (postId) => {
    if (!token) return;
    if (pickerTimeoutRef.current) {
      clearTimeout(pickerTimeoutRef.current);
      pickerTimeoutRef.current = null;
    }
    setPickerPost(postId);
  };

  const handlePickerLeave = () => {
    if (pickerTimeoutRef.current) {
      clearTimeout(pickerTimeoutRef.current);
    }
    pickerTimeoutRef.current = setTimeout(() => {
      setPickerPost(null);
      pickerTimeoutRef.current = null;
    }, 120);
  };

  const reactionOptions = ['❤️', '👍', '😂', '😮', '😢', '😡', '🔥'];

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/posts/feed');
      console.log('Fetched data:', data);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    return () => {
      if (pickerTimeoutRef.current) {
        clearTimeout(pickerTimeoutRef.current);
      }
    };
  }, []);

  console.log('Render state:', { loading, posts, error });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createPost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let dataToSend;
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        if (form.caption) fd.append('caption', form.caption);
        if (form.textContent) fd.append('textContent', form.textContent);
        fd.append('hideLikes', form.hideLikes ? 'true' : 'false');
        dataToSend = fd;
      } else {
        dataToSend = {
          ...form
        };
      }
      await api.post('/api/posts', dataToSend);
      setForm({ imageUrl: '', caption: '', textContent: '', hideLikes: false });
      setFile(null);
      fetchFeed();
      setComposeOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  const toggleHideLikes = async (postId, nextValue) => {
    try {
      const { data } = await api.patch(`/api/posts/${postId}/visibility`, { hideLikes: nextValue });
      updatePostState(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update settings');
    }
  };

  const updatePostState = (updated) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updated._id ? { ...p, ...updated, author: updated.author || p.author } : p))
    );
  };

  const sendReaction = async (id, emoji = '❤️') => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    try {
      const { data } = await api.post(`/api/posts/${id}/react/${encodeURIComponent(emoji)}`);
      updatePostState(data);
      setPickerPost(null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to react to post');
    }
  };

  const openReactionViewer = async (postId) => {
    try {
      const { data } = await api.get(`/api/posts/${postId}/reactions`);
      setReactionViewer({ open: true, data, postId });
    } catch (e) {
      setError('Failed to load reactions');
    }
  };

  const toggleComments = async (postId) => {
    setCommentsOpen((prev) => ({ ...prev, [postId]: !prev[postId] }));
    if (!commentsOpen[postId]) {
      await loadComments(postId);
    }
  };

  const loadComments = async (postId) => {
    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const { data } = await api.get(`/api/posts/${postId}/comments`);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (e) {
      setError('Failed to load comments');
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const submitComment = async (postId) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    try {
      const { data } = await api.post(`/api/posts/${postId}/comments`, { text });
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to comment');
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      await api.delete(`/api/posts/${postId}/comments/${commentId}`);
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId]?.filter((c) => c._id !== commentId) || []
      }));
    } catch (e) {
      setError('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-10 anim-section pb-32">
      <section className="space-y-5 stagger-parent">
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="gradient-border animate-pulse stagger-item" style={{ '--delay': `${i * 0.08}s` }}>
                <div className="gradient-inner p-5 rounded-[1.45rem]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="h-3 w-24 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-64 bg-white/5 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.map((post, index) => {
          const hideCounts = Boolean(post.hideLikeCount && me?._id !== post.author?._id);
          const { summary, total } = getReactionSummary(post);
          const leadingReactions = summary.slice(0, 2);
          const userReaction = getUserReactionEmoji(post, me?._id);
          const canViewReactions = !hideCounts;
          const showHiddenMessage = hideCounts && total > 0;
          const likeDisplay = hideCounts ? '—' : total;

          return (
            <article
              key={post._id}
              className="gradient-border hover-lift stagger-item"
              style={{ '--delay': `${index * 0.06}s` }}
            >
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
                  <span className="ml-auto text-xs text-secondary">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                {post.imageUrl && (
                  <div className="relative">
                    <img src={getImageUrl(post.imageUrl)} alt={post.caption} className="w-full object-cover max-h-[520px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                  </div>
                )}
                {post.caption && (
                  <div className="px-5 pt-4">
                    <p className="text-[11px] uppercase tracking-[0.4em] text-secondary/50">Title</p>
                    <p className="text-primary text-xl font-semibold mt-1">{post.caption}</p>
                  </div>
                )}
                {post.textContent && <div className="px-5 py-4 whitespace-pre-wrap text-primary text-base">{post.textContent}</div>}
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-3 relative"
                      onMouseEnter={() => handlePickerEnter(post._id)}
                      onMouseLeave={handlePickerLeave}
                    >
                      <div className="relative">
                        <button
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-pink-200 hover:bg-white/20 transition disabled:opacity-40"
                          onClick={() => sendReaction(post._id)}
                          disabled={!token}
                        >
                          <span role="img" aria-label="reaction">{userReaction || '💜'}</span>
                          <span>{likeDisplay}</span>
                        </button>
                        {pickerPost === post._id && (
                          <div
                            className="reaction-popover absolute -top-16 left-0 bg-slate-900/90 backdrop-blur rounded-full px-3 py-2 flex gap-2 border border-white/10 shadow-2xl"
                            onMouseEnter={() => handlePickerEnter(post._id)}
                            onMouseLeave={handlePickerLeave}
                          >
                            {reactionOptions.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => sendReaction(post._id, emoji)}
                                className="reaction-option text-xl disabled:opacity-40"
                                disabled={!token}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-3 text-xs text-secondary">
                          {showHiddenMessage ? (
                            <span className="text-secondary/50 text-[11px] uppercase tracking-[0.2em]">Reactions hidden by author</span>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {leadingReactions.map((item, idx) => (
                                    <span
                                      key={item.emoji}
                                      className={`w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center text-sm shadow-sm ${idx > 0 ? '-ml-2' : ''} z-${10 - idx}`}
                                    >
                                      {item.emoji}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-secondary font-medium">{total}</span>
                              </div>
                              {canViewReactions && (
                                <button
                                  className="underline decoration-dotted hover:text-primary"
                                  onClick={() => openReactionViewer(post._id)}
                                  disabled={!token}
                                >
                                  View all
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-secondary">{post.textContent ? 'Text + Media' : 'Photo drop'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                    <button className="hover:text-primary transition" onClick={() => toggleComments(post._id)}>
                      {commentsOpen[post._id] ? 'Hide comments' : 'View comments'}
                    </button>
                    {me?._id === post.author?._id && (
                      <button
                        className="text-xs text-secondary/50 hover:text-primary transition"
                        onClick={() => toggleHideLikes(post._id, !post.hideLikeCount)}
                      >
                        {post.hideLikeCount ? 'Show reaction counts' : 'Hide reaction counts'}
                      </button>
                    )}
                  </div>
                  {commentsOpen[post._id] && (
                    <div className="space-y-3 border-t border-white/10 pt-3">
                      {commentsLoading[post._id] ? (
                        <p className="text-secondary text-sm">Loading comments...</p>
                      ) : (
                        <>
                          {(comments[post._id] || []).length === 0 && (
                            <p className="text-secondary text-sm">Be the first to comment.</p>
                          )}
                          {(comments[post._id] || []).map((comment) => (
                            <div key={comment._id} className="flex items-start gap-3">
                              {comment.author?.avatarUrl ? (
                                <img src={getImageUrl(comment.author.avatarUrl)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                              )}
                              <div className="bg-white/5 rounded-2xl px-3 py-2 flex-1">
                                <div className="text-xs text-secondary">@{comment.author?.username}</div>
                                <div className="text-primary text-sm">{comment.text}</div>
                              </div>
                              {comment.author?._id === me?._id && (
                                <button
                                  onClick={() => deleteComment(post._id, comment._id)}
                                  className="text-xs text-secondary/50 hover:text-primary"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      {token && (
                        <form
                          className="flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            submitComment(post._id);
                          }}
                        >
                          <input
                            className="flex-1 input-focus text-primary placeholder-secondary/40"
                            placeholder="Leave a comment..."
                            value={commentInputs[post._id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                          />
                          <button className="neon-btn text-xs" type="submit">
                            Comment
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {posts.length === 0 && !loading && (
          <div className="glass-panel p-6 text-center text-secondary">No posts yet. Be the first!</div>
        )}
      </section>

      <FabButton onClick={() => setComposeOpen(true)} disabled={!token} />

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Compose post">
        {!token && <p className="text-sm text-secondary mb-2">Login to create and like posts.</p>}
        <form
          className="space-y-6"
          onSubmit={(e) => {
            createPost(e);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-primary">Upload image</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={!token} className="text-secondary" />
              <div className="text-xs text-secondary">Or use an image URL</div>
              <input className="input-focus w-full" placeholder="https://..." name="imageUrl" value={form.imageUrl} onChange={onChange} disabled={!token} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-primary">Text post</label>
              <textarea className="input-focus w-full min-h-[120px]" placeholder="Share your thoughts..." name="textContent" value={form.textContent} onChange={onChange} disabled={!token} />
              <label className="text-sm font-medium text-primary">Caption</label>
              <input className="input-focus w-full" placeholder="Optional caption" name="caption" value={form.caption} onChange={onChange} disabled={!token} />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-primary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/40 bg-transparent"
              checked={form.hideLikes}
              onChange={(e) => setForm((prev) => ({ ...prev, hideLikes: e.target.checked }))}
              disabled={!token}
            />
            Hide reactions & like counts from other users
          </label>
          {error && <Alert>{error}</Alert>}
          <div className="flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-full border border-white/20 text-secondary hover:bg-white/10 transition" onClick={() => setComposeOpen(false)}>Cancel</button>
            <button className="neon-btn disabled:opacity-50 disabled:cursor-not-allowed" disabled={!token}>Publish</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={reactionViewer.open}
        onClose={() => setReactionViewer({ open: false, data: [], postId: null })}
        title="Post reactions"
      >
        {reactionViewer.data.length === 0 ? (
          <p className="text-sm text-secondary">No reactions yet.</p>
        ) : (
          <div className="space-y-3">
            {reactionViewer.data.map((entry) => (
              <div key={entry.emoji} className="flex flex-col gap-2 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 text-primary">
                  <span className="text-xl">{entry.emoji}</span>
                  <span className="text-sm text-secondary">{entry.count} reaction(s)</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {entry.users.map((user) => (
                    <div key={user._id} className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1">
                      {user.avatarUrl ? (
                        <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10" />
                      )}
                      <span className="text-sm text-primary">{user.displayName || user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Authentication Required">
        <div className="space-y-4">
          <p className="text-primary/80">
            To like, comment, or subscribe to posts, please create an account or login.
          </p>
          <div className="flex gap-3">
            <Link to="/register" className="neon-btn flex-1 text-center">
              Create Account
            </Link>
            <button
              className="px-4 py-2 rounded-full border border-white/20 text-secondary hover:bg-white/10 transition"
              onClick={() => setShowAuthModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
