import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isLoggedIn, logout } from '../../utils/auth';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { siteConfig } from '@/siteConfig';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const location = useLocation();
  const loggedIn = isLoggedIn();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const scrollToContact = () => {
    if (location.pathname !== '/') {
      // Redirect to home page first, then scroll after page loads
      window.location.href = '/#contact';
    } else {
      // If already on home page, just scroll to the contact section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      closeMenu();
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Contact Us', path: '#', action: scrollToContact },
  ];

  return (
    <header className='Navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 bg-white shadow-sm'>
      <div className='container mx-auto px-4 md:px-6'>
        <div className='flex items-center justify-between'>
          <Link
            to='/'
            className='flex items-center text-2xl font-bold tracking-tighter text-primary hover:text-primary/90'
            onClick={closeMenu}
          >
            <img
              src={siteConfig.styles.logos.bigLogo}
              alt={siteConfig.siteName + ' logo'}
              className='h-10 w-auto mr-2 hidden sm:block'
              style={{ maxHeight: 40 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className='sm:hidden'>
              <span className='text-market-accent'>
                {siteConfig.siteName.split(' ')[0]}
              </span>{' '}
              {siteConfig.siteName.split(' ').slice(1).join(' ')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-8'>
            {navLinks.map((link) =>
              link.action ? (
                <button
                  key={link.name}
                  onClick={link.action}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  )}
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  )}
                >
                  {link.name}
                </Link>
              )
            )}

            {loggedIn ? (
              <div className='relative'>
                <Button
                  variant='ghost'
                  className='flex items-center space-x-1'
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                >
                  Admin
                </Button>

                {adminDropdownOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 animate-fade-in'>
                    <Link
                      to='/admin'
                      className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      onClick={() => setAdminDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className='md:hidden focus:outline-none'
            onClick={toggleMenu}
            aria-label='Toggle menu'
          >
            {isOpen ? (
              <span className='text-foreground'>Close</span>
            ) : (
              <span className='text-foreground'>Menu</span>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className='md:hidden absolute top-16 inset-x-0 bg-white/95 backdrop-blur-md shadow-lg rounded-b-lg animate-fade-in'>
            <div className='px-4 py-5 space-y-4'>
              {navLinks.map((link) =>
                link.action ? (
                  <button
                    key={link.name}
                    onClick={link.action}
                    className='block text-base font-medium transition-colors hover:text-primary text-foreground w-full text-left'
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'block text-base font-medium transition-colors hover:text-primary',
                      location.pathname === link.path
                        ? 'text-primary'
                        : 'text-foreground'
                    )}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </Link>
                )
              )}

              {loggedIn ? (
                <>
                  <Link
                    to='/admin'
                    className='block text-base font-medium transition-colors hover:text-primary'
                    onClick={closeMenu}
                  >
                    Admin Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block text-base font-medium text-left transition-colors hover:text-primary'
                  >
                    Sign out
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
