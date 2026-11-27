import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faUsers,
  faUserShield,
  faXmark,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { chatService } from '../../services/endpoints/chatService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTimeDhaka } from '../../utils/formatters';
import { toastService } from '../feedback/toastService';

/**
 * Secure Match Chat Box:
 * - Group Chat: accessible to organizer and confirmed match participants
 * - Direct Message: private 1-on-1 between organizer and a player (contact organizer / message joined player)
 */
export const MatchChatBox = ({
  matchId,
  matchTitle = 'Match Chat',
  initialMode = 'dm',
  initialPartnerId = '',
  onClose,
}) => {
  const { user, isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const [mode, setMode] = useState(initialMode); // 'dm' | 'group'
  const [selectedPartnerId, setSelectedPartnerId] = useState(initialPartnerId);
  const [canAccessGroupChat, setCanAccessGroupChat] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const bottomRef = useRef(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const loadMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuth || !matchId) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      setErrorMsg('');
      try {
        const res = await chatService.getMessages(matchId, {
          mode,
          withUserId: mode === 'dm' ? selectedPartnerId : undefined,
        });
        const data = res?.data;
        if (data) {
          setIsOrganizer(Boolean(data.isOrganizer));
          setCanAccessGroupChat(Boolean(data.canAccessGroupChat));
          setThreads(Array.isArray(data.threads) ? data.threads : []);
          setMessages(Array.isArray(data.messages) ? data.messages : []);
          if (!selectedPartnerId && data.activePartnerId) {
            setSelectedPartnerId(data.activePartnerId);
          }
        }
      } catch (err) {
        if (!silent) {
          setErrorMsg(err?.message || 'Unable to load chat messages.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isAuth, matchId, mode, selectedPartnerId]
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Light polling while chat box is open
  useEffect(() => {
    if (!isAuth || !matchId) return undefined;
    const timer = setInterval(() => {
      loadMessages({ silent: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [isAuth, matchId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content) return;

    if (mode === 'dm' && isOrganizer && !selectedPartnerId) {
      toastService.error('Select a joined player first to send a direct message.');
      return;
    }

    setSending(true);
    try {
      const res = await chatService.sendMessage(matchId, {
        content,
        mode,
        recipientId: mode === 'dm' ? selectedPartnerId || undefined : null,
      });
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setInputText('');
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-base font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faLock} className="text-primary text-xs" />
            <span>Sign In Required</span>
          </h3>
          {onClose && (
            <button type="button" onClick={onClose} className="text-light-muted hover:text-error">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
        <p className="font-body text-xs text-light-muted dark:text-dark-muted">
          Please sign in to message the organizer or participate in match group chat.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-md flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-headline text-sm font-bold text-light-on-surface dark:text-dark-on-surface truncate">
            {matchTitle}
          </h3>
          <p className="font-body text-[11px] text-light-muted dark:text-dark-muted flex items-center gap-1">
            <FontAwesomeIcon icon={faLock} className="text-success text-[10px]" />
            <span>{mode === 'group' ? 'Confirmed Squad Group Chat' : 'Private Direct Message'}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMode('dm')}
            className={`px-2.5 py-1 rounded text-[11px] font-label font-semibold flex items-center gap-1 transition-colors ${
              mode === 'dm'
                ? 'bg-primary text-on-primary'
                : 'bg-light-background dark:bg-dark-background text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border'
            }`}
          >
            <FontAwesomeIcon icon={faUserShield} />
            <span>Direct</span>
          </button>

          {(canAccessGroupChat || isOrganizer) && (
            <button
              type="button"
              onClick={() => setMode('group')}
              className={`px-2.5 py-1 rounded text-[11px] font-label font-semibold flex items-center gap-1 transition-colors ${
                mode === 'group'
                  ? 'bg-primary text-on-primary'
                  : 'bg-light-background dark:bg-dark-background text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span>Group Chat</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="w-7 h-7 rounded flex items-center justify-center text-light-muted hover:text-error"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Organizer Participant Selector in DM mode */}
      {mode === 'dm' && isOrganizer && (
        <div className="px-4 py-2 border-b border-light-border dark:border-dark-border bg-light-background/50 dark:bg-dark-background/50 flex items-center gap-2">
          <span className="font-label text-[11px] font-semibold text-light-muted dark:text-dark-muted shrink-0">
            Chat with player:
          </span>
          {threads.length > 0 ? (
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="flex-1 px-2.5 py-1 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs font-body"
            >
              {threads.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isJoined ? '(Joined)' : '(Inquiry)'}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-light-muted dark:text-dark-muted">
              No joined players or inquiries yet.
            </span>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <div className="h-64 overflow-y-auto p-4 flex flex-col gap-2.5 bg-light-background/40 dark:bg-dark-background/40">
        {loading ? (
          <p className="text-xs text-light-muted dark:text-dark-muted text-center my-auto">
            Loading messages...
          </p>
        ) : errorMsg ? (
          <p className="text-xs text-error text-center my-auto">{errorMsg}</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-light-muted dark:text-dark-muted text-center my-auto">
            {mode === 'group'
              ? 'No messages in the match group chat yet. Say hello to the squad!'
              : 'No direct messages yet. Start a private conversation below.'}
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[82%] ${
                  isMine ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <span className="text-[10px] font-label text-light-muted dark:text-dark-muted mb-0.5 px-1">
                  {isMine ? 'You' : msg.senderName} • {formatDateTimeDhaka(msg.createdAt)}
                </span>
                <div
                  className={`px-3 py-2 rounded-lg text-xs font-body break-words ${
                    isMine
                      ? 'bg-primary text-on-primary font-medium'
                      : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-light-border dark:border-dark-border flex items-center gap-2 bg-light-surface dark:bg-dark-surface"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            mode === 'group'
              ? 'Message everyone in this match...'
              : 'Write a private message...'
          }
          maxLength={1000}
          className="flex-1 px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim() || (mode === 'dm' && isOrganizer && !selectedPartnerId)}
          className="px-3.5 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default MatchChatBox;
