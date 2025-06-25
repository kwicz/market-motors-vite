
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getCarById } from '@/utils/cars';
import { Car } from '@/utils/types';

const CarDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchCarDetails = async () => {
      if (!id) {
        setError('Invalid vehicle ID');
        setLoading(false);
        return;
      }
      
      try {
        const carData = await getCarById(id);
        if (carData) {
          setCar(carData);
        } else {
          setError('Vehicle not found');
        }
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Error loading vehicle details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCarDetails();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const nextImage = () => {
    if (!car) return;
    setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
  };

  const prevImage = () => {
    if (!car) return;
    setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  const getCarTag = (car: Car) => {
    if (car.condition === 'New') return { text: "New Arrival", className: "bg-primary/10 text-primary" };
    if (car.mileage < 10000) return { text: "Like New", className: "bg-green-600 text-white" };
    if (car.mileage < 30000) return { text: "Low Mileage", className: "bg-blue-600 text-white" };
    return null;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !car) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-lg mx-auto">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-4">{error}</h1>
              <p className="text-muted-foreground mb-6">
                We couldn't find the vehicle you're looking for. It may have been sold or removed from our inventory.
              </p>
              <Link to="/inventory">
                <Button>
                  Back to Inventory
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const carTag = getCarTag(car);

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <span className="mx-2 text-muted-foreground">/</span>
              <Link to="/inventory" className="text-muted-foreground hover:text-primary transition-colors">
                Inventory
              </Link>
              <span className="mx-2 text-muted-foreground">/</span>
              <span className="text-foreground font-medium">
                {car.make} {car.model}
              </span>
            </div>
          </div>
        </div>
        
        {/* Image gallery */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
              <div className="flex h-full transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                {car.images.map((image, index) => (
                  <div key={index} className="w-full h-full flex-shrink-0">
                    <img 
                      src={image} 
                      alt={`${car.make} ${car.model} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {car.images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm text-foreground rounded-full p-2 shadow-md hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm text-foreground rounded-full p-2 shadow-md hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    Next
                  </button>
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {car.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentImageIndex === index 
                            ? 'bg-white scale-110' 
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-muted-foreground"
              >
                Share
              </Button>
            </div>
          </div>
        </section>
        
        {/* Vehicle details */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Details */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <div className="flex flex-wrap items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        {car.year} {car.make} {car.model}
                      </h1>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {carTag && (
                          <span className={`inline-flex items-center rounded-full ${carTag.className} px-2.5 py-0.5 text-xs font-medium`}>
                            {carTag.text}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {car.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {formatPrice(car.price)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Plus taxes
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg text-center">
                      <span className="text-sm text-muted-foreground">Year</span>
                      <span className="font-medium">{car.year}</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg text-center">
                      <span className="text-sm text-muted-foreground">Fuel</span>
                      <span className="font-medium">{car.fuelType}</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg text-center">
                      <span className="text-sm text-muted-foreground">Mileage</span>
                      <span className="font-medium">{car.mileage.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg text-center">
                      <span className="text-sm text-muted-foreground">Trans.</span>
                      <span className="font-medium">{car.transmission}</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <p className="text-muted-foreground">
                      {car.description}
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Features & Options</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                      {car.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-primary mr-2 flex-shrink-0">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - Contact/CTA */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-4">Interested in this vehicle?</h2>
                  <div className="space-y-4 mb-6">
                    <Button className="w-full">Schedule Test Drive</Button>
                    <Link to="/inventory">
                      <Button variant="outline" className="w-full">Browse More Vehicles</Button>
                    </Link>
                    <a href="mailto:info@marketmotors.com">
                      <Button variant="subtle" className="w-full">Contact Us</Button>
                    </a>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-center text-muted-foreground mb-4">
                      Have questions? Contact us directly
                    </p>
                    <a 
                      href="tel:+15551234567" 
                      className="flex items-center justify-center font-semibold text-lg hover:text-primary transition-colors"
                    >
                      (555) 123-4567
                    </a>
                  </div>
                </div>
                
                <div className="bg-primary/5 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">Why choose Market Motors?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0">✓</span>
                      <span className="text-sm">Transparent pricing with no hidden fees</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0">✓</span>
                      <span className="text-sm">Comprehensive vehicle inspection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0">✓</span>
                      <span className="text-sm">Professional and courteous service</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0">✓</span>
                      <span className="text-sm">Trusted by the community since 1985</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default CarDetails;
