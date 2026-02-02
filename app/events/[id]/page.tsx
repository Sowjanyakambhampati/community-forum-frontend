'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { getCurrentUser } from '@/lib/auth';
import { eventsAPI } from '@/lib/api';
import { safeFormatDate, safeFormatDistanceToNow, safeIsBefore } from '@/lib/date-utils';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, 
  Share2, Heart, Edit, Trash2, CheckCircle, XCircle, 
  MessageSquare, Send, User as UserIcon, Ticket
} from 'lucide-react';
import { User, Event, EventRegistration, EventComment } from '@/types';
import { cn } from '@/lib/utils';

const EVENT_CATEGORY_ICONS: Record<string, string> = {
  sports: '🏃',
  cultural: '🎭',
  educational: '📚',
  volunteer: '🤝',
  social: '☕',
  health: '❤️',
  environment: '🌱',
  technology: '💻',
  market: '🛒',
  workshop: '🔧',
  meeting: '👥',
  celebration: '🎉',
  cleanup: '🧹',
  other: '📌',
};

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  sports: 'bg-red-500',
  cultural: 'bg-purple-500',
  educational: 'bg-orange-500',
  volunteer: 'bg-green-500',
  social: 'bg-blue-500',
  health: 'bg-teal-500',
  environment: 'bg-emerald-500',
  technology: 'bg-violet-500',
  market: 'bg-sky-500',
  workshop: 'bg-amber-500',
  meeting: 'bg-gray-500',
  celebration: 'bg-orange-600',
  cleanup: 'bg-cyan-500',
  other: 'bg-slate-500',
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Registration states
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  
  // Comment states
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Helper to get event date (handles both startDate and date fields)
  const getEventDate = (evt: Event | null): string | undefined => {
    if (!evt) return undefined;
    return evt.startDate || (evt as any).date;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const eventData = await eventsAPI.getById(eventId);
        const processedEvent = eventData?.data || eventData;
        setEvent(processedEvent);

        // Check user's registration status
        if (currentUser && processedEvent?.userRegistration) {
          setIsRegistered(true);
          setRegistrationStatus(processedEvent.userRegistration.status);
        }

        // Load attendees
        try {
          const attendeesData = await eventsAPI.getAttendees(eventId);
          const processedAttendees = Array.isArray(attendeesData) ? attendeesData : (attendeesData?.attendees || attendeesData?.data || []);
          setAttendees(processedAttendees);
        } catch (err) {
          console.error('Error loading attendees:', err);
        }

        // Load comments
        try {
          const commentsData = await eventsAPI.getComments(eventId);
          const processedComments = Array.isArray(commentsData) ? commentsData : (commentsData?.comments || commentsData?.data || []);
          setComments(processedComments);
        } catch (err) {
          console.error('Error loading comments:', err);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login?redirect=/events/' + eventId);
      return;
    }

    try {
      setRegistering(true);
      await eventsAPI.register(eventId, {
        notes: registrationNotes || undefined,
        emergencyContact: emergencyContact || undefined,
      });
      setIsRegistered(true);
      setRegistrationStatus('REGISTERED');
      setShowRegistrationDialog(false);
      
      // Reload event data to get updated counts
      const eventData = await eventsAPI.getById(eventId);
      setEvent(eventData?.data || eventData);
    } catch (err: any) {
      console.error('Error registering:', err);
      const errorMessage = err.response?.data?.message || 'Failed to register. Please try again.';
      if (errorMessage.includes('waitlist')) {
        setRegistrationStatus('WAITLIST');
        setIsRegistered(true);
      }
      alert(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    try {
      setRegistering(true);
      await eventsAPI.unregister(eventId);
      setIsRegistered(false);
      setRegistrationStatus(null);
      
      // Reload event data
      const eventData = await eventsAPI.getById(eventId);
      setEvent(eventData?.data || eventData);
    } catch (err) {
      console.error('Error unregistering:', err);
      alert('Failed to cancel registration. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmittingComment(true);
      const response = await eventsAPI.addComment(eventId, newComment);
      const newCommentData = response?.data || response;
      setComments([...comments, { ...newCommentData, user }]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.shortDescription || event?.description,
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

  const getCategorySlug = (): string => {
    if (!event) return 'other';
    if (typeof event.category === 'object' && event.category) {
      return event.category.slug || event.category.name?.toLowerCase() || 'other';
    }
    return (event.category || 'other').toLowerCase();
  };

  const getCategoryName = (): string => {
    if (!event) return 'Other';
    if (typeof event.category === 'object' && event.category) {
      return event.category.name || 'Other';
    }
    return event.category || 'Other';
  };

  const isEventPast = event ? safeIsBefore(getEventDate(event), new Date()) : false;
  const isEventFull = event?.capacity && event.currentAttendees && event.currentAttendees >= event.capacity;
  const isOrganizer = user && event && user.id === event.createdById;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg mb-6" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">Event not found</CardTitle>
          <CardDescription className="mb-6">
            {error || 'The event you are looking for does not exist or has been removed.'}
          </CardDescription>
          <Button asChild>
            <Link href="/events">Browse Events</Link>
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
        Back to Events
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Event Image */}
          {event.images?.[0] ? (
            <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
              <img
                src={event.images[0]}
                alt={event.title || 'Event'}
                className="object-cover w-full h-full"
              />
              <div className="absolute top-4 left-4">
                <Badge className={cn(
                  "text-white text-sm",
                  EVENT_CATEGORY_COLORS[getCategorySlug()] || 'bg-slate-500'
                )}>
                  {EVENT_CATEGORY_ICONS[getCategorySlug()] || '📌'} {getCategoryName()}
                </Badge>
              </div>
              {event.status === 'CANCELLED' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-2xl py-2 px-4">CANCELLED</Badge>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "aspect-video flex items-center justify-center text-8xl rounded-lg mb-6",
              "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
            )}>
              <span>{EVENT_CATEGORY_ICONS[getCategorySlug()] || '📌'}</span>
            </div>
          )}

          {/* Event Title and Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{event.title || 'Untitled Event'}</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                {isOrganizer && (
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/events/${event.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            {event.shortDescription && (
              <p className="text-xl text-muted-foreground mt-2">{event.shortDescription}</p>
            )}
          </div>

          {/* Event Details */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{safeFormatDate(getEventDate(event), 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {safeFormatDate(getEventDate(event), 'h:mm a')}
                      {event.endDate && ` - ${safeFormatDate(event.endDate, 'h:mm a')}`}
                    </p>
                    <p className="text-sm text-muted-foreground">Time</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{event.location || 'Location TBD'}</p>
                    <p className="text-sm text-muted-foreground">Location</p>
                  </div>
                </div>

                {event.capacity && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {event.currentAttendees || 0} / {event.capacity}
                        {event.waitlistCount && event.waitlistCount > 0 && (
                          <span className="text-muted-foreground ml-2">
                            (+{event.waitlistCount} waitlist)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Attendees</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.isFree || event.price === 0 ? 'Free' : `€${event.price?.toFixed(2)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">Price</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About this Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{event.description || 'No description available.'}</p>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizer */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={event.createdBy?.avatarUrl} />
                  <AvatarFallback>
                    {event.createdBy?.username?.charAt(0).toUpperCase() || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.createdBy?.username || event.createdBy?.fullName || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">Event Organizer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendees */}
          {attendees.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Attendees ({attendees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {attendees.slice(0, 10).map((registration) => (
                    <Avatar key={registration.id} className="h-10 w-10">
                      <AvatarImage src={registration.user?.avatarUrl} />
                      <AvatarFallback>
                        {registration.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {attendees.length > 10 && (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      +{attendees.length - 10}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user && (
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
              )}

              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.status === 'CANCELLED' ? (
                  <div className="text-center py-4">
                    <Badge variant="destructive" className="mb-2">Event Cancelled</Badge>
                    <p className="text-sm text-muted-foreground">
                      This event has been cancelled by the organizer.
                    </p>
                  </div>
                ) : isEventPast ? (
                  <div className="text-center py-4">
                    <Badge variant="secondary" className="mb-2">Event Ended</Badge>
                    <p className="text-sm text-muted-foreground">
                      This event has already taken place.
                    </p>
                  </div>
                ) : isRegistered ? (
                  <div className="space-y-4">
                    <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p className="font-medium">
                        {registrationStatus === 'WAITLIST' ? "You're on the Waitlist" : "You're Registered!"}
                      </p>
                      {registrationStatus === 'WAITLIST' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          We'll notify you if a spot opens up.
                        </p>
                      )}
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={registering}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Registration
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel your registration for this event?
                            {registrationStatus !== 'WAITLIST' && ' Your spot will be given to someone on the waitlist.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                          <AlertDialogAction onClick={handleUnregister}>
                            Cancel Registration
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isEventFull && (
                      <div className="text-center py-2 px-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          Event is full. You can join the waitlist.
                        </p>
                      </div>
                    )}

                    <div className="text-center py-2">
                      <p className="text-2xl font-bold">
                        {event.isFree || event.price === 0 ? 'Free' : `€${event.price?.toFixed(2)}`}
                      </p>
                      {event.capacity && (
                        <p className="text-sm text-muted-foreground">
                          {event.capacity - (event.currentAttendees || 0)} spots left
                        </p>
                      )}
                    </div>

                    <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg" disabled={registering}>
                          {isEventFull ? 'Join Waitlist' : 'Register Now'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {isEventFull ? 'Join Waitlist' : 'Register for Event'}
                          </DialogTitle>
                          <DialogDescription>
                            {isEventFull 
                              ? "You'll be notified if a spot becomes available."
                              : 'Complete your registration for this event.'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="notes">Notes for Organizer (optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Any special requirements or questions?"
                              value={registrationNotes}
                              onChange={(e) => setRegistrationNotes(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="emergency">Emergency Contact (optional)</Label>
                            <Input
                              id="emergency"
                              placeholder="Phone number"
                              value={emergencyContact}
                              onChange={(e) => setEmergencyContact(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowRegistrationDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleRegister} disabled={registering}>
                            {registering ? 'Registering...' : (isEventFull ? 'Join Waitlist' : 'Confirm Registration')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {!user && (
                      <p className="text-xs text-center text-muted-foreground">
                        <Link href={`/login?redirect=/events/${event.id}`} className="text-primary hover:underline">
                          Sign in
                        </Link>
                        {' '}to register for this event
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map placeholder */}
            {event.location && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm">{event.location}</p>
                  <Button variant="outline" className="w-full mt-2" size="sm" asChild>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
