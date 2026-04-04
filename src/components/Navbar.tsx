import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import bogaLogo from '@/assets/boga-logo.png';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/book', label: 'Book Now' },
    { to: '/availability', label: 'Availability' },
  ];

  const navBg = scrolled || !isHome
    ? 'bg-card/95 backdrop-blur-xl border-b shadow-sm'
    : 'bg-transparent border-b border-transparent';

  const textColor = scrolled || !isHome ? 'text-foreground' : 'text-primary-foreground';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={bogaLogo} alt="BOGA Logo" className="h-10 w-10 object-contain" />
          <span className={`font-display text-xl font-bold tracking-tight ${textColor}`}>BOGA</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? 'amber-glow text-accent-foreground'
                  : `${textColor} hover:bg-secondary/10`
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`md:hidden ${textColor}`}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-t p-4 space-y-1 shadow-lg">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                location.pathname === link.to
                  ? 'amber-glow text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
