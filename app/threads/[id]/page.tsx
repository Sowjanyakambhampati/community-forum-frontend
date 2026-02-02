import { Metadata } from 'next';
import { fetchThread, fetchPosts, fetchThreads } from '@/lib/api';
import { Thread } from '@/types';
import ThreadPageClient from './ThreadPageClient';

export async function generateStaticParams() {
  try {
    // Fetch all threads to generate static params
    const threads = await fetchThreads();
    
    // Only pre-generate the first 10 threads (or popular ones)
    const threadsToPreGenerate = threads.slice(0, 10);
    
    return threadsToPreGenerate.map((thread: Thread) => ({
      id: thread.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return some fallback thread IDs
    return [
      { id: '1' },
      { id: '2' },
    ];
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const thread = await fetchThread(params.id);
    
    return {
      title: `${thread.title} - Community Forum`,
      description: thread.content.replace(/<[^>]*>/g, '').slice(0, 155),
      openGraph: {
        title: thread.title,
        description: thread.content.replace(/<[^>]*>/g, '').slice(0, 155),
        type: 'article',
        publishedTime: thread.createdAt,
        authors: [thread.author.username || thread.author.email],
      },
    };
  } catch (error) {
    return {
      title: 'Thread - Community Forum',
      description: 'Join the discussion in our community forum',
    };
  }
}

interface PageProps {
  params: { id: string };
}

export default async function ThreadPage({ params }: PageProps) {
  try {
    // Fetch initial data on the server
    const [thread, posts] = await Promise.all([
      fetchThread(params.id),
      fetchPosts(params.id)
    ]);
    
    return (
      <ThreadPageClient 
        initialThread={thread} 
        initialPosts={posts} 
        threadId={params.id}
      />
    );
  } catch (error) {
    console.error('Error loading thread data:', error);
    return (
      <ThreadPageClient 
        initialThread={null} 
        initialPosts={[]} 
        threadId={params.id}
        error="Failed to load thread. Please try again later." 
      />
    );
  }
}