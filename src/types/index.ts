export type OnlineStatus = 'online' | 'offline' | 'away';

export interface UserPrivacySettings {
  lastSeenVisibility: 'everyone' | 'friends' | 'nobody';
  readReceipts: boolean;
  profilePhotoVisibility: 'everyone' | 'friends' | 'nobody';
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  statusBio: string;
  onlineStatus: OnlineStatus;
  lastSeen: string;
  privacySettings: UserPrivacySettings;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendUser: User;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ReplyContext {
  id: string;
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'file';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  audioDuration?: number; // duration in seconds for voice notes
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: ReplyContext;
  reactions: MessageReaction[];
  isEdited?: boolean;
  isPinned?: boolean;
  isStarred?: boolean;
  expiresAt?: string; // for disappearing messages
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string; // used for groups
  avatarUrl?: string;
  description?: string;
  memberIds: string[];
  members: User[];
  adminIds?: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  disappearingMessagesDuration?: number; // 0, 86400 (24h), 604800 (7d), 7776000 (90d)
  wallpaper?: 'emerald-mesh' | 'obsidian' | 'cyber-grid' | 'midnight';
  updatedAt: string;
  createdAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
}
