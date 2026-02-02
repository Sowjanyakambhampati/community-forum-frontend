'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { fetchCategories, createThread } from '@/lib/api';
import { Category, User } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft } from 'lucide-react';

const threadSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string().min(20, { message: 'Content must be at least 20 characters' }),
  categoryId: z.string().min(1, { message: 'Please select a category' }),
});

type ThreadFormValues = z.infer<typeof threadSchema>;

export default function CreateThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const categoryId = searchParams.get('categoryId');

  const form = useForm<ThreadFormValues>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: '',
      content: '',
      categoryId: categoryId || '',
    },
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          // Redirect to login if not logged in
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
        router.push('/login');
      }
    };

    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    loadCategories();
  }, [router]);

  const onSubmit = async (data: ThreadFormValues) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const threadData = await createThread(data);
      
      // Redirect to the new thread
      router.push(`/threads/${threadData.id}`);
    } catch (err: any) {
      console.error('Error creating thread:', err);
      setError('Failed to create thread. Please try again.');
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="mb-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={categoryId ? `/categories/${categoryId}` : '/categories'}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Thread</CardTitle>
          <CardDescription>
            Start a new discussion in the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={submitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Give your thread a title"
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your post content here..."
                        className="min-h-[200px]"
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Thread'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Please follow our community guidelines when posting.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}