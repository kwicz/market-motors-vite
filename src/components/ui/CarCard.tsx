
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car } from '@/utils/types';

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
    if (car.condition === 'New') return { text: "New Arrival", className: "bg-primary text-primary-foreground" };
    if (car.mileage < 10000) return { text: "Like New", className: "bg-green-600 text-white" };
    if (car.mileage < 30000) return { text: "Low Mileage", className: "bg-blue-600 text-white" };
    return null;
  };

  const carTag = getCarTag();

  return (
    <Link 
      to={`/car/${car.id}`}
      className="group overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gray-200 ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
        <img
          src={car.thumbnail}
          alt={`${car.make} ${car.model}`}
          className={`w-full h-full object-cover transition-transform duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-110' : 'scale-100'}`}
          onLoad={() => setIsLoaded(true)}
        />
        {carTag && (
          <div className={`absolute top-2 left-2 ${carTag.className} px-2 py-1 text-xs font-medium rounded`}>
            {carTag.text}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {car.make} {car.model}
          </h3>
          <p className="text-primary font-bold">
            {formatPrice(car.price)}
          </p>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{car.year} • {car.fuelType} • {car.transmission}</p>
        <p className="text-sm text-foreground line-clamp-2 mb-3">{car.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">
            {car.mileage.toLocaleString()} miles
          </span>
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs">
            {car.category}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
