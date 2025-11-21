import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import useMe from '../hooks/useMe';
import { getImageUrl } from '../utils/imageUrl';

const QUICK_EMOJIS = ['😀', '😁', '😂', '🤣', '😍', '🤩', '😎', '😭', '😡', '🥳', '🤯', '🙏', '🔥', '👀', '💯', '✨', '🫶', '🤝', '🙌', '🧠'];

const STICKER_LIBRARY = [
  { id: 'heart-hands', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1faf6.png' },
  { id: 'fire-heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/2764.png' },
  { id: 'glow-star', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f31f.png' },
  { id: 'rocket', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f680.png' },
  { id: 'party', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f973.png' },
  { id: 'ice-fire', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f975.png' },
  { id: 'sunglasses', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f60e.png' },
  { id: 'sparkles', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/2728.png' },
  { id: 'unicorn', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f984.png' },
  { id: 'wave', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/1f44b.png' }
];

const MEDIA_MARKERS = {
  gif: '::gif::',
  sticker: '::sticker::'
};

const buildMediaPayload = (type, url) => `${MEDIA_MARKERS[type]}${url}`;

const parseMessagePayload = (text = '') => {
  const entry = Object.entries(MEDIA_MARKERS).find(([, marker]) => text.startsWith(marker));
  if (!entry) return { type: 'text', text };
  const [type, marker] = entry;
  return { type, url: text.replace(marker, '') };
};

const extractGifUrl = (gif) => gif?.media_formats?.tinygif?.url || gif?.media_formats?.gif?.url || gif?.url || '';

const TENOR_KEY = process.env.REACT_APP_TENOR_KEY || 'LIVDSRZULELA';
const TENOR_CLIENT = 'zyntex-web';

export default function Messages() {
  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showReactions, setShowReactions] = useState(null);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [panelSearch, setPanelSearch] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [gifResults, setGifResults] = useState([]);
  const [gifQuery, setGifQuery] = useState('');
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const convoPollRef = useRef(null);
  const messagePollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const pickerRef = useRef(null);
  const composerRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const reactionPalette = ['👍', '❤️', '😂', '🔥', '😮', '🙏'];

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
    setIsAtBottom(true);
    setShowScrollHint(false);
  }, []);

  const fetchConvos = async () => {
    try {
      const { data } = await api.get('/api/dm/conversations');
      setConvos(data);
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const sortMessages = (list) =>
    list.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      const { data } = await api.get(`/api/dm/conversations/${conversationId}/messages`);
      setMessages(sortMessages(data));
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  useEffect(() => {
    fetchConvos();
    convoPollRef.current = setInterval(fetchConvos, 4000);
    return () => {
      if (convoPollRef.current) clearInterval(convoPollRef.current);
    };
  }, []);

  useEffect(() => {
    if (messagePollRef.current) {
      clearInterval(messagePollRef.current);
      messagePollRef.current = null;
    }
    if (!id) {
      setMessages([]);
      setIsAtBottom(true);
      setShowScrollHint(false);
      return;
    }
    fetchMessages(id);
    setIsAtBottom(true);
    setShowScrollHint(false);
    setTimeout(() => scrollToBottom('auto'), 100);
    messagePollRef.current = setInterval(async () => {
      const container = messageListRef.current;
      if (container) {
        const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
        await fetchMessages(id);
        if (wasAtBottom && container) {
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } else {
        await fetchMessages(id);
      }
    }, 1500);
    return () => {
      if (messagePollRef.current) {
        clearInterval(messagePollRef.current);
        messagePollRef.current = null;
      }
    };
  }, [id, scrollToBottom]);

  const handleMessagesScroll = useCallback(() => {
    const container = messageListRef.current;
    if (!container) return;
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = remaining < 120;
    setIsAtBottom(nearBottom);
    setShowScrollHint(!nearBottom);
  }, []);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;
    const listener = () => handleMessagesScroll();
    container.addEventListener('scroll', listener, { passive: true });
    return () => container.removeEventListener('scroll', listener);
  }, [handleMessagesScroll, id]);

  useEffect(() => {
    if (messages.length && messageListRef.current) {
      const container = messageListRef.current;
      const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      const isNewMessage = messages.length > lastMessageCountRef.current;
      lastMessageCountRef.current = messages.length;
      if (wasAtBottom && isNewMessage) {
        requestAnimationFrame(() => {
          if (container) {
            const stillAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
            if (stillAtBottom) {
              scrollToBottom('auto');
            }
          }
        });
      }
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!activePicker) return;
    const handleClick = (event) => {
      if (pickerRef.current?.contains(event.target) || composerRef.current?.contains(event.target)) {
        return;
      }
      setActivePicker(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activePicker]);

  const fetchGifs = useCallback(async (query = '') => {
    try {
      setGifLoading(true);
      setGifError(null);
      const endpoint = query ? 'search' : 'trending';
      const qs = query ? `&q=${encodeURIComponent(query)}` : '';
      const url = `https://tenor.googleapis.com/v2/${endpoint}?key=${TENOR_KEY}&client_key=${TENOR_CLIENT}&limit=24&media_filter=gif,tinygif${qs}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tenor API error: ${response.status} - ${errorText}`);
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.results)) {
        throw new Error('Invalid response format from Tenor');
      }
      setGifResults(payload.results);
    } catch (err) {
      console.error('GIF fetch error:', err);
      setGifError(err.message || 'Unable to load GIFs right now');
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  }, []);

  const GIF_SUGGESTIONS = ['funny', 'happy', 'love', 'excited', 'cool', 'wow', 'celebration', 'reaction'];

  useEffect(() => {
    if (activePicker === 'gif' && gifResults.length === 0 && !gifLoading) {
      fetchGifs();
    }
  }, [activePicker, gifResults.length, gifLoading, fetchGifs]);

  const startChat = async (user) => {
    try {
      await api.post('/api/invitations', { to: user._id, type: 'dm' });
      setShowUserSelect(false);
      setSearchQuery('');
      alert('Invite sent. The chat will open once the user accepts in their mailbox.');
    } catch (e) {
      console.error(e);
    }
  };

  const postMessage = async (payload) => {
    if (!payload || !id) return;
    try {
      const { data } = await api.post(`/api/dm/conversations/${id}/messages`, { text: payload });
      setMessages((prev) => {
        const next = prev.some((m) => m._id === data._id)
          ? prev.map((m) => (m._id === data._id ? data : m))
          : [...prev, data];
        return sortMessages(next);
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const send = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const value = text.trim();
    if (!value) return;
    await postMessage(value);
    setText('');
  };

  const sendMediaMessage = async (type, url) => {
    if (!url || !MEDIA_MARKERS[type]) return;
    await postMessage(buildMediaPayload(type, url));
    setActivePicker(null);
  };

  const togglePicker = (type) => {
    setActivePicker((prev) => (prev === type ? null : type));
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => `${prev}${emoji}`);
  };

  const handleStickerSelect = (url) => {
    sendMediaMessage('sticker', url);
  };

  const handleGifSelect = (gif) => {
    const url = extractGifUrl(gif);
    if (!url) return;
    sendMediaMessage('gif', url);
  };

  const handleGifSearch = () => {
    fetchGifs(gifQuery);
  };

  const handleGifInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchGifs(gifQuery);
    }
  };

  const react = async (messageId, emoji) => {
    try {
      const { data } = await api.post(`/api/dm/messages/${messageId}/reactions`, { emoji });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, ...data } : m))
      );
      setShowReactions(null);
    } catch (err) {
      console.error('Failed to react to message', err);
    }
  };

  const { me } = useMe(true);
  const getOtherUser = (c) => {
    if (!c?.members?.length) return undefined;
    if (!me) return c.members[0];
    return c.members.find((m) => m._id !== me._id && m._id?.toString() !== me._id?.toString()) || c.members[0];
  };

  const filteredConvos = useMemo(() => {
    if (!panelSearch.trim()) return convos;
    const term = panelSearch.toLowerCase();
    return convos.filter((c) => {
      const label = c.group?.name || getOtherUser(c)?.displayName || getOtherUser(c)?.username || '';
      return label?.toLowerCase().includes(term);
    });
  }, [convos, panelSearch, me]);

  const sortedMessages = useMemo(() => sortMessages(messages), [messages]);
  const activeConvo = useMemo(() => convos.find((c) => c._id === id), [convos, id]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      send(e);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 anim-section chat-layout">
      <aside className="glass-panel p-5 card-rise convo-panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Inbox</p>
            <h2 className="text-xl font-semibold text-white">Direct Messages</h2>
          </div>
          <button
            onClick={() => setShowUserSelect(true)}
            className="neon-btn text-xs"
          >
            + New
          </button>
        </div>
        <div className="relative mb-4">
          <input
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full convo-search input-focus text-sm placeholder-white/50"
          />
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
          </span>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto soft-scrollbar" style={{ scrollBehavior: 'auto' }}>
          {filteredConvos.map((c) => {
            const other = getOtherUser(c);
            const isGroup = c.group;
            const isActive = id === c._id;
            const lastMessage = c.lastMessage?.text || c.group?.lastMessage?.text || '';
            const updatedAt = c.lastMessage?.createdAt || c.updatedAt;
            return (
              <button
                key={c._id}
                onClick={() => navigate(`/messages/${c._id}`)}
                className={`conversation-card ${isActive ? 'active' : ''}`}
              >
                {isGroup ? (
                  c.group?.avatarUrl ? (
                    <img src={getImageUrl(c.group.avatarUrl)} alt="group" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20" />
                  )
                ) : other?.avatarUrl ? (
                  <img src={getImageUrl(other.avatarUrl)} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20" />
                )}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white font-medium truncate">
                      {isGroup ? c.group?.name : (other?.displayName || other?.username || 'Chat')}
                    </div>
                    <span className="conversation-time">{formatRelativeTime(updatedAt)}</span>
                  </div>
                  <p className="conversation-snippet">
                    {lastMessage ? lastMessage : isGroup ? 'Group created' : 'Tap to open chat'}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="unread-pill">{c.unreadCount}</span>
                  )}
                </div>
              </button>
            );
          })}
          {convos.length === 0 && <div className="text-white/70 text-sm">No conversations</div>}
        </div>
      </aside>
      <main className="md:col-span-2 glass-panel flex flex-col card-rise delay-2 chat-window">
        {id ? (
          <>
            <div className="chat-header">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Chatting with</p>
                <h3 className="text-xl font-semibold text-white">
                  {activeConvo?.group?.name ||
                    getOtherUser(activeConvo || {})?.displayName ||
                    getOtherUser(activeConvo || {})?.username ||
                    'Conversation'}
                </h3>
                <p className="text-sm text-white/60">
                  {activeConvo?.group ? `${activeConvo?.group?.members?.length || 0} members` : 'Direct message'}
                </p>
              </div>
            </div>
            <div ref={messageListRef} className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[600px] soft-scrollbar chat-stream" style={{ scrollBehavior: 'auto' }}>
              {sortedMessages.map((m) => {
                const isMine = m.sender?._id === me?._id;
                const rawReactions = m.reactions || {};
                const reactionEntries = rawReactions.entries ? Array.from(rawReactions.entries()) : Object.entries(rawReactions);
                const reactionsToShow = reactionEntries.filter(([, users]) => (users || []).length > 0);
                const content = parseMessagePayload(m.text);
                const isMediaMessage = content.type !== 'text';
                return (
                  <div key={m._id} className={`message-row ${isMine ? 'mine' : ''}`}>
                    {m.sender?.avatarUrl ? (
                      <img src={getImageUrl(m.sender.avatarUrl)} alt="avatar" className="message-avatar" />
                    ) : (
                      <div className="message-avatar placeholder" />
                    )}
                    <div className="message-content">
                      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${isMediaMessage ? 'with-media' : ''}`}>
                        <div className="message-meta">
                          <span>@{m.sender?.username}</span>
                          <span>{formatTime(m.createdAt)}</span>
                        </div>
                        {isMediaMessage ? (
                          <div className={`message-media ${content.type}`}>
                            <img src={content.url} alt={content.type} loading="lazy" />
                          </div>
                        ) : (
                          <p className="message-text">{content.text}</p>
                        )}
                        {reactionsToShow.length > 0 && (
                          <div className="reaction-tray">
                            {reactionsToShow.map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => react(m._id, emoji)}
                                className="reaction-chip"
                              >
                                {emoji} {(users || []).length}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReactions(showReactions === m._id ? null : m._id)}
                        className="reaction-toggle"
                      >
                        +
                      </button>
                      {showReactions === m._id && (
                        <div className="reaction-popover">
                          {reactionPalette.map((emoji) => (
                            <button key={emoji} onClick={() => react(m._id, emoji)} className="reaction-option">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {sortedMessages.length === 0 && (
                <div className="text-white/70 text-sm text-center py-10">No messages yet</div>
              )}
              <div ref={messagesEndRef} />
              {showScrollHint && (
                <button
                  type="button"
                  className="scroll-bottom-btn"
                  onClick={() => scrollToBottom()}
                  aria-label="Jump to latest message"
                >
                  ↓
                </button>
              )}
            </div>
            <form
              ref={composerRef}
              onSubmit={send}
              className={`composer-shell ${composerFocused ? 'focused' : ''}`}
            >
              <div className="composer-input">
                <div className="composer-tools">
                  <button
                    type="button"
                    className={`composer-btn ${activePicker === 'emoji' ? 'active' : ''}`}
                    onClick={() => togglePicker('emoji')}
                    aria-label="Add emoji"
                  >
                    😊
                  </button>
                  <button
                    type="button"
                    className={`composer-btn ${activePicker === 'sticker' ? 'active' : ''}`}
                    onClick={() => togglePicker('sticker')}
                    aria-label="Add sticker"
                  >
                    💠
                  </button>
                  <button
                    type="button"
                    className={`composer-btn ${activePicker === 'gif' ? 'active' : ''}`}
                    onClick={() => togglePicker('gif')}
                    aria-label="Add GIF"
                  >
                    GIF
                  </button>
                </div>
                <textarea
                  className="flex-1 input-focus text-white placeholder-white/60 resize-none"
                  rows={1}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onFocus={() => setComposerFocused(true)}
                  onBlur={() => setComposerFocused(false)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Type a message... (Shift + Enter for new line)"
                />
              </div>
              <button className="neon-btn" disabled={!text.trim()}>
                Send
              </button>
              {activePicker && (
                <div className="picker-panel" ref={pickerRef}>
                  {activePicker === 'emoji' && (
                    <div className="picker-grid">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="picker-emoji"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  {activePicker === 'sticker' && (
                    <div className="sticker-grid">
                      {STICKER_LIBRARY.map((sticker) => (
                        <button
                          key={sticker.id}
                          type="button"
                          className="sticker-card"
                          onClick={() => handleStickerSelect(sticker.url)}
                        >
                          <img src={sticker.url} alt="sticker" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                  {activePicker === 'gif' && (
                    <div className="gif-panel">
                      <div className="picker-search">
                        <input
                          value={gifQuery}
                          onChange={(e) => setGifQuery(e.target.value)}
                          onKeyDown={handleGifInputKeyDown}
                          placeholder="Search Tenor..."
                          className="input-focus text-sm placeholder-white/60"
                        />
                        <button type="button" className="composer-btn" onClick={handleGifSearch}>
                          Search
                        </button>
                      </div>
                      {!gifQuery && (
                        <div className="gif-suggestions">
                          <p className="text-xs text-white/60 mb-2">Suggestions:</p>
                          <div className="flex flex-wrap gap-2">
                            {GIF_SUGGESTIONS.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="gif-suggestion-btn"
                                onClick={() => {
                                  setGifQuery(suggestion);
                                  fetchGifs(suggestion);
                                }}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {gifError && <p className="picker-error">{gifError}</p>}
                      <div className="gif-grid">
                        {gifLoading ? (
                          <p className="text-white/70 text-sm">Loading GIFs…</p>
                        ) : gifResults.length === 0 ? (
                          <p className="text-white/70 text-sm">No GIFs found. Try a different search.</p>
                        ) : (
                          gifResults.map((gif) => {
                            const url = extractGifUrl(gif);
                            if (!url) return null;
                            return (
                              <button
                                key={gif.id}
                                type="button"
                                className="gif-card"
                                onClick={() => handleGifSelect(gif)}
                              >
                                <img src={url} alt={gif.content_description || 'GIF'} loading="lazy" />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="empty-chat-state text-center">
              <h3 className="text-2xl font-semibold mb-2 text-white">Pick a chat</h3>
              <p className="text-white/70 mb-6">Conversations and DMs will appear here.</p>
              <button className="neon-btn text-sm" onClick={() => setShowUserSelect(true)}>
                Start a conversation
              </button>
            </div>
          </div>
        )}
      </main>

      <Modal open={showUserSelect} onClose={() => { setShowUserSelect(false); setSearchQuery(''); }} title="Select User to Message">
        <div>
          <input
            className="w-full input-focus mb-4 text-white placeholder-white/40"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="space-y-2 max-h-64 overflow-auto">
            {searchResults.map((user) => (
              <button
                key={user._id}
                onClick={() => startChat(user)}
                className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg"
              >
                {user.avatarUrl ? (
                  <img src={getImageUrl(user.avatarUrl)} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20" />
                )}
                <div>
                  <div className="font-medium text-white">{user.displayName || user.username}</div>
                  <div className="text-sm text-white/60">@{user.username}</div>
                </div>
              </button>
            ))}
            {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-white/60">No users found</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}