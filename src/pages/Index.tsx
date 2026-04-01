import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Compass, MapPin, CalendarCheck, Shield, Users, ChevronRight } from 'lucide-react';
import heroImage from '@/assets/hero-modern.jpg';
import moremiImg from '@/assets/moremi.jpg';
import chobeImg from '@/assets/chobe.jpg';
import kalahariImg from '@/assets/kalahari.jpg';
import { parks } from '@/data/parks';

const parkImages: Record<string, string> = { moremi: moremiImg, chobe: chobeImg, kalahari: kalahariImg };
const featuredParks = parks.slice(0, 4);

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <img src={heroImage} alt="Safari camp at sunset in Botswana" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative z-10 container mx-auto px-4 pb-24">
          <div className="max-w-2xl">
            <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-4 animate-fade-up">
              Botswana Guides Association
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold text-primary-foreground leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              Book Your Wilderness Experience
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-10 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
              Reserve campsites across Botswana's most iconic parks and reserves. 1,000+ guides. 400+ safari companies. One booking platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.45s' }}>
              <Button asChild size="lg" className="amber-glow text-accent-foreground font-semibold px-8 py-6 text-base border-0 rounded-xl hover:opacity-90 transition-opacity">
                <Link to="/book">
                  Book a Campsite <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-base rounded-xl">
                <Link to="/availability">Check Availability</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="dark-surface py-6">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: '1,000+', label: 'Tour Guides' },
            { value: '400+', label: 'Safari Companies' },
            { value: '82+', label: 'Active Members' },
            { value: '9', label: 'Wilderness Areas' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-secondary">{value}</p>
              <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-4">About BOGA</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Spearheading Citizen Empowerment in Tourism
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            Botswana Guides Association is a tourism body whose members comprise of 1,000 tour guides and 400 mobile safari companies. Headquartered in Maun, BOGA promotes the development of locally based tour and safari industry and works towards maintaining high standards, professionalism and ethics within Botswana's tourism sector.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our members regard the safari industry as an integral part of the country's Wildlife Management Programme and conservation in Botswana.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Book in 3 Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', icon: MapPin, title: 'Choose Your Sites', desc: 'Browse parks and campsites across Moremi, Chobe, Savuti, CKGR, Khwai and more. See coordinates and details for every site.' },
              { step: '02', icon: CalendarCheck, title: 'Check & Book Dates', desc: 'View real-time availability, select your dates, and add multiple sites to a single booking. Prices calculate automatically.' },
              { step: '03', icon: Shield, title: 'Get Your Invoice', desc: 'Review your invoice, share it via WhatsApp or email, and submit. BOGA admin confirms and secures your reservation.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <span className="font-display text-6xl font-extrabold text-muted/80 absolute -top-4 -left-2">{step}</span>
                <div className="relative pt-10">
                  <div className="w-12 h-12 rounded-xl amber-glow flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-4">Destinations</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold">Explore Wilderness Areas</h2>
            </div>
            <Link to="/book" className="hidden md:flex items-center text-sm font-medium text-secondary hover:underline">
              View all destinations <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredParks.map(park => {
              const img = parkImages[park.image || ''] || moremiImg;
              return (
                <Link to={`/book?park=${park.id}`} key={park.id} className="group card-hover rounded-2xl overflow-hidden bg-card border">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={img} alt={park.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-secondary transition-colors">{park.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{park.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{park.sites.length} sites</span>
                      <span className="text-xs font-medium text-secondary flex items-center">
                        Book now <ArrowRight className="h-3 w-3 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 dark-surface">
        <div className="container mx-auto px-4 text-center">
          <Compass className="h-10 w-10 text-secondary mx-auto mb-6" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Experience Botswana?
          </h2>
          <p className="text-primary-foreground/60 mb-10 max-w-xl mx-auto">
            Browse campsites, check availability, and make your booking in minutes. Your next wilderness adventure starts here.
          </p>
          <Button asChild size="lg" className="amber-glow text-accent-foreground font-semibold px-10 py-6 text-base border-0 rounded-xl hover:opacity-90">
            <Link to="/book">Start Booking <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-secondary" />
              <span className="font-display text-lg font-bold">BOGA</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Botswana Guides Association • Maun, Botswana • Spearheading Citizen Empowerment in Tourism
            </p>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BOGA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
