'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchThreads } from '@/lib/api';
import { Thread, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { MessageSquare, Plus, PinIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    const loadThreads = async () => {
      try {
        setLoading(true);
        const data = await fetchThreads();
        setThreads(data);
        setError(null);
      } catch (err) {
        console.error('Error loading threads:', err);
        setError('Failed to load threads. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    loadThreads();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive text-center p-6">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Discussions</h1>
            <p className="text-muted-foreground">
              Browse all threads across all categories
            </p>
          </div>
          {user && (
            <Button asChild>
              <Link href="/threads/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Thread
              </Link>
            </Button>
          )}
        </div>
      </div>

      {threads.length === 0 ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">No threads yet</CardTitle>
          <CardDescription className="mb-6">
            Be the first to start a discussion.
          </CardDescription>
          {user ? (
            <Button asChild>
              <Link href="/threads/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Thread
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/login">Sign in to create a thread</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Link key={thread.id} href={`/threads/${thread.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.author.avatarUrl || ''} alt={thread.author.username || ''} />
                      <AvatarFallback>
                        {thread.author.username?.charAt(0) || thread.author.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{thread.author.username || thread.author.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {safeFormatDistanceToNow(thread.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-1 flex items-center gap-2">
                    {thread.isPinned && <PinIcon className="h-4 w-4 text-primary" />}
                    {thread.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {thread.content.replace(/<[^>]*>/g, '')}
                  </CardDescription>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      {thread.postCount} {thread.postCount === 1 ? 'reply' : 'replies'}
                    </Badge>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {thread.viewCount} views
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}