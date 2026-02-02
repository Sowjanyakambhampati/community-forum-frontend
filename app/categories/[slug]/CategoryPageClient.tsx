// app/categories/[slug]/CategoryPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchThreads } from '@/lib/api';
import { Category, Thread, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { ChevronLeft, MessageSquare, Plus, PinIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

interface CategoryPageClientProps {
  initialCategory: Category | null;
  initialThreads: Thread[];
  error?: string;
}

export default function CategoryPageClient({ initialCategory, initialThreads, error: initialError }: CategoryPageClientProps) {
  const router = useRouter();
  const [category] = useState<Category | null>(initialCategory);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [error, setError] = useState<string | null>(initialError || null);
  const [user, setUser] = useState<User | null>(null); // Fixed: Proper typing

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

  const handleCreateThread = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (category) {
      router.push(`/threads/create?categoryId=${category.id}`);
    }
  };

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive text-center p-6">
          {error || 'Category not found'}
        </div>
        <div className="text-center mt-4">
          <Button variant="outline" asChild>
            <Link href="/categories">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/categories">
            <ChevronLeft className="mr-2 h-4 w-4" />
            All Categories
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        <p className="text-muted-foreground mb-6">{category.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Badge variant="secondary">
              {category.threadCount} {category.threadCount === 1 ? 'thread' : 'threads'}
            </Badge>
            <Badge variant="outline">
              {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
            </Badge>
          </div>
          <Button onClick={handleCreateThread}>
            <Plus className="mr-2 h-4 w-4" />
            Create Thread
          </Button>
        </div>
      </div>
      
      {threads.length === 0 ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">No threads yet</CardTitle>
          <CardDescription className="mb-6">
            Be the first to start a discussion in this category.
          </CardDescription>
          <Button onClick={handleCreateThread}>
            <Plus className="mr-2 h-4 w-4" />
            Create Thread
          </Button>
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