import { fetchCategory, fetchThreads } from '@/lib/api';
import CategoryPageClient from './CategoryPageClient';

export async function generateStaticParams() {
  try {
    const { fetchCategories } = await import('@/lib/api');
    const categories = await fetchCategories();
    return categories.map((category: any) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

interface PageProps {
  params: { slug: string };
}

export default async function CategoryPage({ params }: PageProps) {
  try {
    // Fetch initial data on the server
    const category = await fetchCategory(params.slug);
    const threads = await fetchThreads(category.id);
    
    return (
      <CategoryPageClient 
        initialCategory={category} 
        initialThreads={threads} 
      />
    );
  } catch (error) {
    console.error('Error loading category data:', error);
    return (
      <CategoryPageClient 
        initialCategory={null} 
        initialThreads={[]} 
        error="Failed to load category. Please try again later." 
      />
    );
  }
}