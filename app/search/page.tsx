'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchAPI } from '@/lib/api';
import { SearchResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { Search, MessageSquare, User as UserIcon, ShoppingBag, FileText } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, type: string = 'all') => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await searchAPI.search({
        q: searchQuery,
        type: type === 'all' ? undefined : type as any,
        limit: 20
      });
      
      setResults(data.results || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query, activeTab);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (query.trim()) {
      performSearch(query, tab);
    }
  };

  const getSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await searchAPI.suggestions(searchQuery);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error getting suggestions:', err);
    }
  };

  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true;
    return result.type === activeTab;
  });

  const getResultCounts = () => {
    const counts = {
      all: results.length,
      threads: results.filter(r => r.type === 'thread').length,
      posts: results.filter(r => r.type === 'post').length,
      users: results.filter(r => r.type === 'user').length,
      listings: results.filter(r => r.type === 'listing').length,
    };
    return counts;
  };

  const counts = getResultCounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Search className="mr-2 h-7 w-7" />
          Search
        </h1>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search threads, posts, users, and marketplace..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  getSuggestions(e.target.value);
                }}
                className="pr-10"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 z-10 shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        setQuery(suggestion);
                        setSuggestions([]);
                        performSearch(suggestion, activeTab);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {query && (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="threads" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Threads ({counts.threads})
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Posts ({counts.posts})
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Users ({counts.users})
              </TabsTrigger>
              <TabsTrigger value="listings" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Marketplace ({counts.listings})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={() => performSearch(query, activeTab)}>
                    Try Again
                  </Button>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    {query ? `No results found for "${query}"` : 'Enter a search term to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result) => (
                    <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const getResultLink = () => {
    switch (result.type) {
      case 'thread':
        return `/threads/${result.id}`;
      case 'post':
        return `/threads/${result.threadId}#post-${result.id}`;
      case 'user':
        return `/users/${result.id}`;
      case 'listing':
        return `/marketplace/${result.id}`;
      default:
        return '#';
    }
  };

  const getResultIcon = () => {
    switch (result.type) {
      case 'thread':
        return <MessageSquare className="h-4 w-4" />;
      case 'post':
        return <MessageSquare className="h-4 w-4" />;
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      case 'listing':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Link href={getResultLink()}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getResultIcon()}
              {result.type}
            </Badge>
            {result.relevanceScore && (
              <Badge variant="secondary">
                {Math.round(result.relevanceScore * 100)}% match
              </Badge>
            )}
          </div>
          
          {result.title && (
            <CardTitle className="line-clamp-2">
              {result.highlights?.title ? (
                <span dangerouslySetInnerHTML={{ __html: result.highlights.title.join(' ... ') }} />
              ) : (
                result.title
              )}
            </CardTitle>
          )}
          
          {result.author && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={result.author.avatarUrl} alt={result.author.username} />
                <AvatarFallback>
                  {result.author.username?.charAt(0) || result.author.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {result.author.username || result.author.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {safeFormatDistanceToNow(result.createdAt, { addSuffix: true })}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <CardDescription className="line-clamp-3">
            {result.highlights?.content ? (
              <span dangerouslySetInnerHTML={{ __html: result.highlights.content.join(' ... ') }} />
            ) : (
              result.content.replace(/<[^>]*>/g, '')
            )}
          </CardDescription>
          
          {result.category && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {result.category.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}