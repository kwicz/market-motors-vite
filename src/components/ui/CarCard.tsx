import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car } from '@/utils/types';
import { CarThumbnail } from './OptimizedImage';

interface CarCardProps {
  car: Car;
}

const CarCard = ({ car }: CarCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Determine tag to show based on priority
  const getCarTag = () => {
    if (car.condition === 'New')
      return {
        text: 'New Arrival',
        className: 'bg-primary text-primary-foreground',
      };
    if (car.mileage < 10000)
      return { text: 'Like New', className: 'bg-green-600 text-white' };
    if (car.mileage < 30000)
      return { text: 'Low Mileage', className: 'bg-blue-600 text-white' };
    return null;
  };

  const carTag = getCarTag();

  // Fallback thumbnail if not provided
  const thumbnailSrc = car.thumbnail || '/placeholder-car.jpg';

  return (
    <Link
      to={`/car/${car.id}`}
      className='group overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='relative aspect-[16/9] overflow-hidden'>
        <CarThumbnail
          src={thumbnailSrc}
          alt={`${car.make} ${car.model}`}
          className={`transition-transform duration-700 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
        {carTag && (
          <div
            className={`absolute top-2 left-2 ${carTag.className} px-2 py-1 text-xs font-medium rounded z-10`}
          >
            {carTag.text}
          </div>
        )}
      </div>
      <div className='p-4'>
        <div className='flex justify-between items-start mb-2'>
          <h3 className='text-lg font-semibold text-gray-900 line-clamp-1'>
            {car.year} {car.make} {car.model}
          </h3>
          <span className='text-xl font-bold text-primary'>
            {formatPrice(car.price)}
          </span>
        </div>

        <div className='space-y-1 text-sm text-gray-600'>
          <div className='flex justify-between'>
            <span>Mileage:</span>
            <span>{car.mileage.toLocaleString()} mi</span>
          </div>
          <div className='flex justify-between'>
            <span>Transmission:</span>
            <span>{car.transmission}</span>
          </div>
          <div className='flex justify-between'>
            <span>Fuel Type:</span>
            <span>{car.fuelType}</span>
          </div>
          <div className='flex justify-between'>
            <span>Condition:</span>
            <span className='capitalize'>{car.condition}</span>
          </div>
        </div>

        <div className='mt-3 pt-3 border-t border-gray-100'>
          <p className='text-sm text-gray-600 line-clamp-2'>
            {car.description}
          </p>
          <div className='mt-2'>
            <span className='inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded'>
              {car.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
