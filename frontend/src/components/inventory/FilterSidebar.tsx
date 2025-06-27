import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface FilterSidebarProps {
  categories: string[];
  makes: string[];
  selectedMake: string;
  selectedCategory: string;
  priceRange: [number, number];
  mileageRange: [number, number];
  yearRange: [number, number];
  transmission: string[];
  onCategoryChange: (category: string) => void;
  onMakeChange: (make: string) => void;
  onPriceChange: (values: [number, number]) => void;
  onMileageChange: (values: [number, number]) => void;
  onYearChange: (values: [number, number]) => void;
  onTransmissionChange: (value: string) => void;
  onResetFilters: () => void;
}

const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'CVT'];

const FilterSidebar = ({
  categories,
  makes,
  selectedMake,
  selectedCategory,
  priceRange,
  mileageRange,
  yearRange,
  transmission,
  onCategoryChange,
  onMakeChange,
  onPriceChange,
  onMileageChange,
  onYearChange,
  onTransmissionChange,
  onResetFilters,
}: FilterSidebarProps) => {
  return (
    <div className='FilterSidebar bg-white rounded-lg shadow-sm p-6 sticky top-24 font-inter'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-lg font-bold'>Filters</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={onResetFilters}
          className='h-auto p-0 text-muted-foreground hover:text-foreground'
        >
          Reset
        </Button>
      </div>

      {/* Category filter */}
      <div className='mb-8'>
        <h3 className='text-sm font-medium mb-3'>Category</h3>
        <div className='space-y-2'>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Make filter */}
      <div className='mb-8'>
        <h3 className='text-sm font-medium mb-3'>Make</h3>
        <select
          value={selectedMake}
          onChange={(e) => onMakeChange(e.target.value)}
          className='w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary'
        >
          <option value=''>All Makes</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </div>

      {/* Price range filter */}
      <div className='mb-8'>
        <h3 className='text-sm font-medium mb-3'>Price Range</h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>
              ${priceRange[0].toLocaleString()}
            </span>
            <span className='text-sm text-muted-foreground'>
              ${priceRange[1].toLocaleString()}
            </span>
          </div>
          <Slider
            min={0}
            max={200000}
            step={10000}
            value={priceRange}
            onValueChange={(values: number[]) =>
              onPriceChange([values[0], values[1]])
            }
            className='w-full'
          />
        </div>
      </div>

      {/* Mileage range filter */}
      <div className='mb-8'>
        <h3 className='text-sm font-medium mb-3'>Mileage Range</h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>
              {mileageRange[0].toLocaleString()} mi
            </span>
            <span className='text-sm text-muted-foreground'>
              {mileageRange[1].toLocaleString()} mi
            </span>
          </div>
          <Slider
            min={0}
            max={200000}
            step={5000}
            value={mileageRange}
            onValueChange={(values: number[]) =>
              onMileageChange([values[0], values[1]])
            }
            className='w-full'
          />
        </div>
      </div>

      {/* Year range filter */}
      <div className='mb-8'>
        <h3 className='text-sm font-medium mb-3'>Year Range</h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>
              {yearRange[0]}
            </span>
            <span className='text-sm text-muted-foreground'>
              {yearRange[1]}
            </span>
          </div>
          <Slider
            min={1990}
            max={new Date().getFullYear() + 1}
            step={1}
            value={yearRange}
            onValueChange={(values: number[]) =>
              onYearChange([values[0], values[1]])
            }
            className='w-full'
          />
        </div>
      </div>

      {/* Transmission filter */}
      <div className='mb-8'>
        <h3 className='text-sm font-medium mb-3'>Transmission</h3>
        <div className='space-y-2'>
          {TRANSMISSION_TYPES.map((type) => (
            <label key={type} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={transmission.includes(type)}
                onChange={() => onTransmissionChange(type)}
                className='accent-primary h-4 w-4 rounded border-gray-300'
              />
              {type}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
