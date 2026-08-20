import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });
        if (error) throw error;
        
        // If auto-confirm is disabled in Supabase, data.session will be null, so tell the user to confirm.
        // If auto-confirm is enabled, they are logged in automatically.
        if (data.user && !data.session) {
          alert('Verification email sent! Please check your email to verify your account, then log in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors">
      <div className="w-full max-w-md cred-glass p-8 rounded-2xl border border-border-primary">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-card-bg border border-border-primary mb-4 text-text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-poppins text-text-primary">
            Atomic <span className="text-neutral-450 font-medium">HABITS</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-2 font-medium">
            Atomic Habit Tracker
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 leading-normal">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. James Clear"
                className="w-full px-4 py-3 rounded-lg cred-input text-sm"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-4 py-3 rounded-lg cred-input text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-lg cred-input text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-lg cred-btn-primary text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : isSignUp ? (
              'Create Identity Profile'
            ) : (
              'Enter Workspace'
            )}
          </button>
        </form>

        {/* Form Toggle */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          {isSignUp ? 'Already have an identity?' : "Ready to forge your identity?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-text-primary hover:underline font-semibold focus:outline-none ml-1 cursor-pointer"
          >
            {isSignUp ? 'Login Here' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
};
