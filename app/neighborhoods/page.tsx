'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrentUser } from '@/lib/auth';
import { neighborhoodsAPI } from '@/lib/api';
import { 
  Search, MapPin, Users, Calendar, ShoppingBag, MessageSquare, 
  Building2, ChevronRight 
} from 'lucide-react';
import { User, Neighborhood } from '@/types';

export default function NeighborhoodsPage() {
  const router = useRouter();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const data = await neighborhoodsAPI.getAll();
        const processedNeighborhoods = Array.isArray(data) ? data : (data?.neighborhoods || data?.data || []);
        
        setNeighborhoods(processedNeighborhoods);
        setFilteredNeighborhoods(processedNeighborhoods);
        
        // Extract unique cities
        const uniqueCities = Array.from(new Set(processedNeighborhoods.map((n: Neighborhood) => n.city))).filter(Boolean) as string[];
        setCities(uniqueCities);
        
        setError(null);
      } catch (err) {
        console.error('Error loading neighborhoods:', err);
        setNeighborhoods([]);
        setFilteredNeighborhoods([]);
        setError('Failed to load neighborhoods. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCity, neighborhoods]);

  const applyFilters = () => {
    let filtered = [...neighborhoods];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(neighborhood =>
        neighborhood.name.toLowerCase().includes(query) ||
        neighborhood.city.toLowerCase().includes(query) ||
        neighborhood.description?.toLowerCase().includes(query) ||
        neighborhood.postalCode?.includes(query)
      );
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(neighborhood => neighborhood.city === selectedCity);
    }

    // Sort alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredNeighborhoods(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Neighborhoods</h1>
        <p className="text-muted-foreground">
          Explore and connect with communities across the Netherlands
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{neighborhoods.length}</p>
                <p className="text-sm text-muted-foreground">Neighborhoods</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cities.length}</p>
                <p className="text-sm text-muted-foreground">Cities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {neighborhoods.reduce((sum, n) => sum + (n.memberCount || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {neighborhoods.reduce((sum, n) => sum + (n.eventCount || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search neighborhoods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredNeighborhoods.length} neighborhoods
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCity !== 'all' && ` in ${selectedCity}`}
        </p>
      </div>

      {/* Neighborhoods Grid */}
      {filteredNeighborhoods.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No neighborhoods found</CardTitle>
          <CardDescription>
            {searchQuery || selectedCity !== 'all'
              ? 'Try adjusting your search criteria.'
              : 'No neighborhoods are available at the moment.'}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNeighborhoods.map((neighborhood) => (
            <Link key={neighborhood.id} href={`/neighborhoods/${neighborhood.id}`}>
              <Card className="hover:shadow-lg transition-shadow h-full group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {neighborhood.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {neighborhood.city}
                        {neighborhood.postalCode && ` · ${neighborhood.postalCode}`}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  {neighborhood.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {neighborhood.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{neighborhood.memberCount || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{neighborhood.eventCount || 0} events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>{neighborhood.listingCount || 0} listings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{neighborhood.postCount || 0} posts</span>
                    </div>
                  </div>

                  {user?.neighborhoodId === neighborhood.id && (
                    <Badge className="mt-4" variant="secondary">
                      Your Neighborhood
                    </Badge>
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
