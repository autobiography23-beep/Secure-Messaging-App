import React, { useState, useRef, useEffect } from 'react';
import {
  PeerContact,
  SecureMessage,
  BurnTimerDuration,
  AnonymousProfile,
} from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  Flame,
  Clock,
  Send,
  Binary,
  Lock,
  Eye,
  Check,
  CheckCheck,
  Bot,
  Info,
  Sparkles,
} from 'lucide-react';

interface ChatWindowProps {
  contact: PeerContact | null;
  activeProfile: AnonymousProfile | null;
  messages: SecureMessage[];
  activeTimerSeconds: BurnTimerDuration;
  activeBurnType: 'on_send' | 'on_view';
  isPeerTyping: boolean;
  onSendMessage: (text: string) => void;
  onSetTimer: (seconds: BurnTimerDuration) => void;
  onSetBurnType: (type: 'on_send' | 'on_view') => void;
  onTriggerBurnOnView: (messageId: string) => void;
  onOpenSafetyNumbers: () => void;
  onOpenCipherInspector: (msg: SecureMessage) => void;
  onTyping: (isTyping: boolean) => void;
}

const TIMER_OPTIONS: Array<{ label: string; value: BurnTimerDuration }> = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
];

export function ChatWindow({
  contact,
  activeProfile,
  messages,
  activeTimerSeconds,
  activeBurnType,
  isPeerTyping,
  onSendMessage,
  onSetTimer,
  onSetBurnType,
  onTriggerBurnOnView,
  onOpenSafetyNumbers,
  onOpenCipherInspector,
  onTyping,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    onTyping(false);
  };

  if (!contact) {
    return (
      <main
        id="empty-chat-state"
        className="flex-1 bg-[#050505] flex flex-col items-center justify-center p-6 text-center text-white/40 select-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-base font-medium text-white">No Encrypted Session Selected</h2>
        <p className="text-xs text-white/40 max-w-sm mt-1 mb-5">
          Select a contact or initiate a session with an online relay peer to begin end-to-end encrypted messaging.
        </p>
      </main>
    );
  }

  return (
    <main
      id="chat-window-container"
      className="flex-1 bg-[#050505] flex flex-col min-w-0 text-[#E0E0E0] relative"
    >
      {/* Chat Top Bar */}
      <div
        id="chat-header-bar"
        className="h-16 px-4 md:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20"
      >
        {/* Contact Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-white/10 flex items-center justify-center text-indigo-300 font-mono text-xs shrink-0">
            {contact.isEchoBot ? (
              <Bot className="w-5 h-5 text-emerald-400" />
            ) : (
              contact.alias.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white tracking-tight truncate">{contact.alias}</span>
              <button
                id="verify-safety-number-btn"
                onClick={onOpenSafetyNumbers}
                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                title="Verify Safety Numbers"
              >
                {contact.isVerified ? (
                  <span className="flex items-center gap-1 text-emerald-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-white/20">
                    <ShieldAlert className="w-3 h-3" /> Unverified
                  </span>
                )}
              </button>
            </div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest truncate mt-0.5 font-mono">
              Fingerprint: {contact.fingerprint}
            </div>
          </div>
        </div>

        {/* Timed Message Control Pill */}
        <div className="flex items-center gap-2">
          {/* Burn on send vs on view */}
          <button
            id="toggle-burn-type-btn"
            onClick={() => onSetBurnType(activeBurnType === 'on_send' ? 'on_view' : 'on_send')}
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeBurnType === 'on_view'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
            title="Switch between Burn on Send vs Burn on View"
          >
            <Eye className="w-3 h-3" />
            <span>{activeBurnType === 'on_view' ? 'Burn on View' : 'Burn on Send'}</span>
          </button>

          {/* Burn Timer duration picker */}
          <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1" />
            <div className="flex gap-0.5">
              {TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  id={`timer-option-${opt.value}`}
                  onClick={() => onSetTimer(opt.value)}
                  className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors ${
                    activeTimerSeconds === opt.value
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-xs'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        id="messages-scroll-area"
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
      >
        {/* Encryption Intro Banner */}
        <div className="flex justify-center">
          <div className="px-4 py-2 bg-white/5 rounded-full text-[10px] text-white/40 uppercase tracking-widest border border-white/5 flex items-center gap-2">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>E2EE Tunnel Active • ECDH + AES-256-GCM</span>
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isOutgoing = msg.direction === 'outgoing';
          const now = Date.now();
          const remainingSecs =
            msg.expiresAt && !msg.isShredded
              ? Math.max(0, Math.ceil((msg.expiresAt - now) / 1000))
              : 0;

          const percentRemaining =
            msg.expiresAt && msg.timerSeconds > 0 && !msg.isShredded
              ? Math.max(0, Math.min(100, (remainingSecs / msg.timerSeconds) * 100))
              : 0;

          const isUnviewedOnView =
            msg.burnType === 'on_view' &&
            !msg.viewedAt &&
            !isOutgoing &&
            !msg.isShredded &&
            msg.timerSeconds > 0;

          return (
            <div
              key={msg.id}
              id={`message-bubble-${msg.id}`}
              className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-md md:max-w-lg rounded-2xl p-4 shadow-sm border transition-all relative ${
                  msg.isShredded
                    ? 'bg-[#0A0505] border-red-950/60 text-red-400/60'
                    : isOutgoing
                    ? 'bg-indigo-950/20 rounded-tr-none border-indigo-500/20 text-indigo-100'
                    : 'bg-[#121212] rounded-tl-none border-white/5 text-[#E0E0E0]'
                }`}
              >
                {/* Header of message: Sender alias & Timed Indicator */}
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] font-medium">
                  <span
                    className={
                      isOutgoing ? 'text-indigo-300/80 font-mono text-[10px] uppercase tracking-wider' : 'text-white/40 font-mono text-[10px] uppercase tracking-wider'
                    }
                  >
                    {isOutgoing ? 'You' : msg.senderAlias}
                  </span>

                  {/* Disappearing Timer Badge */}
                  {msg.timerSeconds > 0 && (
                    <div className="flex items-center gap-1.5">
                      {msg.isShredded ? (
                        <span className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-500" /> Shredded
                        </span>
                      ) : isUnviewedOnView ? (
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {msg.timerSeconds}s on view
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-300 font-mono font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                          {remainingSecs}s
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar for timed messages */}
                {msg.timerSeconds > 0 && !msg.isShredded && !isUnviewedOnView && (
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-amber-400 transition-all duration-200"
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>
                )}

                {/* Message Body Content */}
                {msg.isShredded ? (
                  <div className="py-2 text-xs font-mono text-red-400/80 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>[CRYPTOGRAPHICALLY SHREDDED & DELETED]</span>
                  </div>
                ) : isUnviewedOnView ? (
                  /* Sealed Envelope */
                  <div
                    id={`reveal-msg-btn-${msg.id}`}
                    onClick={() => onTriggerBurnOnView(msg.id)}
                    className="p-3 my-1 rounded-xl bg-indigo-950/30 border border-indigo-500/30 cursor-pointer hover:bg-indigo-900/30 transition-colors flex items-center gap-2.5 text-indigo-200"
                  >
                    <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Protected Ephemeral Message</div>
                      <div className="text-[10px] text-indigo-300/80">
                        Tap to reveal. {msg.timerSeconds}s self-destruct timer will begin immediately.
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {msg.plaintext}
                  </p>
                )}

                {/* Footer: Timestamp, Inspector Trigger, Status */}
                <div className={`flex items-center justify-between gap-3 mt-2 pt-2 border-t text-[10px] ${
                  isOutgoing ? 'border-indigo-500/10 text-indigo-400/50 italic' : 'border-white/5 text-white/20 italic'
                }`}>
                  <div className="flex items-center gap-1.5 font-mono not-italic">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>

                  <div className="flex items-center gap-2 not-italic">
                    {/* Crypto Inspector Button */}
                    <button
                      id={`inspect-cipher-btn-${msg.id}`}
                      onClick={() => onOpenCipherInspector(msg)}
                      className="flex items-center gap-1 text-white/40 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                      title="Inspect Raw Ciphertext & Cryptographic Proof"
                    >
                      <Binary className="w-3 h-3" />
                      <span>Audit Cipher</span>
                    </button>

                    {/* Outgoing delivery tick */}
                    {isOutgoing && (
                      <span className="text-indigo-400">
                        {msg.isShredded ? (
                          <CheckCheck className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Peer Typing indicator */}
        {isPeerTyping && (
          <div className="flex items-center gap-2 text-xs text-white/40 pl-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>{contact.alias} is typing an encrypted message...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Bar */}
      <footer
        id="chat-composer-footer"
        className="p-6 bg-[#050505] border-t border-white/5 shrink-0"
      >
        <form
          id="chat-composer-form"
          onSubmit={handleSend}
          className="relative max-w-4xl mx-auto"
        >
          <div className="relative">
            <input
              id="message-text-input"
              type="text"
              placeholder={`Encrypted message (${activeTimerSeconds > 0 ? `${activeTimerSeconds}s timer` : 'no timer'})...`}
              value={inputText}
              onChange={handleInputChange}
              className="w-full bg-[#101010] border border-white/10 rounded-xl px-6 py-4 text-sm text-[#E0E0E0] placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors pr-28"
              autoComplete="off"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                id="send-message-btn"
                type="submit"
                disabled={!inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-1.5"
              >
                <span>Transmit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        <div className="mt-3 text-center">
          <span className="text-[9px] uppercase tracking-[0.4em] text-white/20">
            Ghost Protocol Active • AES-256-GCM • No logs retained
          </span>
        </div>
      </footer>
    </main>
  );
}
