'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeFormatDate, safeFormatDistanceToNow } from '@/lib/date-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser } from '@/lib/auth';
import { neighborhoodsAPI } from '@/lib/api';
import { 
  ArrowLeft, MapPin, Users, Calendar, ShoppingBag, MessageSquare,
  Building2, Clock, DollarSign, ChevronRight, Plus
} from 'lucide-react';
import { User, Neighborhood, Event, MarketplaceListing, CommunityPost } from '@/types';

export default function NeighborhoodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const neighborhoodId = params.id as string;

  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const neighborhoodData = await neighborhoodsAPI.getById(neighborhoodId);
        const processedNeighborhood = neighborhoodData.data || neighborhoodData;
        setNeighborhood(processedNeighborhood);

        // Check if user is member
        if (currentUser?.neighborhoodId === neighborhoodId) {
          setIsMember(true);
        }

        // Load related data
        const [eventsData, listingsData, postsData, membersData] = await Promise.all([
          neighborhoodsAPI.getEvents(neighborhoodId, { limit: 6 }).catch(() => ({ data: [] })),
          neighborhoodsAPI.getListings(neighborhoodId, { limit: 6 }).catch(() => ({ data: [] })),
          neighborhoodsAPI.getPosts(neighborhoodId, { limit: 6 }).catch(() => ({ data: [] })),
          neighborhoodsAPI.getMembers(neighborhoodId, { limit: 12 }).catch(() => ({ data: [] }))
        ]);

        setEvents(Array.isArray(eventsData) ? eventsData : (eventsData?.events || eventsData?.data || []));
        setListings(Array.isArray(listingsData) ? listingsData : (listingsData?.listings || listingsData?.data || []));
        setPosts(Array.isArray(postsData) ? postsData : (postsData?.posts || postsData?.data || []));
        setMembers(Array.isArray(membersData) ? membersData : (membersData?.members || membersData?.data || []));

        setError(null);
      } catch (err) {
        console.error('Error loading neighborhood:', err);
        setError('Failed to load neighborhood. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [neighborhoodId]);

  const handleJoinLeave = async () => {
    if (!user) {
      router.push('/login?redirect=/neighborhoods/' + neighborhoodId);
      return;
    }

    try {
      setJoining(true);
      if (isMember) {
        await neighborhoodsAPI.leave(neighborhoodId);
        setIsMember(false);
      } else {
        await neighborhoodsAPI.join(neighborhoodId);
        setIsMember(true);
      }
    } catch (err) {
      console.error('Error joining/leaving:', err);
      alert('Failed to update membership. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-lg mb-6" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !neighborhood) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">Neighborhood not found</CardTitle>
          <CardDescription className="mb-6">
            {error || 'The neighborhood you are looking for does not exist.'}
          </CardDescription>
          <Button asChild>
            <Link href="/neighborhoods">Browse Neighborhoods</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Neighborhoods
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{neighborhood.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {neighborhood.city}
              {neighborhood.postalCode && ` · ${neighborhood.postalCode}`}
            </p>
          </div>
          <Button 
            variant={isMember ? "outline" : "default"}
            onClick={handleJoinLeave}
            disabled={joining}
          >
            {joining ? 'Processing...' : (isMember ? 'Leave Community' : 'Join Community')}
          </Button>
        </div>

        {neighborhood.description && (
          <p className="mt-4 text-muted-foreground max-w-3xl">
            {neighborhood.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{neighborhood.memberCount || members.length}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{neighborhood.eventCount || events.length}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{neighborhood.listingCount || listings.length}</p>
                <p className="text-sm text-muted-foreground">Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{neighborhood.postCount || posts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="posts">Community Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Button variant="outline" asChild>
              <Link href={`/events?neighborhood=${neighborhoodId}`}>
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {events.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No upcoming events in this neighborhood</p>
              {isMember && (
                <Button asChild>
                  <Link href="/events/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    {event.images?.[0] && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={event.images[0]} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">{event.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {safeFormatDate(event.startDate, 'PPP')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                        {event.isFree ? (
                          <Badge variant="secondary">Free</Badge>
                        ) : (
                          <Badge>€{event.price}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Marketplace Listings</h2>
            <Button variant="outline" asChild>
              <Link href={`/marketplace?neighborhood=${neighborhoodId}`}>
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {listings.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No listings in this neighborhood</p>
              {isMember && (
                <Button asChild>
                  <Link href="/marketplace/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Listing
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    {listing.images?.[0] && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {listing.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          {listing.isFree ? 'Free' : `€${listing.price}`}
                        </span>
                        <Badge variant="outline">{listing.condition}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Community Posts</h2>
            <Button variant="outline" asChild>
              <Link href={`/community?neighborhood=${neighborhoodId}`}>
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {posts.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No posts in this neighborhood</p>
              {isMember && (
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
              {posts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author?.avatarUrl} />
                          <AvatarFallback>
                            {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{post.author?.username || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            {safeFormatDistanceToNow(post.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        <Badge className="ml-auto">{post.category}</Badge>
                      </div>
                      <CardTitle className="text-base mt-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{post.likeCount || 0} likes</span>
                        <span>{post.commentCount || 0} comments</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Community Members</h2>
          </div>
          
          {members.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No members yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="text-center">
                  <CardContent className="pt-6">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback className="text-lg">
                        {member.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{member.username || member.fullName || 'Anonymous'}</p>
                    {member.isVerified && (
                      <Badge variant="secondary" className="mt-2">Verified</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
