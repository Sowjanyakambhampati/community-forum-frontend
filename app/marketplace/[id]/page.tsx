'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { getCurrentUser } from '@/lib/auth';
import { fetchListing, contactSeller, favoriteListingToggle, reportListing } from '@/lib/api';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { ChevronLeft, Tag, DollarSign, MapPin, AlertCircle, Heart, Flag, MessageCircle, Star } from 'lucide-react';
import { User, MarketplaceListing } from '@/types';

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    const loadListing = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const data = await fetchListing(params.id as string);
        setListing(data);
        setIsFavorited(data.isFavorited || false);
        setError(null);
      } catch (err) {
        console.error('Error loading listing:', err);
        setError('Failed to load listing. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    loadListing();
  }, [params.id]);

  const handleContactSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!contactMessage.trim() || !listing) return;
    
    try {
      setSubmitting(true);
      await contactSeller(listing.id, contactMessage);
      setContactMessage('');
      setShowContactForm(false);
      // Show success message
      alert('Message sent to seller successfully!');
    } catch (err) {
      console.error('Error contacting seller:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!listing) return;
    
    try {
      await favoriteListingToggle(listing.id);
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleReport = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!listing) return;
    
    const reason = prompt('Please provide a reason for reporting this listing:');
    if (!reason) return;
    
    try {
      await reportListing(listing.id, reason);
      alert('Listing reported successfully. Thank you for helping keep our marketplace safe.');
    } catch (err) {
      console.error('Error reporting listing:', err);
      alert('Failed to report listing. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            <div className="flex items-center space-x-4 mb-6">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive text-center p-6">
          {error || 'Listing not found'}
        </div>
        <div className="text-center mt-4">
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/marketplace">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {listing.images && listing.images.length > 0 && (
            <>
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="object-cover w-full h-full"
                />
                {listing.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive" className="text-2xl">SOLD</Badge>
                  </div>
                )}
              </div>
              {listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1).map((image, index) => (
                    <div key={index} className="aspect-video relative rounded overflow-hidden">
                      <img
                        src={image}
                        alt={`${listing.title} - Image ${index + 2}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavoriteToggle}
                className={isFavorited ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReport}>
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Badge variant="default" className="text-lg font-bold">
              <DollarSign className="mr-1 h-4 w-4" />
              ${listing.price}
            </Badge>
            <Badge variant="secondary">
              <Tag className="mr-1 h-3 w-3" />
              {typeof listing.category === 'object' ? listing.category.name : listing.category}
            </Badge>
            {listing.condition && (
              <Badge variant="outline">
                {listing.condition}
              </Badge>
            )}
            {listing.location && (
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {listing.location}
              </Badge>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none mb-8">
            <p>{listing.description}</p>
          </div>

          {listing.tags && listing.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {typeof tag === 'string' ? tag : (tag as any)?.name || 'Tag'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Seller Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={listing.seller?.avatarUrl} alt={listing.seller?.username} />
                  <AvatarFallback>
                    {listing.seller?.username?.charAt(0) || listing.seller?.email?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{listing.seller?.username || listing.seller?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {safeFormatDistanceToNow(listing.seller?.createdAt, { addSuffix: true }, 'recently')}
                  </p>
                  {listing.seller?.rating && (
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{listing.seller.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {listing.status === 'sold' ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This item has been sold and is no longer available.
              </AlertDescription>
            </Alert>
          ) : listing.seller?.id === user?.id ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is your listing. You can edit or delete it from your profile.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {!showContactForm ? (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    setShowContactForm(true);
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Seller</CardTitle>
                    <CardDescription>
                      Send a message to the seller about this listing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSeller} className="space-y-4">
                      <Textarea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Hi, I'm interested in your listing..."
                        className="min-h-24"
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting || !contactMessage.trim()}>
                          {submitting ? 'Sending...' : 'Send Message'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowContactForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}