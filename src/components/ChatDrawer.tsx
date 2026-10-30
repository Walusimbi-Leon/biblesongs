import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, CornerDownRight, AtSign } from 'lucide-react';
import { ChatMessage, ChatUser } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUser: ChatUser;
  replyTo: { id?: string; name: string; text: string } | null;
  onSetReplyTo: (reply: { id?: string; name: string; text: string } | null) => void;
  onSendMessage: (text: string) => void;
}

function formatChatTime(timestamp: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}d`;
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || 'G').length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360}, 75%, 68%)`;
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  currentUser,
  replyTo,
  onSetReplyTo,
  onSendMessage,
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleMention = (userName: string) => {
    setInputText(prev => (prev ? `${prev} @${userName} ` : `@${userName} `));
  };

  if (!isOpen) return null;

  return (
    <div
      id="chat-drawer-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        id="chat-drawer-panel"
        className="relative flex h-full w-full max-w-md flex-col bg-[#0D0704]/98 border-l border-white/10 p-5 shadow-2xl shadow-black text-white/90"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-amber-400">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-base sm:text-lg font-light tracking-widest uppercase text-amber-100/90 font-sans">
              Community Chat
            </h2>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
              {messages.length >= 400 ? 'Latest 400' : `${messages.length}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-white/40 text-xs">
              <span>No messages yet. Say hello to fellow listeners!</span>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.user?.uid === currentUser.uid;
              const authorName = msg.user?.name || 'Guest';
              const color = getAvatarColor(authorName);

              return (
                <div
                  key={msg.id}
                  className={`group relative flex flex-col rounded-2xl p-3 border text-xs transition-all ${
                    isMine
                      ? 'bg-amber-500/10 border-amber-500/30 ml-4'
                      : 'bg-white/[0.03] border-white/[0.06] mr-4'
                  }`}
                >
                  {/* Quoted reply if exists */}
                  {msg.replyTo && (
                    <div className="mb-1.5 flex items-center gap-1 text-[10px] text-white/50 bg-black/40 px-2 py-1 rounded-lg border-l-2 border-amber-400">
                      <CornerDownRight className="h-2.5 w-2.5 text-amber-400" />
                      <span className="font-semibold text-white/80">{msg.replyTo.name}:</span>
                      <span className="truncate max-w-[200px]">{msg.replyTo.text}</span>
                    </div>
                  )}

                  {/* Message Author and Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {msg.user?.avatar ? (
                        <img
                          src={msg.user.avatar}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-white/20"
                        />
                      ) : (
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black"
                          style={{ backgroundColor: color }}
                        >
                          {(authorName || 'G')[0].toUpperCase()}
                        </div>
                      )}
                      <span
                        className="font-medium cursor-pointer hover:underline"
                        style={{ color }}
                        onClick={() => handleMention(authorName)}
                        title="Click to mention"
                      >
                        {authorName}
                      </span>
                    </div>

                    <span className="text-[10px] text-white/40 font-mono">
                      {formatChatTime(msg.ts)}
                    </span>
                  </div>

                  {/* Message body */}
                  <p className="mt-1.5 text-white/90 leading-relaxed break-words font-light">
                    {msg.text}
                  </p>

                  {/* Hover Actions: Reply & Mention */}
                  <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-[#1A0F0A] rounded-lg p-0.5 border border-white/10 shadow">
                    <button
                      onClick={() =>
                        onSetReplyTo({
                          id: msg.id,
                          name: authorName,
                          text: msg.text,
                        })
                      }
                      title="Reply to message"
                      className="p-1 text-white/50 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <CornerDownRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMention(authorName)}
                      title="Mention user"
                      className="p-1 text-white/50 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <AtSign className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form & Active Reply Banner */}
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 pt-2 border-t border-white/10">
          {replyTo && (
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 border border-amber-500/25">
              <span className="truncate">
                Replying to <b>{replyTo.name}</b>: {replyTo.text.slice(0, 40)}...
              </span>
              <button
                type="button"
                onClick={() => onSetReplyTo(null)}
                className="text-white/40 hover:text-white cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Message listeners... (@name to mention)"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              maxLength={400}
              className="flex-1 rounded-2xl bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder-white/40 border border-white/10 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
