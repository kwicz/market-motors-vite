import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CarCard from '@/components/ui/CarCard';
import { Car } from '@/utils/types';
import ActiveFilters from './ActiveFilters';

interface InventoryResultsProps {
  filteredCars: Car[];
  loading: boolean;
  sortOption: string;
  onSortChange: (value: string) => void;
  selectedCategory: string;
  searchQuery: string;
  priceRange: [number, number];
  onCategoryReset: () => void;
  onSearchReset: () => void;
  onPriceReset: () => void;
  onResetAllFilters: () => void;
}

const InventoryResults = ({
  filteredCars,
  loading,
  sortOption,
  onSortChange,
  selectedCategory,
  searchQuery,
  priceRange,
  onCategoryReset,
  onSearchReset,
  onPriceReset,
  onResetAllFilters,
}: InventoryResultsProps) => {
  return (
    <div className='InventoryResults lg:col-span-3'>
      {/* Sort and results count */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6'>
        <p className='text-muted-foreground mb-4 sm:mb-0'>
          Showing{' '}
          <span className='font-medium text-foreground'>
            {filteredCars.length}
          </span>{' '}
          vehicles
        </p>

        <div className='relative'>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className='appearance-none bg-white px-4 py-2 pr-8 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
          >
            <option value='newest'>Newest Arrivals</option>
            <option value='priceAsc'>Price: Low to High</option>
            <option value='priceDesc'>Price: High to Low</option>
          </select>
          <ChevronDown
            size={16}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground'
          />
        </div>
      </div>

      {/* Active filters */}
      <ActiveFilters
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        priceRange={priceRange}
        onCategoryReset={onCategoryReset}
        onSearchReset={onSearchReset}
        onPriceReset={onPriceReset}
      />

      {/* Cars grid */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, index) => (
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
      ) : filteredCars.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredCars.map((car, index) => (
            <div
              key={car.id}
              className='animate-fade-in'
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CarCard car={car} />
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='48'
            height='48'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mx-auto text-muted-foreground mb-4'
          >
            <circle cx='11' cy='11' r='8'></circle>
            <path d='m21 21-4.3-4.3'></path>
          </svg>
          <h3 className='text-lg font-semibold mb-2'>No results found</h3>
          <p className='text-muted-foreground max-w-md mx-auto mb-6'>
            We couldn't find any vehicles matching your current filters. Try
            adjusting your search criteria.
          </p>
          <div className='flex justify-center'>
            <Button onClick={onResetAllFilters}>Reset Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryResults;
