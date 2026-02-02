'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrentUser } from '@/lib/auth';
import { communityPostsAPI, neighborhoodsAPI } from '@/lib/api';
import { ArrowLeft, HelpCircle, AlertTriangle, Megaphone, Wrench, Image, X, Plus } from 'lucide-react';
import { User, Neighborhood } from '@/types';

const POST_CATEGORIES = [
  {
    value: 'SERVICE',
    label: 'Service',
    icon: Wrench,
    color: 'bg-blue-500',
    description: 'Offering or seeking services like babysitting, repairs, etc.',
  },
  {
    value: 'ISSUE',
    label: 'Issue',
    icon: AlertTriangle,
    color: 'bg-red-500',
    description: 'Report community issues like broken streetlights, noise complaints, etc.',
  },
  {
    value: 'QUESTION',
    label: 'Question',
    icon: HelpCircle,
    color: 'bg-amber-500',
    description: 'Ask questions to your community members.',
  },
  {
    value: 'ANNOUNCEMENT',
    label: 'Announcement',
    icon: Megaphone,
    color: 'bg-green-500',
    description: 'Share important announcements with your community.',
  },
];

export default function CreateCommunityPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login?redirect=/community/create');
          return;
        }
        setUser(currentUser);

        const neighborhoodsData = await neighborhoodsAPI.getAll().catch(() => ({ data: [] }));
        const processedNeighborhoods = Array.isArray(neighborhoodsData) ? neighborhoodsData : (neighborhoodsData?.neighborhoods || neighborhoodsData?.data || []);
        setNeighborhoods(processedNeighborhoods);

        // Set default neighborhood from user profile
        if (currentUser.neighborhoodId) {
          setNeighborhoodId(currentUser.neighborhoodId);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !images.includes(imageInput.trim())) {
      setImages([...images, imageInput.trim()]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (image: string) => {
    setImages(images.filter(i => i !== image));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const postData = {
        title: title.trim(),
        content: content.trim(),
        category: category as 'SERVICE' | 'ISSUE' | 'QUESTION' | 'ANNOUNCEMENT',
        neighborhoodId: neighborhoodId || undefined,
        tags: tags.length > 0 ? tags : undefined,
        images: images.length > 0 ? images : undefined,
      };

      const response = await communityPostsAPI.create(postData);
      const newPost = response.data || response;
      
      router.push(`/community/${newPost.id}`);
    } catch (err: any) {
      console.error('Error creating post:', err);
      alert(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-muted rounded mb-6" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Community Post</CardTitle>
            <CardDescription>
              Share questions, report issues, or make announcements to your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-4">
                <Label>Post Category *</Label>
                <div className="grid grid-cols-2 gap-4">
                  {POST_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.value;
                    
                    return (
                      <Card
                        key={cat.value}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                        }`}
                        onClick={() => setCategory(cat.value)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${cat.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{cat.label}</p>
                              <p className="text-xs text-muted-foreground">{cat.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a clear, descriptive title"
                  required
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide details about your post..."
                  required
                  rows={8}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.length}/2000 characters
                </p>
              </div>

              {/* Neighborhood */}
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select neighborhood (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Neighborhoods</SelectItem>
                    {neighborhoods.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.name}, {neighborhood.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to share with all communities
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      placeholder="Enter image URL"
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddImage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div key={image} className="relative group">
                        <img
                          src={image}
                          alt=""
                          className="w-full aspect-video object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !category}>
                  {submitting ? 'Creating Post...' : 'Create Post'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
