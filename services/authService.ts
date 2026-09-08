import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AuthResult {
  session: Session | null;
  /** True when Supabase requires the user to confirm their email before a session exists. */
  needsEmailConfirmation: boolean;
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('user already registered')) {
    return 'An account with that email already exists. Try signing in instead.';
  }
  if (lower.includes('password should be at least')) {
    return message;
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Network error: could not reach the authentication service.';
  }
  return message || 'Something went wrong. Please try again.';
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(friendlyAuthError(error.message));
  return { session: data.session, needsEmailConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthError(error.message));
  return { session: data.session, needsEmailConfirmation: false };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
