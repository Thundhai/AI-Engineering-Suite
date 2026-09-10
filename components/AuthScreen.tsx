import React, { useState } from 'react';
import { signIn, signUp } from '../services/authService';
import { GearIcon } from './Icons';

interface AuthScreenProps {
  onSignedIn: () => void;
}

type Mode = 'sign-in' | 'sign-up';

const AuthScreen: React.FC<AuthScreenProps> = ({ onSignedIn }) => {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      if (mode === 'sign-up') {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          setNotice('Check your inbox to confirm your email, then sign in.');
          setMode('sign-in');
        } else {
          onSignedIn();
        }
      } else {
        await signIn(email, password);
        onSignedIn();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-eng-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="bg-eng-navy p-2 rounded-lg">
            <GearIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-eng-navy">AI Engineering Suite</span>
        </div>

        <div className="eng-panel p-6">
          <div className="flex mb-6 border border-eng-border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode('sign-in'); setError(null); setNotice(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'sign-in' ? 'bg-eng-navy text-white' : 'bg-white text-eng-muted hover:bg-slate-50'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('sign-up'); setError(null); setNotice(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'sign-up' ? 'bg-eng-navy text-white' : 'bg-white text-eng-muted hover:bg-slate-50'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eng-label" htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full eng-input text-sm"
              />
            </div>
            <div>
              <label className="eng-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full eng-input text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-eng-danger bg-eng-danger-soft border border-eng-danger/20 rounded-md px-3 py-2">{error}</p>
            )}
            {notice && (
              <p className="text-sm text-eng-success bg-eng-success-soft border border-eng-success/20 rounded-md px-3 py-2">{notice}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full eng-button eng-button-primary justify-center">
              {isSubmitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-eng-muted mt-6">
          Your projects, reports, and files are private to your account.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
