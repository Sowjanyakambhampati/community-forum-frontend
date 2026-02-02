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
import { marketplaceAPI } from '@/lib/api';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { Plus, Search, Filter, Heart, MapPin, DollarSign, Tag } from 'lucide-react';
import { User, MarketplaceListing, MarketplaceCategory } from '@/types';

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load categories and listings in parallel
        const [listingsData, categoriesData] = await Promise.all([
          marketplaceAPI.getListings(),
          marketplaceAPI.getCategories()
        ]);
        
        // Handle the case where data might be wrapped in an object
        const processedListings = Array.isArray(listingsData) ? listingsData : (listingsData?.listings || listingsData?.data || []);
        const processedCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || categoriesData?.data || []);
        
        setListings(processedListings);
        setFilteredListings(processedListings);
        setCategories(processedCategories);
        setError(null);
      } catch (err) {
        console.error('Error loading marketplace data:', err);
        
        // Check if the error is specifically about no listings being found
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Listing not found') || errorMessage.includes('No listings found')) {
          // This is not really an error - just no listings available
          setListings([]);
          setFilteredListings([]);
          setError(null);
          
          // Still try to load categories
          try {
            const categoriesData = await marketplaceAPI.getCategories();
            const processedCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || categoriesData?.data || []);
            setCategories(processedCategories);
          } catch (categoryErr) {
            console.error('Error loading categories:', categoryErr);
            setCategories([]);
          }
        } else {
          setError('Failed to load marketplace data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    loadData();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, minPrice, maxPrice, location, selectedCondition, listings]);

  const applyFilters = () => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.tags?.some(tag => {
          const tagText = typeof tag === 'string' ? tag : (tag as any)?.name || '';
          return tagText.toLowerCase().includes(query);
        })
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing => {
        const categoryId = typeof listing.category === 'object' ? listing.category.id : listing.category;
        return categoryId === selectedCategory;
      });
    }

    // Price filters
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(listing => listing.price >= min);
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter(listing => listing.price <= max);
      }
    }

    // Location filter
    if (location.trim()) {
      const locationQuery = location.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.location.toLowerCase().includes(locationQuery)
      );
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(listing => listing.condition === selectedCondition);
    }

    setFilteredListings(filtered);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    
    try {
      // If we have backend search, use it
      const params = {
        search: searchQuery || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        location: location || undefined,
        condition: selectedCondition === 'all' ? undefined : selectedCondition,
      };
      
      const data = await marketplaceAPI.getListings(params);
      const processedListings = Array.isArray(data) ? data : (data?.listings || data?.data || []);
      setListings(processedListings);
      setFilteredListings(processedListings);
      setError(null);
    } catch (err) {
      console.error('Error searching listings:', err);
      
      // Fallback to client-side filtering if backend search fails
      applyFilters();
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setSelectedCondition('all');
    setFilteredListings(listings);
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'all') return 'All Categories';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Select category';
  };

  if (loading && listings.length === 0) {
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
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
            <p className="text-muted-foreground">
              Browse and sell items in our community marketplace
            </p>
          </div>
          <Button asChild>
            <Link href="/marketplace/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue>
                      {getCategoryName(selectedCategory)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like-new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredListings.length} of {listings.length} listings
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {filteredListings.length === 0 ? (
          <Card className="p-8 text-center">
            <CardTitle className="mb-2">No listings found</CardTitle>
            <CardDescription className="mb-6">
              {searchQuery || selectedCategory !== 'all' || minPrice || maxPrice || location || selectedCondition !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Be the first to create a listing in our marketplace.'}
            </CardDescription>
            <Button asChild>
              <Link href="/marketplace/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full group">
                  <CardHeader className="pb-2">
                    {listing.images?.[0] && (
                      <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                        />
                        {listing.status === 'sold' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive" className="text-lg">SOLD</Badge>
                          </div>
                        )}
                      </div>
                    )}
                    <CardTitle className="line-clamp-2 text-lg">{listing.title}</CardTitle>
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="font-bold">
                        <DollarSign className="mr-1 h-3 w-3" />
                        ${listing.price}
                      </Badge>
                      {listing.condition && (
                        <Badge variant="outline" className="text-xs">
                          {listing.condition}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 mb-4">
                      {listing.description}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="mr-1 h-3 w-3" />
                        {typeof listing.category === 'object' ? listing.category.name : listing.category || 'Uncategorized'}
                      </Badge>
                      {listing.tags?.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeof tag === 'string' ? tag : (tag as any)?.name || 'Tag'}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{listing.location}</span>
                      </div>
                      <span>
                        {safeFormatDistanceToNow(listing.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}