'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { categoriesAPI } from '@/lib/api';
import { Category } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, MessageSquare } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await categoriesAPI.getAll();
        
        // Handle the API response structure - the mock API returns { data: Category[] }
        let categoriesArray: Category[] = [];
        
        if (Array.isArray(response)) {
          // Direct array response
          categoriesArray = response;
        } else if (response && Array.isArray(response.data)) {
          // Response with data property containing array
          categoriesArray = response.data;
        } else {
          console.warn('Unexpected categories data format:', response);
          categoriesArray = [];
        }
        
        setCategories(categoriesArray);
        setError(null);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories. Please try again later.');
        setCategories([]); // Ensure categories is always an array
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-7 w-40 mb-1" />
                <Skeleton className="h-4 w-full max-w-2xl" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
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

  // Ensure categories is an array before filtering
  const categoriesArray = Array.isArray(categories) ? categories : [];

  // Group categories by parent/child relationship
  const parentCategories = categoriesArray.filter(category => !category.parentId);
  const childCategories = categoriesArray.filter(category => category.parentId);
  
  // Add subcategories to each parent
  parentCategories.forEach(parent => {
    parent.subcategories = childCategories.filter(child => child.parentId === parent.id);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <MessageSquare className="mr-2 h-7 w-7" />
          Forum Categories
        </h1>
        <p className="text-muted-foreground">
          Browse all discussion categories and find topics that interest you.
        </p>
      </div>
      
      {parentCategories.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No categories available</h3>
          <p className="text-muted-foreground">
            Categories will appear here once they are created.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {parentCategories.map((category) => (
            <div key={category.id}>
              <Link href={`/categories/${category.slug}`}>
                <Card className="hover:shadow-md transition-shadow mb-4 cursor-pointer group">
                  <CardHeader className="pb-2">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        <Badge variant="secondary">
                          {category.threadCount || 0} {(category.threadCount || 0) === 1 ? 'thread' : 'threads'}
                        </Badge>
                        <Badge variant="outline">
                          {category.postCount || 0} {(category.postCount || 0) === 1 ? 'post' : 'posts'}
                        </Badge>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="ml-8 space-y-4 mt-4 mb-6">
                  {category.subcategories.map((subcategory) => (
                    <Link key={subcategory.id} href={`/categories/${subcategory.slug}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary group">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {subcategory.name}
                          </CardTitle>
                          <CardDescription>{subcategory.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-4">
                              <Badge variant="secondary">
                                {subcategory.threadCount || 0} {(subcategory.threadCount || 0) === 1 ? 'thread' : 'threads'}
                              </Badge>
                              <Badge variant="outline">
                                {subcategory.postCount || 0} {(subcategory.postCount || 0) === 1 ? 'post' : 'posts'}
                              </Badge>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}