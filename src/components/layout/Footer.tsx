
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-market-background border-t border-market-accent/20 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-clarendon tracking-tighter">
              <span className="text-market-accent">Market</span> Motors
            </Link>
            <p className="text-market-text/80 max-w-xs">
              Market Motors is a family-owned used car dealership dedicated to providing 
              quality vehicles, honest service, and peace of mind with every purchase.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-clarendon text-market-text mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-market-text/70 hover:text-market-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/inventory" className="text-market-text/70 hover:text-market-accent transition-colors">
                  Inventory
                </Link>
              </li>
              <li>
                <a href="#about" className="text-market-text/70 hover:text-market-accent transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-market-text/70 hover:text-market-accent transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-clarendon text-market-text mb-4">Vehicle Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/inventory?category=Sedan" className="text-market-text/70 hover:text-market-accent transition-colors">
                  Sedans
                </Link>
              </li>
              <li>
                <Link to="/inventory?category=SUV" className="text-market-text/70 hover:text-market-accent transition-colors">
                  SUVs
                </Link>
              </li>
              <li>
                <Link to="/inventory?category=Truck" className="text-market-text/70 hover:text-market-accent transition-colors">
                  Trucks
                </Link>
              </li>
              <li>
                <Link to="/inventory?category=Economy" className="text-market-text/70 hover:text-market-accent transition-colors">
                  Economy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-clarendon text-market-text mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 text-market-accent mt-1 flex-shrink-0" />
                <span className="text-market-text/70">
                  123 Market Street, Hometown, HT 12345
                </span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-market-accent flex-shrink-0" />
                <span className="text-market-text/70">(555) 234-5678</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-market-accent flex-shrink-0" />
                <span className="text-market-text/70">info@marketmotors.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-market-accent/10 mt-12 pt-8 text-center text-sm text-market-text/60">
          <p>© {new Date().getFullYear()} Market Motors. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-market-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-market-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
