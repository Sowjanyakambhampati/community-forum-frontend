'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { messagesAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Conversation, Message, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { safeFormatDistanceToNow } from '@/lib/date-utils';
import { MessageSquare, Plus, Send, Trash2, Archive } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
        router.push('/login');
      }
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagesAPI.getConversations({ limit: 50 });
      setConversations(data.conversations || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const data = await messagesAPI.getConversation(conversationId, { limit: 50 });
      setMessages(data.messages || []);
      
      // Mark conversation as read
      await messagesAPI.markAsRead(conversationId);
      
      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (err: any) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    try {
      setSending(true);
      
      // Find the other participant in the conversation
      const otherParticipant = selectedConversation.participants.find(p => p.id !== user?.id);
      
      const message = await messagesAPI.sendMessage({
        recipientId: otherParticipant?.id || '',
        conversationId: selectedConversation.id,
        content: newMessage
      });
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update conversation with new last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await messagesAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
    }
  };

  const getOtherParticipant = (conversation: Conversation): User | null => {
    return conversation.participants.find(p => p.id !== user?.id) || null;
  };

  if (!user || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <MessageSquare className="mr-2 h-7 w-7" />
              Messages
            </h1>
            <p className="text-muted-foreground">
              Private conversations with other members
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
                <DialogDescription>
                  Send a private message to another member
                </DialogDescription>
              </DialogHeader>
              <NewMessageForm onSuccess={loadConversations} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="space-y-4 overflow-y-auto">
            {error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={loadConversations}>
                  Try Again
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No conversations</h3>
                <p className="text-muted-foreground text-sm">
                  Start a new conversation to get started
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedConversation?.id === conversation.id ? 'border-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      loadMessages(conversation.id);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherParticipant?.avatarUrl} alt={otherParticipant?.username} />
                            <AvatarFallback>
                              {otherParticipant?.username?.charAt(0) || otherParticipant?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm">
                              {otherParticipant?.username || otherParticipant?.email}
                            </CardTitle>
                            {conversation.lastMessage && (
                              <CardDescription className="line-clamp-1 text-xs">
                                {conversation.lastMessage.content}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessage && safeFormatDistanceToNow(
                              conversation.lastMessage.createdAt, 
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </div>

          {/* Messages View */}
          <div className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={getOtherParticipant(selectedConversation)?.avatarUrl} 
                            alt={getOtherParticipant(selectedConversation)?.username} 
                          />
                          <AvatarFallback>
                            {getOtherParticipant(selectedConversation)?.username?.charAt(0) || 
                             getOtherParticipant(selectedConversation)?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {getOtherParticipant(selectedConversation)?.username || 
                             getOtherParticipant(selectedConversation)?.email}
                          </CardTitle>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteConversation(selectedConversation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <Skeleton className="h-16 w-3/4 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {safeFormatDistanceToNow(message.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] max-h-[120px]"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewMessageForm({ onSuccess }: { onSuccess: () => void }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail.trim() || !message.trim()) return;
    
    try {
      setSending(true);
      setError(null);
      
      // For now, we'll need to find the user by email first
      // This would typically be done through a user search endpoint
      await messagesAPI.sendMessage({
        recipientId: recipientEmail, // This should be the actual user ID
        content: message
      });
      
      setRecipientEmail('');
      setMessage('');
      onSuccess();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
      
      <div>
        <label className="text-sm font-medium">Recipient Email</label>
        <Input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Enter recipient's email"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[100px]"
          required
        />
      </div>
      
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}