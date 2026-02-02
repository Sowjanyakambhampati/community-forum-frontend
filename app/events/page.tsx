'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO, isAfter, isBefore, isToday, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getCurrentUser } from '@/lib/auth';
import { eventsAPI, neighborhoodsAPI } from '@/lib/api';
import { 
  Plus, Search, Filter, Calendar as CalendarIcon, MapPin, Clock, 
  Users, ChevronRight, Tag, DollarSign, Ticket
} from 'lucide-react';
import { User, Event, EventCategory, Neighborhood } from '@/types';
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

// Safe date parsing helper
const safeParseDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// Safe date formatting helper
const safeFormatDate = (dateString: string | undefined | null, formatStr: string, fallback: string = 'TBD'): string => {
  const date = safeParseDate(dateString);
  if (!date) return fallback;
  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
};

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(searchParams.get('neighborhood') || 'all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const [eventsData, categoriesData, neighborhoodsData] = await Promise.all([
          eventsAPI.getAll().catch(() => ({ data: [] })),
          eventsAPI.getCategories().catch(() => ({ data: [] })),
          neighborhoodsAPI.getAll().catch(() => ({ data: [] }))
        ]);

        const processedEvents = Array.isArray(eventsData) ? eventsData : (eventsData?.events || eventsData?.data || []);
        const processedCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || categoriesData?.data || []);
        const processedNeighborhoods = Array.isArray(neighborhoodsData) ? neighborhoodsData : (neighborhoodsData?.neighborhoods || neighborhoodsData?.data || []);

        // Filter out events without valid dates
        const validEvents = processedEvents.filter((event: any) => event && (event.startDate || event.date));
        
        setEvents(validEvents);
        setFilteredEvents(validEvents);
        setCategories(processedCategories);
        setNeighborhoods(processedNeighborhoods);
        setError(null);
      } catch (err) {
        console.error('Error loading events:', err);
        setEvents([]);
        setFilteredEvents([]);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedNeighborhood, selectedDate, showFreeOnly, activeTab, events]);

  const getEventDate = (event: Event): string | undefined => {
    return event.startDate || (event as any).date;
  };

  const applyFilters = () => {
    let filtered = [...events];
    const now = new Date();

    // Tab filter
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(event => {
        const eventDate = safeParseDate(getEventDate(event));
        if (!eventDate) return false;
        return event.status === 'UPCOMING' || isAfter(eventDate, now);
      });
    } else if (activeTab === 'past') {
      filtered = filtered.filter(event => {
        const eventDate = safeParseDate(getEventDate(event));
        if (!eventDate) return false;
        return event.status === 'COMPLETED' || isBefore(eventDate, now);
      });
    } else if (activeTab === 'today') {
      filtered = filtered.filter(event => {
        const eventDate = safeParseDate(getEventDate(event));
        if (!eventDate) return false;
        return isToday(eventDate);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        (event.title?.toLowerCase() || '').includes(query) ||
        (event.description?.toLowerCase() || '').includes(query) ||
        (event.location?.toLowerCase() || '').includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => {
        const categoryId = typeof event.category === 'object' ? event.category?.id : event.categoryId;
        const categorySlug = typeof event.category === 'object' ? event.category?.slug : event.category;
        return categoryId === selectedCategory || categorySlug === selectedCategory;
      });
    }

    // Neighborhood filter
    if (selectedNeighborhood !== 'all') {
      filtered = filtered.filter(event => event.neighborhoodId === selectedNeighborhood);
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(event => {
        const eventDate = safeParseDate(getEventDate(event));
        if (!eventDate) return false;
        return (
          eventDate.getFullYear() === selectedDate.getFullYear() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getDate() === selectedDate.getDate()
        );
      });
    }

    // Free only filter
    if (showFreeOnly) {
      filtered = filtered.filter(event => event.isFree || event.price === 0);
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = safeParseDate(getEventDate(a));
      const dateB = safeParseDate(getEventDate(b));
      if (!dateA || !dateB) return 0;
      if (activeTab === 'past') {
        return dateB.getTime() - dateA.getTime();
      }
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedNeighborhood('all');
    setSelectedDate(undefined);
    setShowFreeOnly(false);
  };

  const getCategoryName = (event: Event): string => {
    if (typeof event.category === 'object' && event.category) {
      return event.category.name || 'Other';
    }
    return event.category || 'Other';
  };

  const getCategorySlug = (event: Event): string => {
    if (typeof event.category === 'object' && event.category) {
      return event.category.slug || event.category.name?.toLowerCase() || 'other';
    }
    return (event.category || 'other').toLowerCase();
  };

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const startDate = safeParseDate(getEventDate(event));
    
    if (event.status === 'CANCELLED') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (startDate && isToday(startDate)) {
      return <Badge className="bg-green-500">Today</Badge>;
    }
    if (startDate && isBefore(startDate, now)) {
      return <Badge variant="secondary">Past</Badge>;
    }
    if (event.capacity && event.currentAttendees && event.currentAttendees >= event.capacity) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Full</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
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
          <h1 className="text-3xl font-bold mb-2">Community Events</h1>
          <p className="text-muted-foreground">
            Discover and join local events in your neighborhood
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/events/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All Events</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {EVENT_CATEGORY_ICONS[category.slug] || '📌'} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
              <SelectTrigger>
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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show free events only
            </label>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredEvents.length} events
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No events found</CardTitle>
          <CardDescription className="mb-6">
            {searchQuery || selectedCategory !== 'all' || selectedNeighborhood !== 'all' || selectedDate
              ? 'Try adjusting your filters.'
              : 'Be the first to create an event in your community!'}
          </CardDescription>
          {user && (
            <Button asChild>
              <Link href="/events/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-shadow h-full group overflow-hidden">
                {/* Event Image */}
                {event.images?.[0] ? (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={event.images[0]}
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge className={cn(
                        "text-white",
                        EVENT_CATEGORY_COLORS[getCategorySlug(event)] || 'bg-slate-500'
                      )}>
                        {EVENT_CATEGORY_ICONS[getCategorySlug(event)] || '📌'} {getCategoryName(event)}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(event)}
                    </div>
                    {event.isFree && (
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-green-500 text-white">Free</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "aspect-video flex items-center justify-center text-6xl relative",
                    EVENT_CATEGORY_COLORS[getCategorySlug(event)] || 'bg-slate-500',
                    "bg-opacity-20"
                  )}>
                    <span>{EVENT_CATEGORY_ICONS[getCategorySlug(event)] || '📌'}</span>
                    <div className="absolute top-2 left-2">
                      <Badge className={cn(
                        "text-white",
                        EVENT_CATEGORY_COLORS[getCategorySlug(event)] || 'bg-slate-500'
                      )}>
                        {getCategoryName(event)}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(event)}
                    </div>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                    {event.title || 'Untitled Event'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.shortDescription || event.description || 'No description available'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{safeFormatDate(getEventDate(event), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{safeFormatDate(getEventDate(event), 'p')}</span>
                      {event.endDate && (
                        <span>- {safeFormatDate(event.endDate, 'p')}</span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.currentAttendees || 0} / {event.capacity} attendees
                        </span>
                      </div>
                    )}
                    {!event.isFree && event.price && (
                      <div className="flex items-center gap-2 font-semibold text-primary">
                        <DollarSign className="h-4 w-4" />
                        <span>€{event.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
