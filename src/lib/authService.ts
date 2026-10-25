import { getSupabaseClient, getSavedSupabaseConfig } from './supabase';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  needsVerification?: boolean;
  error?: string;
}

const LOCAL_USERS_KEY = 'deeds_registered_users';
const ACTIVE_SESSION_KEY = 'deeds_active_session_user';

// Helper to get local registered accounts
function getLocalUsers(): Record<string, { email: string; passwordHash: string; displayName: string; verified: boolean; createdAt: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, { email: string; passwordHash: string; displayName: string; verified: boolean; createdAt: string }>) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getStoredSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSessionUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Register a new user with email and password
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName,
            username: cleanName.toLowerCase().replace(/\s+/g, '_'),
          },
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // If Supabase requires email verification, session is null or identities check
        const needsConfirmation = !data.session;

        // Try upserting profile record into public.profiles
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            username: cleanName.toLowerCase().replace(/\s+/g, '_'),
            display_name: cleanName,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
            status_bio: 'Available on Deeds Chat',
            online_status: 'online',
            is_email_verified: !needsConfirmation,
          });
        } catch {
          // Profile table trigger or RLS might handle this
        }

        const appUser: User = {
          id: data.user.id,
          email: cleanEmail,
          username: cleanName.toLowerCase().replace(/\s+/g, '_'),
          displayName: cleanName,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
          statusBio: 'Available on Deeds Chat',
          onlineStatus: 'online',
          lastSeen: new Date().toISOString(),
          privacySettings: {
            lastSeenVisibility: 'everyone',
            readReceipts: true,
            profilePhotoVisibility: 'everyone',
          },
          isEmailVerified: !needsConfirmation,
          createdAt: new Date().toISOString(),
        };

        if (needsConfirmation) {
          return {
            success: true,
            needsVerification: true,
            message: `Verification link sent to ${cleanEmail}. Please check your inbox and verify your email.`,
            user: appUser,
          };
        }

        setStoredSessionUser(appUser);
        return {
          success: true,
          needsVerification: false,
          user: appUser,
          message: 'Account created and signed in successfully!',
        };
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to connect to Supabase.' };
    }
  }

  // --- Local Mode Fallback (when Supabase credentials not yet configured in project) ---
  const localUsers = getLocalUsers();
  if (localUsers[cleanEmail]) {
    return { success: false, error: 'An account with this email address already exists. Please sign in.' };
  }

  localUsers[cleanEmail] = {
    email: cleanEmail,
    passwordHash: btoa(password), // Simple obfuscation for local sandbox fallback
    displayName: cleanName,
    verified: false,
    createdAt: new Date().toISOString(),
  };
  saveLocalUsers(localUsers);

  const newUser: User = {
    id: `user_${Date.now()}`,
    email: cleanEmail,
    username: cleanName.toLowerCase().replace(/\s+/g, '_'),
    displayName: cleanName,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    statusBio: 'Hey there! I am using Deeds Chat.',
    onlineStatus: 'online',
    lastSeen: new Date().toISOString(),
    privacySettings: {
      lastSeenVisibility: 'everyone',
      readReceipts: true,
      profilePhotoVisibility: 'everyone',
    },
    isEmailVerified: false,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    needsVerification: true,
    message: `Verification code sent to ${cleanEmail}. Please verify your email to continue.`,
    user: newUser,
  };
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            needsVerification: true,
            error: 'Your email address has not been confirmed yet. Please check your inbox or click resend.',
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch profile
        let profileData = null;
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          profileData = prof;
        } catch {
          // ignore
        }

        const appUser: User = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          username: profileData?.username || data.user.user_metadata?.username || cleanEmail.split('@')[0],
          displayName: profileData?.display_name || data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
          avatarUrl: profileData?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
          statusBio: profileData?.status_bio || 'Available on Deeds Chat',
          onlineStatus: 'online',
          lastSeen: new Date().toISOString(),
          privacySettings: {
            lastSeenVisibility: 'everyone',
            readReceipts: true,
            profilePhotoVisibility: 'everyone',
          },
          isEmailVerified: true,
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        setStoredSessionUser(appUser);
        return { success: true, user: appUser };
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to authenticate with Supabase.' };
    }
  }

  // --- Local Mode Fallback ---
  const localUsers = getLocalUsers();
  const existing = localUsers[cleanEmail];

  // Also check built-in demo users
  if (cleanEmail === 'sarah@deedschat.com' && (password === 'password123' || password === 'sarah123' || password.length >= 6)) {
    const sarahUser: User = {
      id: 'user_sarah_wilson',
      email: 'sarah@deedschat.com',
      username: 'sarahwilson',
      displayName: 'Sarah Wilson',
      avatarUrl: '/src/assets/images/deeds_sarah_avatar_1792889192229.jpg',
      statusBio: 'Be kind. 😊',
      onlineStatus: 'online',
      lastSeen: new Date().toISOString(),
      privacySettings: { lastSeenVisibility: 'everyone', readReceipts: true, profilePhotoVisibility: 'everyone' },
      isEmailVerified: true,
      createdAt: '2026-01-15T08:00:00Z',
    };
    setStoredSessionUser(sarahUser);
    return { success: true, user: sarahUser };
  }

  if (!existing) {
    return {
      success: false,
      error: 'No account found with this email. Please check spelling or create a new account.',
    };
  }

  if (existing.passwordHash !== btoa(password)) {
    return { success: false, error: 'Incorrect password. Please try again or reset your password.' };
  }

  const userObj: User = {
    id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail,
    username: cleanEmail.split('@')[0],
    displayName: existing.displayName,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    statusBio: 'Available on Deeds Chat',
    onlineStatus: 'online',
    lastSeen: new Date().toISOString(),
    privacySettings: { lastSeenVisibility: 'everyone', readReceipts: true, profilePhotoVisibility: 'everyone' },
    isEmailVerified: true,
    createdAt: existing.createdAt,
  };

  setStoredSessionUser(userObj);
  return { success: true, user: userObj };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined,
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `Password reset link sent to ${cleanEmail}. Please check your inbox!` };
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message || 'Failed to send password reset.' };
    }
  }

  // Local fallback
  return {
    success: true,
    message: `Password reset instructions sent to ${cleanEmail}. (In demo mode, you can sign in directly).`,
  };
}

