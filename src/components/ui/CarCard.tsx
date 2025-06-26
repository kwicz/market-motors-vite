import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car } from '@lib/db/schema';
import { formatPrice, formatMileage } from '@lib/utils';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CarCardProps {
  car: Car;
  showActions?: boolean;
  onEdit?: (car: Car) => void;
  onDelete?: (car: Car) => void;
  className?: string;
}

export function CarCard({
  car,
  showActions = false,
  onEdit,
  onDelete,
  className,
}: CarCardProps) {
  return (
    <Card
      className={cn(
        'CarCard',
        'overflow-hidden hover:shadow-lg transition-shadow',
        className
      )}
    >
      <CardHeader className='p-0'>
        <div className='aspect-video relative overflow-hidden'>
          <img
            src={car.thumbnail || '/placeholder-car.jpg'}
            alt={`${car.make} ${car.model}`}
            className='w-full h-full object-cover'
          />
          {car.isFeatured && (
            <Badge variant='vehicle' className='absolute top-2 left-2'>
              Featured
            </Badge>
          )}
          {!car.inStock && (
            <Badge
              variant='outline'
              className='absolute top-2 right-2 bg-red-500 text-white'
            >
              Sold
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='p-4'>
        <div className='space-y-2'>
          <h3 className='font-semibold text-lg'>
            {car.year} {car.make} {car.model}
          </h3>

          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <span>{formatMileage(car.mileage)} miles</span>
            <span>{car.fuelType}</span>
            <span>{car.transmission}</span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-2xl font-bold text-primary'>
              {formatPrice(car.price)}
            </span>
            <Badge variant='outline'>{car.condition}</Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter
        className={cn(
          'p-4 pt-0 gap-2',
          showActions ? 'flex' : 'flex justify-center'
        )}
      >
        <Link
          to={`/car/${car.id}`}
          className={showActions ? 'flex-1' : 'w-full max-w-xs'}
        >
          <Button className='w-full justify-center'>View Details</Button>
        </Link>

        {showActions && (
          <>
            <Button variant='outline' onClick={() => onEdit?.(car)}>
              Edit
            </Button>
            <Button
              variant='outline'
              onClick={() => onDelete?.(car)}
              className='border-red-500 text-red-500 hover:bg-red-50'
            >
              Delete
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default CarCard;
