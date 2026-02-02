import axios from 'axios';
import { 
  Thread, User, Category, Post, Event, EventCategory, EventRegistration, 
  CommunityPost, CommunityComment, Neighborhood, MarketplaceListing, 
  MarketplaceCategory, MarketplaceRequest 
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://community-forum-backend-ts.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Add auth token to requests when available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (email: string, password: string, username?: string, fullName?: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      username: username || email.split('@')[0],
      fullName
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    const data = response.data;
    
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
    }
    
    return data;
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout API error:', error);
      return { success: true };
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    const data = response.data;
    
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
    }
    
    return data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getProfile: async (userId?: string) => {
    const endpoint = userId ? `/users/${userId}` : '/users/profile';
    const response = await api.get(endpoint);
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUsers: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  banUser: async (userId: string, reason?: string) => {
    const response = await api.post(`/users/${userId}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (userId: string) => {
    const response = await api.delete(`/users/${userId}/ban`);
    return response.data;
  }
};

// Events API
export const eventsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    neighborhood?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    isFree?: boolean;
  }) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (data: Partial<Event>) => {
    const response = await api.post('/events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Event>) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Event Registration
  register: async (id: string, data?: { notes?: string; emergencyContact?: string }) => {
    const response = await api.post(`/events/${id}/register`, data || {});
    return response.data;
  },

  unregister: async (id: string) => {
    const response = await api.delete(`/events/${id}/register`);
    return response.data;
  },

  getAttendees: async (id: string, params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get(`/events/${id}/attendees`, { params });
    return response.data;
  },

  updateRegistrationStatus: async (eventId: string, registrationId: string, status: string) => {
    const response = await api.put(`/events/${eventId}/attendees/${registrationId}`, { status });
    return response.data;
  },

  // Event Categories
  getCategories: async () => {
    const response = await api.get('/events/categories');
    return response.data;
  },

  // Event Comments
  getComments: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/events/${id}/comments`, { params });
    return response.data;
  },

  addComment: async (id: string, content: string, parentId?: string) => {
    const response = await api.post(`/events/${id}/comments`, { content, parentId });
    return response.data;
  },

  deleteComment: async (eventId: string, commentId: string) => {
    const response = await api.delete(`/events/${eventId}/comments/${commentId}`);
    return response.data;
  },

  // Search events
  search: async (params: { q: string; category?: string; neighborhood?: string }) => {
    const response = await api.get('/events/search', { params });
    return response.data;
  },

  // Get user's registrations
  getMyRegistrations: async (params?: { status?: string }) => {
    const response = await api.get('/events/my-registrations', { params });
    return response.data;
  },

  // Get user's created events
  getMyEvents: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/events/my-events', { params });
    return response.data;
  }
};

// Community Posts API
export const communityPostsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: 'SERVICE' | 'ISSUE' | 'QUESTION' | 'ANNOUNCEMENT';
    neighborhood?: string;
    search?: string;
    sortBy?: string;
  }) => {
    const response = await api.get('/community-posts', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/community-posts/${id}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    content: string;
    category: 'SERVICE' | 'ISSUE' | 'QUESTION' | 'ANNOUNCEMENT';
    images?: string[];
    tags?: string[];
    neighborhoodId?: string;
  }) => {
    const response = await api.post('/community-posts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CommunityPost>) => {
    const response = await api.put(`/community-posts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/community-posts/${id}`);
    return response.data;
  },

  // Comments
  getComments: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/community-posts/${id}/comments`, { params });
    return response.data;
  },

  addComment: async (id: string, content: string, parentId?: string) => {
    const response = await api.post(`/community-posts/${id}/comments`, { content, parentId });
    return response.data;
  },

  updateComment: async (postId: string, commentId: string, content: string) => {
    const response = await api.put(`/community-posts/${postId}/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string) => {
    const response = await api.delete(`/community-posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  // Likes
  like: async (id: string) => {
    const response = await api.post(`/community-posts/${id}/like`);
    return response.data;
  },

  unlike: async (id: string) => {
    const response = await api.delete(`/community-posts/${id}/like`);
    return response.data;
  },

  // Pin/Unpin (admin)
  pin: async (id: string) => {
    const response = await api.post(`/community-posts/${id}/pin`);
    return response.data;
  },

  unpin: async (id: string) => {
    const response = await api.delete(`/community-posts/${id}/pin`);
    return response.data;
  },

  // Get user's posts
  getMyPosts: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/community-posts/my-posts', { params });
    return response.data;
  }
};

// Neighborhoods API
export const neighborhoodsAPI = {
  getAll: async (params?: { city?: string; search?: string }) => {
    const response = await api.get('/neighborhoods', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/neighborhoods/${id}`);
    return response.data;
  },

  getEvents: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/neighborhoods/${id}/events`, { params });
    return response.data;
  },

  getListings: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/neighborhoods/${id}/listings`, { params });
    return response.data;
  },

  getPosts: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/neighborhoods/${id}/posts`, { params });
    return response.data;
  },

  getMembers: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/neighborhoods/${id}/members`, { params });
    return response.data;
  },

  join: async (id: string) => {
    const response = await api.post(`/neighborhoods/${id}/join`);
    return response.data;
  },

  leave: async (id: string) => {
    const response = await api.delete(`/neighborhoods/${id}/leave`);
    return response.data;
  }
};

