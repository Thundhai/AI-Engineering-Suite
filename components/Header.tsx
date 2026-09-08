
import React, { useState } from 'react';
import { GearIcon, LogoutIcon } from './Icons';

interface HeaderProps {
  userEmail: string;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-eng-border">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-eng-navy p-2 rounded-lg">
            <GearIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-eng-navy tracking-tight">
              AI Engineering Suite
            </h1>
            <p className="text-xs text-eng-muted">Multidisciplinary engineering assistant</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-eng-border hover:bg-slate-50 transition-colors text-sm text-eng-ink"
          >
            <span className="w-6 h-6 rounded-full bg-eng-accent-soft text-eng-accent flex items-center justify-center text-xs font-semibold">
              {userEmail.charAt(0).toUpperCase() || '?'}
            </span>
            <span className="hidden sm:inline max-w-[160px] truncate">{userEmail}</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-eng-border rounded-md shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); onSignOut(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-eng-ink hover:bg-slate-50 transition-colors"
                >
                  <LogoutIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