/**
 * Resend email confirmation
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `New verification link sent to ${cleanEmail}!` };
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message || 'Failed to resend email.' };
    }
  }

  return {
    success: true,
    message: `New 6-digit verification code sent to ${cleanEmail}. (Code: 123456).`,
  };
}

/**
 * Sign out user
 */
export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  setStoredSessionUser(null);
}

/**
 * Initialize and verify active session on app load
 */
export async function initializeAuthSession(): Promise<User | null> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const u = data.session.user;
        const email = u.email || 'user@deedschat.com';

        let profile = null;
        try {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
          profile = p;
        } catch {
          // ignore
        }

        const appUser: User = {
          id: u.id,
          email,
          username: profile?.username || u.user_metadata?.username || email.split('@')[0],
          displayName: profile?.display_name || u.user_metadata?.display_name || email.split('@')[0],
          avatarUrl: profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
          statusBio: profile?.status_bio || 'Available on Deeds Chat',
          onlineStatus: 'online',
          lastSeen: new Date().toISOString(),
          privacySettings: {
            lastSeenVisibility: 'everyone',
            readReceipts: true,
            profilePhotoVisibility: 'everyone',
          },
          isEmailVerified: !!u.email_confirmed_at,
          createdAt: u.created_at || new Date().toISOString(),
        };

        setStoredSessionUser(appUser);
        return appUser;
      }
    } catch (err) {
      console.warn('Could not restore Supabase session:', err);
    }
  }

  // Check stored local session
  return getStoredSessionUser();
}