// Marketplace API
export const marketplaceAPI = {
  getListings: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    neighborhood?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    search?: string;
    isFree?: boolean;
    sortBy?: string;
  }) => {
    const response = await api.get('/marketplace', { params });
    return response.data;
  },

  getListing: async (id: string) => {
    const response = await api.get(`/marketplace/${id}`);
    return response.data;
  },

  createListing: async (data: Partial<MarketplaceListing>) => {
    const response = await api.post('/marketplace', data);
    return response.data;
  },

  updateListing: async (id: string, data: Partial<MarketplaceListing>) => {
    const response = await api.put(`/marketplace/${id}`, data);
    return response.data;
  },

  deleteListing: async (id: string) => {
    const response = await api.delete(`/marketplace/${id}`);
    return response.data;
  },

  getMyListings: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/marketplace/my-listings', { params });
    return response.data;
  },

  markAsSold: async (id: string) => {
    const response = await api.post(`/marketplace/${id}/sold`);
    return response.data;
  },

  markAsReserved: async (id: string) => {
    const response = await api.post(`/marketplace/${id}/reserve`);
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await api.post(`/marketplace/${id}/favorite`);
    return response.data;
  },

  getFavorites: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/marketplace/favorites', { params });
    return response.data;
  },

  // Purchase Requests
  sendRequest: async (id: string, message?: string) => {
    const response = await api.post(`/marketplace/${id}/request`, { message });
    return response.data;
  },

  getRequests: async (id: string) => {
    const response = await api.get(`/marketplace/${id}/requests`);
    return response.data;
  },

  respondToRequest: async (listingId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const response = await api.put(`/marketplace/${listingId}/requests/${requestId}`, { status });
    return response.data;
  },

  getMyRequests: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/marketplace/my-requests', { params });
    return response.data;
  },

  // Reviews
  addReview: async (id: string, data: { rating: number; comment?: string; type: 'SELLER' | 'BUYER' }) => {
    const response = await api.post(`/marketplace/${id}/review`, data);
    return response.data;
  },

  getReviews: async (userId: string, params?: { type?: 'SELLER' | 'BUYER' }) => {
    const response = await api.get(`/users/${userId}/reviews`, { params });
    return response.data;
  },

  reportListing: async (id: string, data: { reason: string; description?: string }) => {
    const response = await api.post(`/marketplace/${id}/report`, data);
    return response.data;
  },

  contactSeller: async (id: string, data: { message: string }) => {
    const response = await api.post(`/marketplace/${id}/contact`, data);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/marketplace/categories');
    return response.data;
  },

  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    
    const response = await api.post('/marketplace/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Categories API (for forum threads)
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },

  create: async (data: Partial<Category>) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Category>) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};

