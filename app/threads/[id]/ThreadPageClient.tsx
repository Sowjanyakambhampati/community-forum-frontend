// app/threads/[id]/ThreadPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPosts, createPost } from '@/lib/api';
import { Thread, Post, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentUser } from '@/lib/auth';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { ChevronLeft, MessageSquare, AlertCircle, PinIcon, LockIcon } from 'lucide-react';

interface ThreadPageClientProps {
  initialThread: Thread | null;
  initialPosts: Post[];
  threadId: string;
  error?: string;
}

export default function ThreadPageClient({ 
  initialThread, 
  initialPosts, 
  threadId, 
  error: initialError 
}: ThreadPageClientProps) {
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(initialThread);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    loadUser();
  }, []);

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!newPost.trim() || !thread) return;
    
    try {
      setSubmitting(true);
      
      const postData = {
        content: newPost,
        threadId: thread.id,
      };
      
      await createPost(postData);
      
      // Refresh posts
      const postsData = await fetchPosts(thread.id);
      setPosts(postsData);
      
      // Clear form
      setNewPost('');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive text-center p-6">
          {error}
        </div>
        <div className="text-center mt-4">
          <Button variant="outline" asChild>
            <Link href="/threads">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Threads
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <div className="flex space-x-2 mb-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/categories/${thread.categoryId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Category
        </Link>
      </Button>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={thread.author.avatarUrl || ''} alt={thread.author.username || ''} />
              <AvatarFallback>
                {thread.author.username?.charAt(0) || thread.author.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{thread.author.username || thread.author.email}</p>
              <p className="text-sm text-muted-foreground">
                {safeFormatDistanceToNow(thread.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          <CardTitle className="text-2xl mb-2 flex items-center gap-2">
            {thread.isPinned && <PinIcon className="h-5 w-5 text-primary" />}
            {thread.isLocked && <LockIcon className="h-5 w-5 text-muted-foreground" />}
            {thread.title}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">
              <MessageSquare className="h-3 w-3 mr-1" />
              {thread.postCount} {thread.postCount === 1 ? 'reply' : 'replies'}
            </Badge>
            <Badge variant="outline">
              {thread.viewCount} views
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: thread.content }} />
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Replies</h2>
        <Separator className="mb-6" />
        
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No replies yet. Be the first to reply!
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="mb-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.avatarUrl || ''} alt={post.author.username || ''} />
                    <AvatarFallback>
                      {post.author.username?.charAt(0) || post.author.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-medium">{post.author.username || post.author.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {safeFormatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {thread.isLocked ? (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This thread is locked. New replies cannot be added.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Post a Reply</CardTitle>
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="text-center py-4">
                <p className="mb-4 text-muted-foreground">You need to sign in to reply to this thread.</p>
                <Button asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPost}>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Write your reply..."
                  className="mb-4 min-h-32"
                  disabled={submitting}
                />
                <Button type="submit" disabled={submitting || !newPost.trim()}>
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}