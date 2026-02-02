'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentUser } from '@/lib/auth';
import { communityPostsAPI } from '@/lib/api';
import { 
  ArrowLeft, MessageSquare, Eye, ThumbsUp, Share2, Edit, Trash2,
  MoreVertical, Flag, Pin, Send, Reply, HelpCircle, AlertTriangle, 
  Megaphone, Wrench
} from 'lucide-react';
import { User, CommunityPost, CommunityComment } from '@/types';

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

export default function CommunityPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Comment states
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const postData = await communityPostsAPI.getById(postId);
        const processedPost = postData.data || postData;
        setPost(processedPost);

        // Load comments
        try {
          const commentsData = await communityPostsAPI.getComments(postId);
          const processedComments = Array.isArray(commentsData) ? commentsData : (commentsData?.comments || commentsData?.data || []);
          setComments(processedComments);
        } catch (err) {
          console.error('Error loading comments:', err);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [postId]);

  const handleLike = async () => {
    if (!user) {
      router.push('/login?redirect=/community/' + postId);
      return;
    }

    if (!post) return;

    try {
      if (post.isLiked) {
        await communityPostsAPI.unlike(postId);
      } else {
        await communityPostsAPI.like(postId);
      }
      
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likeCount: post.isLiked ? (post.likeCount || 1) - 1 : (post.likeCount || 0) + 1
      });
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmittingComment(true);
      const response = await communityPostsAPI.addComment(postId, newComment);
      const newCommentData = response.data || response;
      setComments([...comments, { ...newCommentData, user }]);
      setNewComment('');
      
      // Update post comment count
      if (post) {
        setPost({
          ...post,
          commentCount: (post.commentCount || 0) + 1
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;

    try {
      const response = await communityPostsAPI.addComment(postId, replyContent, parentId);
      const newReply = response.data || response;
      
      // Update comments with the new reply
      setComments(comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), { ...newReply, user }]
          };
        }
        return comment;
      }));
      
      setReplyingTo(null);
      setReplyContent('');
      
      if (post) {
        setPost({
          ...post,
          commentCount: (post.commentCount || 0) + 1
        });
      }
    } catch (err) {
      console.error('Error adding reply:', err);
      alert('Failed to add reply. Please try again.');
    }
  };

  const handleDeletePost = async () => {
    try {
      await communityPostsAPI.delete(postId);
      router.push('/community');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content.substring(0, 100),
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const getCategoryConfig = (category: string) => {
    return POST_CATEGORY_CONFIG[category as keyof typeof POST_CATEGORY_CONFIG] || {
      icon: MessageSquare,
      label: category,
      color: 'bg-gray-500',
      description: '',
    };
  };

  const isAuthor = user && post && user.id === post.authorId;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">Post not found</CardTitle>
          <CardDescription className="mb-6">
            {error || 'The post you are looking for does not exist or has been removed.'}
          </CardDescription>
          <Button asChild>
            <Link href="/community">Browse Posts</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const categoryConfig = getCategoryConfig(post.category);
  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </Button>

        {/* Main Post */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
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
                
                {(isAuthor || isAdmin) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isAuthor && (
                        <DropdownMenuItem asChild>
                          <Link href={`/community/${post.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Post
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && !post.isPinned && (
                        <DropdownMenuItem onClick={() => communityPostsAPI.pin(postId)}>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin Post
                        </DropdownMenuItem>
                      )}
                      {isAdmin && post.isPinned && (
                        <DropdownMenuItem onClick={() => communityPostsAPI.unpin(postId)}>
                          <Pin className="h-4 w-4 mr-2" />
                          Unpin Post
                        </DropdownMenuItem>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the post and all its comments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <CardTitle className="text-2xl mt-4">{post.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {post.images.map((image, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={post.isLiked ? 'text-primary' : ''}
                >
                  <ThumbsUp className={`h-4 w-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                  {post.likeCount || 0} Likes
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentCount || comments.length} Comments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount || 0} Views</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {user && !isAuthor && (
                  <Button variant="ghost" size="sm">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment */}
            {user ? (
              <div className="flex gap-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || submittingComment}
                    size="sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 mb-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Link href={`/login?redirect=/community/${postId}`} className="text-primary hover:underline">
                    Sign in
                  </Link>
                  {' '}to join the discussion
                </p>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id}>
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.user?.avatarUrl} />
                        <AvatarFallback>
                          {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user?.username || 'Anonymous'}</span>
                          <span className="text-xs text-muted-foreground">
                            {safeFormatDistanceToNow(comment.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.likeCount || 0}
                          </button>
                          {user && (
                            <button 
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              <Reply className="h-3 w-3" />
                              Reply
                            </button>
                          )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 flex gap-2">
                            <Textarea
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" onClick={() => handleReply(comment.id)}>
                                Reply
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={reply.user?.avatarUrl} />
                                  <AvatarFallback>
                                    {reply.user?.username?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{reply.user?.username || 'Anonymous'}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {safeFormatDistanceToNow(reply.createdAt, { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
