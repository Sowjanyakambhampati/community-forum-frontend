'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Thread } from '@/types';
import { threadsAPI } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, PinIcon } from 'lucide-react';

export default function RecentThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        setLoading(true);
        const response = await threadsAPI.getAll({ limit: 5, sortBy: 'latest' });
        
        // Handle the API response structure - the mock API returns { data: Thread[] }
        let threadsArray: Thread[] = [];
        
        if (Array.isArray(response)) {
          // Direct array response
          threadsArray = response;
        } else if (response && Array.isArray(response.data)) {
          // Response with data property containing array
          threadsArray = response.data;
        } else {
          console.warn('Unexpected threads data format:', response);
          threadsArray = [];
        }
        
        // Limit to 5 recent threads
        setThreads(threadsArray.slice(0, 5));
        setError(null);
      } catch (err) {
        console.error('Error loading threads:', err);
        setError('Failed to load recent threads. Please try again later.');
        setThreads([]); // Ensure threads is always an array
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2 mb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Ensure threads is an array
  const threadsArray = Array.isArray(threads) ? threads : [];

  if (threadsArray.length === 0) {
    return (
      <div className="text-center p-6">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No recent discussions available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threadsArray.map((thread) => (
        <Link key={thread.id} href={`/threads/${thread.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={thread.author?.avatarUrl || ''} alt={thread.author?.username || ''} />
                  <AvatarFallback>
                    {thread.author?.username?.charAt(0) || thread.author?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{thread.author?.username || thread.author?.email || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    {thread.createdAt ? formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true }) : 'Recently'}
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
                {thread.content ? thread.content.replace(/<[^>]*>/g, '') : 'No content available'}
              </CardDescription>
              <div className="flex justify-between items-center">
                <Badge variant="outline">
                  {thread.postCount || 0} {(thread.postCount || 0) === 1 ? 'reply' : 'replies'}
                </Badge>
                <div className="flex items-center text-muted-foreground text-sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {thread.viewCount || 0} views
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}