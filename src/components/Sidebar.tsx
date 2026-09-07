import React, { useState } from 'react';
import { PeerContact, AnonymousProfile } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  Bot,
  Search,
  Radio,
  Plus,
  X,
  Sparkles,
  Key,
} from 'lucide-react';

interface SidebarProps {
  contacts: PeerContact[];
  activeFingerprint: string | null;
  onlinePeers: Array<{ peerId: string; alias: string; publicKey: string; fingerprint: string }>;
  onSelectContact: (fingerprint: string) => void;
  onAddContact: (alias: string, publicKeyJwk: string) => Promise<PeerContact>;
}

export function Sidebar({
  contacts,
  activeFingerprint,
  onlinePeers,
  onSelectContact,
  onAddContact,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'peers'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [newPublicKeyJwk, setNewPublicKeyJwk] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newPublicKeyJwk.trim()) {
      setAddError('Public Key (JWK) is required');
      return;
    }
    try {
      // Validate JSON
      JSON.parse(newPublicKeyJwk.trim());
      const contact = await onAddContact(newAlias, newPublicKeyJwk.trim());
      onSelectContact(contact.fingerprint);
      setShowAddModal(false);
      setNewAlias('');
      setNewPublicKeyJwk('');
    } catch {
      setAddError('Invalid Public Key JWK format. Please paste the full valid JSON.');
    }
  };

  const handleQuickAddPeer = async (peer: { alias: string; publicKey: string; fingerprint: string }) => {
    try {
      const contact = await onAddContact(peer.alias, peer.publicKey);
      onSelectContact(contact.fingerprint);
      setActiveTab('chats');
    } catch (e) {
      console.error('Failed to add peer:', e);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.fingerprint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      id="sidebar-container"
      className="w-full md:w-80 lg:w-96 border-r border-white/5 bg-[#0A0A0A] flex flex-col shrink-0 text-[#E0E0E0]"
    >
      {/* Top Search & Actions */}
      <div className="p-4 border-b border-white/5 space-y-3 bg-[#080808]/50">
        <div className="flex items-center justify-between">
          {/* Tab buttons */}
          <div className="flex bg-[#050505] p-1 rounded-lg border border-white/5">
            <button
              id="sidebar-tab-chats"
              onClick={() => setActiveTab('chats')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'chats'
                  ? 'bg-white/5 text-white border border-white/10 shadow-xs'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Encrypted Chats
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/60">
                {contacts.length}
              </span>
            </button>
            <button
              id="sidebar-tab-peers"
              onClick={() => setActiveTab('peers')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'peers'
                  ? 'bg-white/5 text-white border border-white/10 shadow-xs'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              Online Relay
              {onlinePeers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {onlinePeers.length}
                </span>
              )}
            </button>
          </div>

          <button
            id="open-add-contact-modal-btn"
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-colors"
            title="Add Peer by Public Key"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search fingerprints or alias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#101010] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Main List Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <p className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">
          {activeTab === 'chats' ? 'Active Channels' : 'Discovered Relays'}
        </p>

        {activeTab === 'chats' ? (
          filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-xs text-white/30 space-y-2">
              <Users className="w-8 h-8 mx-auto text-white/20" />
              <p>No contacts found</p>
              <button
                id="empty-add-contact-btn"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium inline-flex items-center gap-1 border border-white/10"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = contact.fingerprint === activeFingerprint;
              return (
                <button
                  key={contact.fingerprint}
                  id={`contact-item-${contact.fingerprint}`}
                  onClick={() => onSelectContact(contact.fingerprint)}
                  className={`w-full p-3 rounded-lg transition-all flex items-center justify-between text-left group ${
                    isSelected
                      ? 'bg-white/5 border border-white/10 shadow-xs'
                      : 'hover:bg-white/[0.03] border border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Avatar / Indicator */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-[#121212] border border-white/10 flex items-center justify-center text-base shadow-inner">
                        {contact.isEchoBot ? (
                          <Bot className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="font-mono text-indigo-300 font-medium text-xs">
                            {contact.alias.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {contact.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] border border-[#0A0A0A]" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white truncate">
                          {contact.alias}
                        </span>
                        {contact.isVerified ? (
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                            title="Safety Number Verified"
                          />
                        ) : (
                          <ShieldAlert
                            className="w-3.5 h-3.5 text-white/30 shrink-0"
                            title="Unverified Safety Number"
                          />
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-white/40 truncate italic mt-0.5">
                        {contact.fingerprint}
                      </div>
                    </div>
                  </div>

                  {/* Unread badge */}
                  {contact.unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white font-mono shrink-0 ml-2 shadow-[0_0_8px_rgba(79,70,229,0.4)]">
                      {contact.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )
        ) : (
          /* Online Peers connected to Blind Relay */
          <div className="space-y-2">
            {onlinePeers.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/30 space-y-2">
                <Radio className="w-7 h-7 mx-auto text-white/20 animate-pulse" />
                <p>No other anonymous peers online on the relay right now.</p>
                <p className="text-[11px] text-white/40">
                  Open this link in a second private tab or another device to chat in real-time, or
                  message the built-in Echo Sentinel!
                </p>
              </div>
            ) : (
              onlinePeers.map((peer) => {
                const alreadyInContacts = contacts.some((c) => c.fingerprint === peer.fingerprint);
                return (
                  <div
                    key={peer.fingerprint}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-sm font-medium text-white flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
                        {peer.alias}
                      </div>
                      <div className="text-[11px] font-mono text-white/40 truncate italic mt-0.5">
                        {peer.fingerprint}
                      </div>
                    </div>

                    <button
                      id={`chat-with-peer-${peer.fingerprint}`}
                      onClick={() => handleQuickAddPeer(peer)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-colors shrink-0"
                    >
                      {alreadyInContacts ? 'Open Chat' : 'Start E2EE'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Elegant Dark Sidebar Footer Status */}
      <div className="p-4 bg-[#080808] border-t border-white/5 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-white/30 font-mono tracking-wider">
          <span>E2EE: ACTIVE</span>
          <span className="text-emerald-500/80">SECURE TUNNEL 256b</span>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 text-[#E0E0E0]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <h3 className="font-medium text-sm flex items-center gap-2 text-white">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Add Encrypted Contact
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-white/40 block mb-1 font-medium">
                  Contact Alias / Codename
                </label>
                <input
                  id="add-contact-alias-input"
                  type="text"
                  placeholder="e.g. Agent-K or Confidential Source"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="w-full bg-[#101010] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 block mb-1 font-medium">
                  ECDH Public Key (JWK JSON)
                </label>
                <textarea
                  id="add-contact-key-input"
                  rows={4}
                  placeholder='Paste peer’s public key JWK: {"kty":"EC","crv":"P-256",...}'
                  value={newPublicKeyJwk}
                  onChange={(e) => setNewPublicKeyJwk(e.target.value)}
                  className="w-full bg-[#101010] border border-white/10 rounded-lg p-3 text-xs font-mono text-zinc-200 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70"
                >
                  Cancel
                </button>
                <button
                  id="save-new-contact-btn"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-colors"
                >
                  Add Contact & Derive Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
