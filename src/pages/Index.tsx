import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, CalendarCheck, Shield, ChevronRight } from 'lucide-react';
import heroImage from '@/assets/hero-modern.jpg';
import moremiImg from '@/assets/moremi.jpg';
import chobeImg from '@/assets/chobe.jpg';
import kalahariImg from '@/assets/kalahari.jpg';
import bogaLogo from '@/assets/boga-logo.png';
import { parks } from '@/data/parks';

const parkImages: Record<string, string> = { moremi: moremiImg, chobe: chobeImg, kalahari: kalahariImg };
const featuredParks = parks.slice(0, 6);

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero with Ken Burns */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <img src={heroImage} alt="Safari camp at sunset in Botswana" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" width={1920} height={1080} />
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
                  Wildlife Reserves (Members) <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary/40 bg-secondary/10 text-primary-foreground hover:bg-secondary/20 font-semibold px-8 py-6 text-base rounded-xl">
                <Link to="/book?type=boga-reserve">
                  BOGA Reserve Camp · Maun (Individuals)
                </Link>
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/50 mt-3 max-w-md">
              Wilderness sites are reserved by registered safari companies. The BOGA Reserve in Maun is open to individual guests, charged per person per night.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="dark-surface py-6">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: '1,000+', label: 'Tour Guides' },
            { value: '400+', label: 'Safari Companies' },
            { value: `${parks.reduce((s, p) => s + p.sites.length, 0)}+`, label: 'Camping Sites' },
            { value: `${parks.length}`, label: 'Wilderness Areas' },
          ].map(({ value, label }, i) => (
            <div key={label} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
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
            BOGA – Botswana Guides Association, was established in 1999 at the request of Professional Guides in Maun, Botswana. A platform for Guides and Small Safari Operators to express their concerns and needs regarding the tourism industry. It is a networking and advisory organization that focuses particularly on the growth and development of tourism.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Since its inception, BOGA has made great strides in assisting guides to acquire training, education and guide licenses. Our members regard the safari industry as an integral part of the country's Wildlife Management Programme and conservation in Botswana.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mt-10 text-left">
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-display font-semibold text-secondary mb-2">Our Mission</h3>
              <p className="text-sm text-muted-foreground">A meaningful and sustainable participation of citizens in the tourism sector.</p>
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-display font-semibold text-secondary mb-2">Our Vision</h3>
              <p className="text-sm text-muted-foreground">Advocating and facilitating organization in promoting tourism issues.</p>
            </div>
          </div>
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
              { step: '03', icon: Shield, title: 'Get Your Voucher', desc: 'Review your booking voucher, download the PDF, share via WhatsApp or email, and submit. BOGA admin confirms within 3 days.' },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <span className="font-display text-6xl font-extrabold text-muted/80 absolute -top-4 -left-2">{step}</span>
                <div className="relative pt-10">
                  <div className="w-12 h-12 rounded-xl amber-glow flex items-center justify-center mb-5 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
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

      {/* Destinations */}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredParks.map((park, i) => {
              const img = parkImages[park.image || ''] || moremiImg;
              return (
                <Link to={`/book?park=${park.id}`} key={park.id} className="group card-hover rounded-2xl overflow-hidden bg-card border animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={img} alt={park.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-secondary transition-colors">{park.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{park.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{park.sites.length} sites</span>
                      <span className="text-xs font-medium text-secondary flex items-center group-hover:gap-2 transition-all">
                        Book now <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOGA Members */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-4">Our Members</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Trusted Safari Operators</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {['Delta Rain', 'Afrinature Safaris', 'Swampland Safaris', 'African Bush Safaris', 'African Excursions', 'Mopalo Safaris', 'Shipungo Safaris', 'Okavango Skimmers', 'Okavango Voyagers', 'Bush Lark', 'Rams Safaris', 'Wanda Safaris'].map(name => (
              <span key={name} className="px-4 py-2 rounded-full bg-muted text-sm font-medium text-foreground">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 dark-surface">
        <div className="container mx-auto px-4 text-center">
          <img src={bogaLogo} alt="BOGA Logo" className="h-20 w-20 object-contain mx-auto mb-6" />
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
              <img src={bogaLogo} alt="BOGA" className="h-8 w-8 object-contain" />
              <span className="font-display text-lg font-bold">BOGA</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Botswana Guides Association • Maun, Botswana • Spearheading Citizen Empowerment in Tourism
            </p>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} <Link to="/admin" className="hover:text-secondary transition-colors cursor-pointer" aria-label="Reservation desk">BOGA</Link> · <Link to="/admin" className="hover:text-secondary transition-colors text-[10px] uppercase tracking-wider">Reservation</Link></p>
              <p className="text-xs text-muted-foreground mt-1">
                Made with ♥ by{' '}
                <a href="https://pamojadigital.org" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-400 font-semibold transition-colors">
                  Pamoja
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
