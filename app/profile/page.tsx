'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { fetchUserProfile } from '@/lib/api';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { User as UserIcon, PenSquare, Settings, MessageSquare, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        // Get user profile details
        const profileData = await fetchUserProfile(currentUser.id);
        setProfile(profileData);
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-10 w-full mb-6" />
          
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-destructive text-center p-6">
          {error || 'User not found'}
        </div>
        <div className="text-center mt-4">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl || ''} alt={user.email || ''} />
              <AvatarFallback className="text-xl">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile?.username || user.email}</h1>
              <p className="text-muted-foreground">
                Member since {safeFormatDistanceToNow(user.createdAt, { addSuffix: true }, 'recently')}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit">
                <PenSquare className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <p className="text-2xl font-bold">{profile?.threadCount || 0}</p>
                <p className="text-muted-foreground">Threads</p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-bold">{profile?.postCount || 0}</p>
                <p className="text-muted-foreground">Posts</p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-bold">{profile?.daysActive || 0}</p>
                <p className="text-muted-foreground">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="threads">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="threads" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Threads
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center">
            <PenSquare className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="threads">
          {profile?.threads?.length > 0 ? (
            <div className="space-y-4">
              {profile.threads.map((thread: any) => (
                <Link key={thread.id} href={`/threads/${thread.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                      <CardDescription>
                        Posted {safeFormatDistanceToNow(thread.createdAt, { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2">{thread.content.replace(/<[^>]*>/g, '')}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No threads created yet.</p>
                <Button className="mt-4" asChild>
                  <Link href="/threads/create">Create a Thread</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="posts">
          {profile?.posts?.length > 0 ? (
            <div className="space-y-4">
              {profile.posts.map((post: any) => (
                <Link key={post.id} href={`/threads/${post.threadId}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        In reply to: {post.threadTitle}
                      </CardTitle>
                      <CardDescription>
                        Posted {safeFormatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2">{post.content.replace(/<[^>]*>/g, '')}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <PenSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts created yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Activity log coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}