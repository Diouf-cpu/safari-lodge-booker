import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Shield, ArrowRight, TreePine } from 'lucide-react';
import heroImage from '@/assets/hero-safari.jpg';
import { parks } from '@/data/parks';

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Botswana safari landscape"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
            <TreePine className="h-10 w-10 text-safari-gold" />
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-primary-foreground">
              BOGA
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-primary-foreground/90 font-serif mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Botswana Guides Association
          </p>
          <p className="text-base md:text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Spearheading Citizen Empowerment in Tourism — Book safari campsites across Botswana's most iconic wilderness areas
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button asChild size="lg" className="gold-gradient text-foreground font-semibold px-8 py-6 text-base border-0 hover:opacity-90">
              <Link to="/book">
                Book a Campsite <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-base">
              <Link to="/availability">Check Availability</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Your Gateway to Botswana's Wilderness
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Easily browse, check availability, and book campsites across Botswana's premier national parks and game reserves.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Choose Your Destination', desc: 'Browse campsites across Moremi, Chobe, Savuti, CKGR, Khwai and more.' },
              { icon: Calendar, title: 'Real-Time Availability', desc: 'See exactly which dates and sites are available before you book.' },
              { icon: Shield, title: 'Confirmed & Secured', desc: 'Bookings are confirmed by BOGA admin, ensuring your site is reserved.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl p-8 border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg safari-gradient flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parks Grid */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Safari Destinations
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Choose from {parks.length} incredible parks and reserves, each with unique camping sites.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {parks.map(park => (
              <Link
                to={`/book?park=${park.id}`}
                key={park.id}
                className="group bg-background rounded-xl border border-border p-6 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-full safari-gradient flex items-center justify-center mb-4">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {park.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {park.sites.length} camping site{park.sites.length > 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="safari-gradient py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TreePine className="h-6 w-6 text-safari-gold" />
            <span className="font-serif text-xl font-bold text-primary-foreground">BOGA</span>
          </div>
          <p className="text-primary-foreground/70 text-sm mb-2">
            Botswana Guides Association — Spearheading Citizen Empowerment in Tourism
          </p>
          <p className="text-primary-foreground/50 text-xs">
            © {new Date().getFullYear()} BOGA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
