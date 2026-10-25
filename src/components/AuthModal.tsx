import React, { useState, useEffect } from 'react';
import {
  Mail,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Users,
  MessageSquare,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { DeedsLogo } from './DeedsLogo';
import { sounds } from '../utils/soundEffects';
import {
  registerWithEmail,
  signInWithEmail,
  sendPasswordResetEmail,
  resendVerificationEmail,
} from '../lib/authService';
import { getSavedSupabaseConfig } from '../lib/supabase';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  defaultMode?: 'welcome' | 'create' | 'login' | 'verify' | 'features' | 'forgot';
  canCloseWithoutAuth?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'welcome',
  canCloseWithoutAuth = true,
}) => {
  const [mode, setMode] = useState<'welcome' | 'create' | 'login' | 'verify' | 'features' | 'forgot'>(defaultMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSupabaseConfigured = getSavedSupabaseConfig().isConnected;

  useEffect(() => {
    setMode(defaultMode);
    setError('');
    setSuccessMsg('');
  }, [defaultMode, isOpen]);

  // Resend code countdown timer
  useEffect(() => {
    let interval: number;
    if ((mode === 'verify' || mode === 'forgot') && timerSeconds > 0) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timerSeconds]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const newDigits = [...verificationDigits];
    newDigits[index] = digit;
    setVerificationDigits(newDigits);

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationDigits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  // 1. Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const res = await registerWithEmail(email, password, displayName);
      setIsLoading(false);

      if (!res.success) {
        setError(res.error || 'Failed to create account.');
        return;
      }

      sounds.playSent();
      if (res.needsVerification) {
        setSuccessMsg(res.message || 'Verification email sent. Please verify to continue.');
        setTimerSeconds(60);
        // Pre-fill test digits for quick preview if in local mode
        setVerificationDigits(['1', '2', '3', '4', '5', '6']);
        setMode('verify');
      } else if (res.user) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setError((err as Error).message || 'An unexpected error occurred.');
    }
  };

  // 2. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const res = await signInWithEmail(email, password);
      setIsLoading(false);

      if (!res.success) {
        if (res.needsVerification) {
          setError(res.error || 'Please verify your email address.');
          setMode('verify');
        } else {
          setError(res.error || 'Invalid email or password.');
        }
        return;
      }

      sounds.playSent();
      if (res.user) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setError((err as Error).message || 'Failed to sign in.');
    }
  };

  // 3. Submit Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const res = await sendPasswordResetEmail(email);
      setIsLoading(false);
      if (res.success) {
        sounds.playSent();
        setSuccessMsg(res.message);
        setTimerSeconds(60);
      } else {
        setError(res.message || 'Failed to send reset link.');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setError((err as Error).message || 'Error requesting password reset.');
    }
  };

  // 4. Submit Verification Code
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationDigits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    sounds.playSent();
    const verifiedUser: User = {
      id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: email || 'user@deedschat.com',
      username: displayName ? displayName.toLowerCase().replace(/\s+/g, '_') : 'deeds_user',
      displayName: displayName || 'Deeds Member',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      statusBio: 'Be kind. 😊',
      onlineStatus: 'online',
      lastSeen: new Date().toISOString(),
      privacySettings: {
        lastSeenVisibility: 'everyone',
        readReceipts: true,
        profilePhotoVisibility: 'everyone',
      },
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    onSuccess(verifiedUser);
    onClose();
  };

  // 5. Resend Verification
  const handleResend = async () => {
    if (timerSeconds > 0) return;
    sounds.playTap();
    setIsLoading(true);
    setError('');

    try {
      const res = await resendVerificationEmail(email);
      setIsLoading(false);
      setSuccessMsg(res.message);
      setTimerSeconds(60);
    } catch {
      setIsLoading(false);
      setError('Failed to resend verification.');
    }
  };

  const handleQuickDemo = async () => {
    sounds.playSent();
    const res = await signInWithEmail('sarah@deedschat.com', 'password123');
    if (res.user) {
      onSuccess(res.user);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-[#071310] border border-emerald-500/25 p-6 shadow-2xl text-white my-auto overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* 1. WELCOME SCREEN */}
        {mode === 'welcome' && (
          <div className="flex flex-col items-center text-center py-4">
            <DeedsLogo size="xl" showText={true} showTagline={true} className="mb-6" />

            {/* Glowing wave graphic indicator */}
            <div className="w-full h-10 mb-6 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 40" fill="none">
                <path
                  d="M0 25C50 10 70 35 120 20C160 5 180 30 200 20"
                  stroke="url(#wave-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="wave-grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#059669" stopOpacity="0.2" />
                    <stop offset="0.5" stopColor="#10b981" />
                    <stop offset="1" stopColor="#34d399" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => {
                  sounds.playTap();
                  setMode('create');
                }}
                className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
              >
                Create Account
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setMode('login');
                }}
                className="w-full py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-emerald-500/30 text-sm font-medium transition-all active:scale-[0.98]"
              >
                Sign In with Email
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setMode('features');
                }}
                className="text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors mt-2"
              >
                Explore Deeds Chat Features ✨
              </button>

              {/* Quick Demo button */}
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Quick demo as Sarah Wilson
              </button>
            </div>
          </div>
        )}

        {/* 2. FEATURES INTRO SCREEN */}
        {mode === 'features' && (
          <div className="flex flex-col items-center py-2">
            <button
              onClick={() => setMode('welcome')}
              className="self-start p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 mb-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <DeedsLogo size="md" showText={true} />
            <p className="text-xs text-slate-400 font-medium mb-5">More than just a chat</p>

            <div className="w-full flex flex-col gap-3 mb-6 text-left">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/15">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Email-only sign in</h4>
                  <p className="text-[11px] text-slate-400">Password protected with email verification</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/15">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Find friends by email</h4>
                  <p className="text-[11px] text-slate-400">Private search without exposing user contacts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/15">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Groups & channels</h4>
                  <p className="text-[11px] text-slate-400">Collaborate with community moderation</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/15">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Rich media & HD calls</h4>
                  <p className="text-[11px] text-slate-400">Voice calls, video calls with PiP webcam</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMode('create')}
              className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
            >
              Start Chatting
            </button>
          </div>
        )}

        {/* 3. CREATE ACCOUNT SCREEN */}
        {mode === 'create' && (
          <div className="flex flex-col items-center py-2">
            <button
              onClick={() => setMode('welcome')}
              className="self-start p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 mb-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <DeedsLogo size="md" showText={true} />
            <h3 className="text-lg font-bold text-white mt-3 mb-0.5">Create your account</h3>
            <p className="text-xs text-slate-400 mb-4">Enter your details to register securely</p>

            <form onSubmit={handleRegisterSubmit} className="w-full flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 ml-1">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 ml-1">
                  Password (min 6 characters)
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 ml-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-1 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    sounds.playTap();
                    setError('');
                    setSuccessMsg('');
                    setMode('login');
                  }}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Sign In
                </button>
              </p>
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}

        {/* 4. SIGN IN SCREEN */}
        {mode === 'login' && (
          <div className="flex flex-col items-center py-2">
            <button
              onClick={() => setMode('welcome')}
              className="self-start p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 mb-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <DeedsLogo size="md" showText={true} />
            <h3 className="text-lg font-bold text-white mt-3 mb-0.5">Welcome back</h3>
            <p className="text-xs text-slate-400 mb-4">Sign in to your account with email</p>

            <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-[11px] font-medium text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setError('');
                      setSuccessMsg('');
                      setMode('forgot');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-1 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    sounds.playTap();
                    setError('');
                    setSuccessMsg('');
                    setMode('create');
                  }}
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Create Account
                </button>
              </p>
            </div>

            {/* Quick Demo button */}
            <div className="w-full mt-5 pt-3.5 border-t border-slate-800/80 flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-xs text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick demo sign in as Sarah Wilson
              </button>
            </div>
          </div>
        )}

        {/* 5. FORGOT PASSWORD SCREEN */}
        {mode === 'forgot' && (
          <div className="flex flex-col items-center py-2 text-center">
            <button
              onClick={() => setMode('login')}
              className="self-start p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 mb-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Reset Your Password</h3>
            <p className="text-xs text-slate-400 mb-5">
              Enter your registered email address to receive password reset instructions.
            </p>

            <form onSubmit={handleForgotSubmit} className="w-full flex flex-col gap-3.5 text-left">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-1 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Email</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  sounds.playTap();
                  setError('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* 6. EMAIL VERIFICATION SCREEN */}
        {mode === 'verify' && (
          <div className="flex flex-col items-center text-center py-2">
            <button
              onClick={() => setMode('create')}
              className="self-start p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 mb-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Glowing Email Icon Container */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Mail className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Verify Your Email</h3>
            <p className="text-xs text-slate-400 mb-1">
              We've sent a verification link & code to
            </p>
            <p className="text-xs font-semibold text-emerald-400 mb-4">{email || 'you@example.com'}</p>

            {successMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 text-left">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="w-full flex flex-col items-center gap-4">
              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-between gap-1.5 w-full">
                {verificationDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`digit-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  />
                ))}
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
              >
                Verify & Continue
              </button>
            </form>

            <div className="mt-5 text-xs text-slate-400">
              <p>Didn't receive the email or code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={timerSeconds > 0 || isLoading}
                className={`mt-1 font-medium transition-colors ${
                  timerSeconds > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-emerald-400 hover:underline'
                }`}
              >
                Resend verification {timerSeconds > 0 && `(00:${timerSeconds < 10 ? '0' : ''}${timerSeconds})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
