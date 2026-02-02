'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrentUser } from '@/lib/auth';
import { communityPostsAPI, neighborhoodsAPI } from '@/lib/api';
import { safeFormatDistanceToNow, safeGetTime } from '@/lib/date-utils';
import { 
  Plus, Search, Filter, MessageSquare, Eye, Heart, ThumbsUp,
  HelpCircle, AlertTriangle, Megaphone, Wrench, Pin
} from 'lucide-react';
import { User, CommunityPost, Neighborhood } from '@/types';

const POST_CATEGORY_CONFIG = {
  SERVICE: {
    icon: Wrench,
    label: 'Service',
    color: 'bg-blue-500',
    description: 'Offering or seeking services',
  },
  ISSUE: {
    icon: AlertTriangle,
    label: 'Issue',
    color: 'bg-red-500',
    description: 'Reporting community issues',
  },
  QUESTION: {
    icon: HelpCircle,
    label: 'Question',
    color: 'bg-amber-500',
    description: 'Asking the community',
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    label: 'Announcement',
    color: 'bg-green-500',
    description: 'Community announcements',
  },
};

export default function CommunityPostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(searchParams.get('neighborhood') || 'all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const [postsData, neighborhoodsData] = await Promise.all([
          communityPostsAPI.getAll().catch(() => ({ data: [] })),
          neighborhoodsAPI.getAll().catch(() => ({ data: [] }))
        ]);

        const processedPosts = Array.isArray(postsData) ? postsData : (postsData?.posts || postsData?.data || []);
        const processedNeighborhoods = Array.isArray(neighborhoodsData) ? neighborhoodsData : (neighborhoodsData?.neighborhoods || neighborhoodsData?.data || []);

        setPosts(processedPosts);
        setFilteredPosts(processedPosts);
        setNeighborhoods(processedNeighborhoods);
        setError(null);
      } catch (err) {
        console.error('Error loading posts:', err);
        setPosts([]);
        setFilteredPosts([]);
        setError('Failed to load community posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedNeighborhood, sortBy, posts]);

  const applyFilters = () => {
    let filtered = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        (post.title?.toLowerCase() || '').includes(query) ||
        (post.content?.toLowerCase() || '').includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Neighborhood filter
    if (selectedNeighborhood !== 'all') {
      filtered = filtered.filter(post => post.neighborhoodId === selectedNeighborhood);
    }

    // Sort
    filtered.sort((a, b) => {
      // Always show pinned posts first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortBy) {
        case 'newest':
          return safeGetTime(b.createdAt) - safeGetTime(a.createdAt);
        case 'oldest':
          return safeGetTime(a.createdAt) - safeGetTime(b.createdAt);
        case 'most_liked':
          return (b.likeCount || 0) - (a.likeCount || 0);
        case 'most_comments':
          return (b.commentCount || 0) - (a.commentCount || 0);
        default:
          return 0;
      }
    });

    setFilteredPosts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedNeighborhood('all');
    setSortBy('newest');
  };

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/login?redirect=/community');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (post?.isLiked) {
        await communityPostsAPI.unlike(postId);
      } else {
        await communityPostsAPI.like(postId);
      }
      
      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likeCount: p.isLiked ? (p.likeCount || 1) - 1 : (p.likeCount || 0) + 1
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    const config = POST_CATEGORY_CONFIG[category as keyof typeof POST_CATEGORY_CONFIG];
    if (!config) return MessageSquare;
    return config.icon;
  };

  const getCategoryConfig = (category: string) => {
    return POST_CATEGORY_CONFIG[category as keyof typeof POST_CATEGORY_CONFIG] || {
      icon: MessageSquare,
      label: category || 'General',
      color: 'bg-gray-500',
      description: '',
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community Posts</h1>
          <p className="text-muted-foreground">
            Share questions, report issues, and connect with your neighbors
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/community/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
        )}
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(POST_CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = posts.filter(p => p.category === key).length;
          
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === key ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{count} posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Neighborhoods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighborhoods</SelectItem>
                {neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="most_liked">Most Liked</SelectItem>
                <SelectItem value="most_comments">Most Comments</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredPosts.length} posts
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${getCategoryConfig(selectedCategory).label}`}
        </p>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No posts found</CardTitle>
          <CardDescription className="mb-6">
            {searchQuery || selectedCategory !== 'all' || selectedNeighborhood !== 'all'
              ? 'Try adjusting your filters.'
              : 'Be the first to start a discussion in your community!'}
          </CardDescription>
          {user && (
            <Button asChild>
              <Link href="/community/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const categoryConfig = getCategoryConfig(post.category);
            const CategoryIcon = categoryConfig.icon;
            
            return (
              <Link key={post.id} href={`/community/${post.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author?.avatarUrl} />
                          <AvatarFallback>
                            {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{post.author?.username || 'Anonymous'}</p>
                          <p className="text-sm text-muted-foreground">
                            {safeFormatDistanceToNow(post.createdAt, { addSuffix: true })}
                            {post.neighborhood && ` · ${post.neighborhood.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.isPinned && (
                          <Badge variant="outline" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        <Badge className={`${categoryConfig.color} text-white`}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {categoryConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3 hover:text-primary transition-colors">
                      {post.title || 'Untitled Post'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {post.content || 'No content'}
                    </p>

                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {post.images.slice(0, 3).map((image, index) => (
                          <div key={index} className="h-20 w-20 rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {post.images.length > 3 && (
                          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">
                              +{post.images.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 5).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center gap-1 hover:text-primary transition-colors ${
                          post.isLiked ? 'text-primary' : ''
                        }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likeCount || 0}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentCount || 0} comments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewCount || 0} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
