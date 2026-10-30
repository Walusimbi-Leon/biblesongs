import React, { useState } from 'react';
import { User, X, Check, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { ChatUser } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChatUser;
  onSave: (newName: string, newAvatar?: string) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  if (!isOpen) return null;

  const isDiscord = Boolean(
    (currentUser.uid && /^\d{17,20}$/.test(currentUser.uid)) ||
    (currentUser.avatar && currentUser.avatar.includes('discord'))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), avatar.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#0F0804] border border-white/10 p-6 shadow-2xl text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-amber-400">
            <User className="h-5 w-5" />
            <h3 className="text-base font-semibold uppercase tracking-wider text-amber-100 font-sans">
              Listener Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 text-xs">
          {/* Avatar Preview & Discord verification */}
          <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-lg overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" onError={() => setAvatar('')} />
              ) : (
                (name || 'U')[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-white text-sm">{name || 'Your Name'}</p>
                {isDiscord && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 px-2 py-0.5 text-[9px] font-semibold text-[#8B96FF]">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Discord
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/40">
                {isDiscord
                  ? 'Connected via Discord • Real username active'
                  : 'Appears in Community Chat & Hall of Fame'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your nickname..."
              maxLength={28}
              required
              className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-white/30 border border-white/10 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/70 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Avatar Image URL (Optional)</span>
              <ImageIcon className="h-3.5 w-3.5 text-white/40" />
            </label>
            <input
              type="url"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              placeholder="https://... (Discord, GitHub, or any image link)"
              className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-white/30 border border-white/10 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Check className="h-4 w-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
