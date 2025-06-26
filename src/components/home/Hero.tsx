import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HeroImage } from '@/components/ui/OptimizedImage';

const slides = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
    title: 'Find Your Perfect Vehicle',
    subtitle:
      'Discover quality pre-owned cars with confidence and peace of mind.',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
    title: 'Quality You Can Trust',
    subtitle:
      'Every vehicle is thoroughly inspected and comes with our warranty.',
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
    title: 'Competitive Financing',
    subtitle: 'Get pre-approved with competitive rates and flexible terms.',
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(
    slides.map(() => false)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (imagesLoaded.every((loaded) => loaded)) {
      setLoading(false);
    }
  }, [imagesLoaded]);

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className='relative h-screen min-h-[600px] overflow-hidden'>
      {/* Loading overlay */}
      {loading && (
        <div className='absolute inset-0 bg-market-background flex items-center justify-center z-10'>
          <div className='w-12 h-12 rounded-full border-4 border-market-accent border-t-transparent animate-spin'></div>
        </div>
      )}

      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <HeroImage
            src={slide.image}
            alt={slide.title}
            className='w-full h-full'
            priority={index === 0} // Prioritize first slide
            onLoad={() => handleImageLoad(index)}
          />
          <div className='absolute inset-0 bg-gradient-to-r from-market-text/60 to-market-text/30' />
        </div>
      ))}

      {/* Content */}
      <div className='absolute inset-0 flex flex-col justify-center items-start px-4 sm:px-6 lg:px-8 container mx-auto'>
        <div className='max-w-xl'>
          <span className='inline-block py-1 px-3 bg-market-yellow text-market-text rounded-full text-sm font-medium mb-4 animate-fade-in'>
            Welcome to Market Motors
          </span>

          <h1
            className='text-4xl md:text-5xl lg:text-6xl font-clarendon text-white mb-4 leading-tight animate-fade-in'
            style={{ animationDelay: '200ms' }}
          >
            {slides[currentSlide].title}
          </h1>

          <p
            className='text-xl text-white/90 mb-8 animate-fade-in'
            style={{ animationDelay: '400ms' }}
          >
            {slides[currentSlide].subtitle}
          </p>

          <div
            className='flex flex-col sm:flex-row gap-4 animate-fade-in'
            style={{ animationDelay: '600ms' }}
          >
            <Link to='/inventory'>
              <Button
                size='lg'
                className='bg-market-accent hover:bg-market-accent/90 text-white'
              >
                Browse Inventory
              </Button>
            </Link>
            <Button
              variant='outline'
              size='lg'
              className='border-white/30 text-white hover:bg-white/20'
              onClick={scrollToContact}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className='absolute bottom-8 left-0 right-0 flex justify-center space-x-2'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentSlide === index
                ? 'bg-market-yellow scale-110'
                : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