// Threads API
export const threadsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: string;
    search?: string;
  }) => {
    const response = await api.get('/threads', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/threads/${id}`);
    return response.data;
  },

  create: async (data: Partial<Thread>) => {
    const response = await api.post('/threads', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Thread>) => {
    const response = await api.put(`/threads/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/threads/${id}`);
    return response.data;
  },

  pin: async (id: string) => {
    const response = await api.post(`/threads/${id}/pin`);
    return response.data;
  },

  unpin: async (id: string) => {
    const response = await api.delete(`/threads/${id}/pin`);
    return response.data;
  },

  lock: async (id: string) => {
    const response = await api.post(`/threads/${id}/lock`);
    return response.data;
  },

  unlock: async (id: string) => {
    const response = await api.delete(`/threads/${id}/lock`);
    return response.data;
  },

  vote: async (id: string, type: 'up' | 'down') => {
    const response = await api.post(`/threads/${id}/vote`, { type });
    return response.data;
  },

  removeVote: async (id: string) => {
    const response = await api.delete(`/threads/${id}/vote`);
    return response.data;
  }
};

// Posts API (for thread replies)
export const postsAPI = {
  getByThread: async (threadId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/threads/${threadId}/posts`, { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  create: async (data: { threadId: string; content: string; parentId?: string }) => {
    const response = await api.post('/posts', data);
    return response.data;
  },

  update: async (id: string, data: { content: string }) => {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  vote: async (id: string, type: 'up' | 'down') => {
    const response = await api.post(`/posts/${id}/vote`, { type });
    return response.data;
  },

  removeVote: async (id: string) => {
    const response = await api.delete(`/posts/${id}/vote`);
    return response.data;
  },

  markAsAnswer: async (id: string) => {
    const response = await api.post(`/posts/${id}/answer`);
    return response.data;
  },

  unmarkAsAnswer: async (id: string) => {
    const response = await api.delete(`/posts/${id}/answer`);
    return response.data;
  }
};

// Search API
export const searchAPI = {
  search: async (params: {
    q: string;
    type?: 'all' | 'events' | 'listings' | 'posts' | 'threads' | 'users';
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/search', { params });
    return response.data;
  },

  suggestions: async (q: string) => {
    const response = await api.get('/search/suggestions', { params: { q } });
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  getAll: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  updatePreferences: async (preferences: Record<string, boolean>) => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  }
};

// Messages API
export const messagesAPI = {
  getConversations: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/messages/conversations', { params });
    return response.data;
  },

  getConversation: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/messages/conversations/${id}`, { params });
    return response.data;
  },

  sendMessage: async (data: { recipientId: string; content: string; conversationId?: string }) => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  markAsRead: async (conversationId: string) => {
    const response = await api.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  deleteConversation: async (id: string) => {
    const response = await api.delete(`/messages/conversations/${id}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  create: async (data: {
    type: 'thread' | 'post' | 'user' | 'listing' | 'event' | 'community_post';
    targetId: string;
    reason: string;
    description?: string;
  }) => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getAll: async (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, resolution?: string) => {
    const response = await api.put(`/reports/${id}/status`, { status, resolution });
    return response.data;
  }
};

// Analytics API
export const analyticsAPI = {
  getStats: async () => {
    const response = await api.get('/analytics/stats');
    return response.data;
  },

  getUserActivity: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/analytics/user-activity', { params });
    return response.data;
  },

  getPopularContent: async (params?: { type?: string; limit?: number }) => {
    const response = await api.get('/analytics/popular-content', { params });
    return response.data;
  },

  getEventStats: async (eventId: string) => {
    const response = await api.get(`/analytics/events/${eventId}`);
    return response.data;
  }
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File, type: 'avatar' | 'event' | 'listing' | 'post') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadImages: async (files: File[], type: 'event' | 'listing' | 'post') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('type', type);
    
    const response = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Current user helper
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('authToken')) {
      const response = await usersAPI.getProfile();
      return response.data || response;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    return null;
  }
};

// Legacy exports for backward compatibility
export const fetchCategories = async () => {
  const response = await categoriesAPI.getAll();
  return response.data || response;
};

export const fetchCategory = async (slug: string) => {
  const response = await categoriesAPI.getBySlug(slug);
  return response.data || response;
};

export const fetchThreads = async (params?: any) => {
  const response = await threadsAPI.getAll(params);
  return response.data || response;
};

export const fetchThread = async (id: string) => {
  const response = await threadsAPI.getById(id);
  return response.data || response;
};

