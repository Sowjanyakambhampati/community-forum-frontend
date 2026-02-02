export interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt?: string;
  role?: 'user' | 'moderator' | 'admin';
  rating?: number;
  bio?: string;
  location?: string;
  website?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  lastActiveAt?: string;
  threadCount?: number;
  postCount?: number;
  reputation?: number;
  reputationScore?: number;
  neighborhoodId?: string;
  neighborhood?: Neighborhood;
  privacySettings?: Record<string, any>;
  notificationPreferences?: Record<string, any>;
}

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  postalCode?: string;
  description?: string;
  boundaryCoordinates?: any;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  eventCount?: number;
  listingCount?: number;
  postCount?: number;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  eventCount?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: EventCategory | string;
  categoryId?: string;
  startDate: string;
  endDate?: string;
  location: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  capacity?: number;
  currentAttendees?: number;
  price?: number;
  isFree: boolean;
  images?: string[];
  tags?: string[];
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isRecurring?: boolean;
  recurrencePattern?: string;
  createdBy: User;
  createdById?: string;
  neighborhood?: Neighborhood;
  neighborhoodId?: string;
  registrations?: EventRegistration[];
  comments?: EventComment[];
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  registrationCount?: number;
  waitlistCount?: number;
  userRegistration?: EventRegistration;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  event?: Event;
  userId: string;
  user?: User;
  status: 'REGISTERED' | 'WAITLIST' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  notes?: string;
  emergencyContact?: string;
  waitlistPosition?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  user?: User;
  content: string;
  parentId?: string;
  replies?: EventComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: 'SERVICE' | 'ISSUE' | 'QUESTION' | 'ANNOUNCEMENT';
  images?: string[];
  attachments?: {
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
  }[];
  author: User;
  authorId?: string;
  neighborhood?: Neighborhood;
  neighborhoodId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  comments?: CommunityComment[];
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  parentId?: string;
  replies?: CommunityComment[];
  likeCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  threadCount: number;
  postCount: number;
  parentId?: string;
  subcategories?: Category[];
  color?: string;
  icon?: string;
  order?: number;
  isPrivate?: boolean;
  moderators?: User[];
}

export interface Thread {
  id: string;
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  category?: Category;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  postCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted?: boolean;
  lastPostAt: string;
  lastPostAuthor?: User;
  tags?: string[];
  votes?: {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
  };
  hasAnswer?: boolean;
}

export interface Post {
  id: string;
  content: string;
  threadId: string;
  thread?: Thread;
  authorId: string;
  author: User;
  parentId?: string;
  parent?: Post;
  replies?: Post[];
  createdAt: string;
  updatedAt: string;
  isAnswer?: boolean;
  isDeleted?: boolean;
  votes?: {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
  };
  editHistory?: {
    editedAt: string;
    editedBy: User;
    reason?: string;
  }[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'reply' | 'vote' | 'follow' | 'message' | 'system' | 'event_reminder' | 'registration_confirmation' | 'waitlist_promotion';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  relatedType?: 'thread' | 'post' | 'user' | 'listing' | 'event' | 'community_post';
  actionUrl?: string;
  createdAt: string;
  data?: Record<string, any>;
}

export interface SearchResult {
  type: 'thread' | 'post' | 'user' | 'listing' | 'event' | 'community_post';
  id: string;
  title?: string;
  content: string;
  author?: User;
  createdAt: string;
  threadId?: string;
  categoryId?: string;
  category?: Category;
  relevanceScore?: number;
  highlights?: {
    title?: string[];
    content?: string[];
  };
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  isFree?: boolean;
  category: MarketplaceCategory;
  categoryId?: string;
  categoryName?: string;
  location: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'USED' | 'WORN' | 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  status: 'ACTIVE' | 'RESERVED' | 'SOLD' | 'CLOSED' | 'active' | 'sold' | 'inactive' | 'pending';
  images?: string[];
  tags?: string[];
  seller: User;
  sellerId: string;
  neighborhood?: Neighborhood;
  neighborhoodId?: string;
  createdAt: string;
  updatedAt: string;
  isFavorited?: boolean;
  favoriteCount?: number;
  viewCount?: number;
  contactCount?: number;
  isPromoted?: boolean;
  expiresAt?: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  subcategories?: MarketplaceCategory[];
  listingCount?: number;
  order?: number;
}

export interface MarketplaceRequest {
  id: string;
  listingId: string;
  listing?: MarketplaceListing;
  buyerId: string;
  buyer?: User;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  type: 'SELLER' | 'BUYER';
  rating: number;
  comment?: string;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  reviewee?: User;
  listingId?: string;
  listing?: MarketplaceListing;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  recipientId: string;
  recipient: User;
  content: string;
  createdAt: string;
  readAt?: string;
  isDeleted?: boolean;
  attachments?: {
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
  }[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface Report {
  id: string;
  type: 'thread' | 'post' | 'user' | 'listing' | 'event' | 'community_post';
  targetId: string;
  target?: Thread | Post | User | MarketplaceListing | Event | CommunityPost;
  reporterId: string;
  reporter: User;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: User;
  resolution?: string;
}

export interface Analytics {
  totalUsers: number;
  totalThreads: number;
  totalPosts: number;
  totalListings: number;
  totalEvents: number;
  totalCommunityPosts: number;
  activeUsers: number;
  newUsersToday: number;
  newThreadsToday: number;
  newPostsToday: number;
  newEventsToday: number;
  popularCategories: {
    category: Category;
    threadCount: number;
    postCount: number;
  }[];
  userActivity: {
    date: string;
    activeUsers: number;
    newUsers: number;
    posts: number;
    threads: number;
  }[];
  eventStats: {
    upcomingEvents: number;
    totalRegistrations: number;
    averageAttendance: number;
  };
  marketplaceStats: {
    activeListings: number;
    soldItems: number;
    totalTransactionValue: number;
  };
}

export interface Vote {
  id: string;
  userId: string;
  user: User;
  targetId: string;
  targetType: 'thread' | 'post';
  type: 'up' | 'down';
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  usageCount: number;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: {
    replies: boolean;
    mentions: boolean;
    messages: boolean;
    newsletters: boolean;
    eventReminders: boolean;
    waitlistUpdates: boolean;
  };
  privacy: {
    showEmail: boolean;
    showLocation: boolean;
    showOnlineStatus: boolean;
    profileVisibility: 'public' | 'neighbors_only' | 'private';
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    postsPerPage: number;
  };
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
