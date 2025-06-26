import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFeaturedCars } from '@/utils/cars';
import { Car } from '@/utils/types';
import CarCard from '../ui/CarCard';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

const FeaturedCars = () => {
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const carsToShow = isMobile ? 3 : 4;

  useEffect(() => {
    const fetchFeaturedCars = async () => {
      try {
        const cars = await getFeaturedCars();
        setFeaturedCars(cars.slice(0, 8));
      } catch (error) {
        console.error('Error fetching featured cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCars();
  }, []);

  return (
    <section className='py-20 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-wrap items-end justify-between mb-12'>
          <div className='w-full lg:w-1/2 mb-6 lg:mb-0'>
            <span className='inline-block text-sm font-medium text-primary mb-2'>
              Featured Vehicles
            </span>
            <h2 className='text-3xl md:text-4xl font-bold'>
              Exceptional Cars for Discerning Drivers
            </h2>
          </div>
          <div className='w-full lg:w-auto'>
            <Link
              to='/inventory'
              className='inline-flex items-center text-primary font-medium hover:underline transition-all'
            >
              View all inventory
              <ArrowRight size={16} className='ml-1' />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
            {[...Array(carsToShow)].map((_, index) => (
              <div
                key={index}
                className='bg-white rounded-lg shadow-md overflow-hidden'
              >
                <div className='aspect-[16/9] bg-gray-200 animate-pulse'></div>
                <div className='p-4 space-y-3'>
                  <div className='h-6 bg-gray-200 rounded animate-pulse'></div>
                  <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
                  <div className='h-4 bg-gray-200 rounded animate-pulse'></div>
                  <div className='h-4 bg-gray-200 rounded w-1/2 animate-pulse'></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Carousel className='w-full px-12'>
            <CarouselContent className='-ml-4'>
              {featuredCars.map((car) => (
                <CarouselItem
                  key={car.id}
                  className='pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4'
                >
                  <div className='animate-slide-up'>
                    <CarCard car={car} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className='hidden md:block'>
              <CarouselPrevious className='left-0'>
                <ChevronLeft className='h-4 w-4' />
              </CarouselPrevious>
              <CarouselNext className='right-0'>
                <ChevronRight className='h-4 w-4' />
              </CarouselNext>
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default FeaturedCars;
