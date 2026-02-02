import Link from 'next/link';
import { ArrowRight, Calendar, ShoppingBag, Users, MapPin, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  {
    icon: Calendar,
    title: 'Community Events',
    description: 'Discover and join local events, from neighborhood cleanups to cultural celebrations.',
    href: '/events',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy, sell, and trade items with your neighbors. Find great deals locally.',
    href: '/marketplace',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Community Posts',
    description: 'Ask questions, report issues, and share announcements with your community.',
    href: '/community',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: MapPin,
    title: 'Neighborhoods',
    description: 'Connect with residents in your area and discover communities across the Netherlands.',
    href: '/neighborhoods',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="py-12 md:py-20 flex flex-col items-center text-center">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="h-3 w-3 mr-1" />
          Connecting Communities Across the Netherlands
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Your Local <span className="text-primary">Community Hub</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mb-8">
          Connect with your neighbors, discover local events, buy and sell items, and participate in community discussions. Join thousands of residents building stronger neighborhoods.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button size="lg" asChild>
            <Link href="/register">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/neighborhoods">Explore Neighborhoods</Link>
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">10,000+</p>
            <p className="text-sm text-muted-foreground">Community Members</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">100+</p>
            <p className="text-sm text-muted-foreground">Neighborhoods</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">500+</p>
            <p className="text-sm text-muted-foreground">Events Hosted</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">2,000+</p>
            <p className="text-sm text-muted-foreground">Marketplace Listings</p>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 border-t border-b border-border">
        <h2 className="text-3xl font-bold text-center mb-4">Everything Your Community Needs</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          One platform to connect, engage, and build stronger neighborhoods together.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className={`p-3 rounded-lg ${feature.bgColor} w-fit mb-2`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Discover events happening in your community
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/events">
                  Browse Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Buy and sell items in your neighborhood
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/marketplace">
                  View Listings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                Community Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Join discussions with your neighbors
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/community">
                  View Posts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                Neighborhoods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Find communities across the Netherlands
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/neighborhoods">
                  Explore
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 border-t border-border">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to join your community?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Sign up today and start connecting with your neighbors. It is free and takes just a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Create an Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