export const createThread = async (data: any) => {
  const response = await threadsAPI.create(data);
  return response.data || response;
};

export const fetchPosts = async (threadId: string, params?: any) => {
  const response = await postsAPI.getByThread(threadId, params);
  return response.data || response;
};

export const createPost = async (data: any) => {
  const response = await postsAPI.create(data);
  return response.data || response;
};

export const fetchUserProfile = async (userId?: string) => {
  const response = await usersAPI.getProfile(userId);
  return response.data || response;
};

export const updateUserProfile = async (data: any) => {
  const response = await usersAPI.updateProfile(data);
  return response.data || response;
};

export const searchContent = async (params: any) => {
  const response = await searchAPI.search(params);
  return response.data || response;
};

export const fetchListings = async (params?: any) => {
  const response = await marketplaceAPI.getListings(params);
  return response.data || response;
};

export const fetchListing = async (id: string) => {
  const response = await marketplaceAPI.getListing(id);
  return response.data || response;
};

export const createListing = async (data: any) => {
  const response = await marketplaceAPI.createListing(data);
  return response.data || response;
};

export const updateListing = async (id: string, data: any) => {
  const response = await marketplaceAPI.updateListing(id, data);
  return response.data || response;
};

export const deleteListing = async (id: string) => {
  const response = await marketplaceAPI.deleteListing(id);
  return response.data || response;
};

export const fetchMyListings = async (params?: any) => {
  const response = await marketplaceAPI.getMyListings(params);
  return response.data || response;
};

export const markListingAsSold = async (id: string) => {
  const response = await marketplaceAPI.markAsSold(id);
  return response.data || response;
};

export const favoriteListingToggle = async (id: string) => {
  const response = await marketplaceAPI.toggleFavorite(id);
  return response.data || response;
};

export const fetchFavoriteListings = async (params?: any) => {
  const response = await marketplaceAPI.getFavorites(params);
  return response.data || response;
};

export const reportListing = async (id: string, reason: string, description?: string) => {
  const response = await marketplaceAPI.reportListing(id, { reason, description });
  return response.data || response;
};

export const fetchMarketplaceCategories = async () => {
  const response = await marketplaceAPI.getCategories();
  return response.data || response;
};

export const contactSeller = async (listingId: string, message: string) => {
  const response = await marketplaceAPI.contactSeller(listingId, { message });
  return response.data || response;
};

// Events legacy exports
export const fetchEvents = async (params?: any) => {
  const response = await eventsAPI.getAll(params);
  return response.data || response;
};

export const fetchEvent = async (id: string) => {
  const response = await eventsAPI.getById(id);
  return response.data || response;
};

export const createEvent = async (data: any) => {
  const response = await eventsAPI.create(data);
  return response.data || response;
};

export const registerForEvent = async (id: string, data?: any) => {
  const response = await eventsAPI.register(id, data);
  return response.data || response;
};

export const unregisterFromEvent = async (id: string) => {
  const response = await eventsAPI.unregister(id);
  return response.data || response;
};

export const fetchEventCategories = async () => {
  const response = await eventsAPI.getCategories();
  return response.data || response;
};

// Community Posts legacy exports
export const fetchCommunityPosts = async (params?: any) => {
  const response = await communityPostsAPI.getAll(params);
  return response.data || response;
};

export const fetchCommunityPost = async (id: string) => {
  const response = await communityPostsAPI.getById(id);
  return response.data || response;
};

export const createCommunityPost = async (data: any) => {
  const response = await communityPostsAPI.create(data);
  return response.data || response;
};

// Neighborhoods legacy exports
export const fetchNeighborhoods = async (params?: any) => {
  const response = await neighborhoodsAPI.getAll(params);
  return response.data || response;
};

export const fetchNeighborhood = async (id: string) => {
  const response = await neighborhoodsAPI.getById(id);
  return response.data || response;
};

// Default export
export default {
  authAPI,
  usersAPI,
  eventsAPI,
  communityPostsAPI,
  neighborhoodsAPI,
  marketplaceAPI,
  categoriesAPI,
  threadsAPI,
  postsAPI,
  searchAPI,
  notificationsAPI,
  messagesAPI,
  reportsAPI,
  analyticsAPI,
  uploadAPI
};
