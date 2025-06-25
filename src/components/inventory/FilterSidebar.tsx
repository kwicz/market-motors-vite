
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
  categories: string[];
  selectedCategory: string;
  priceRange: [number, number];
  onCategoryChange: (category: string) => void;
  onPriceChange: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onResetFilters: () => void;
}

const FilterSidebar = ({
  categories,
  selectedCategory,
  priceRange,
  onCategoryChange,
  onPriceChange,
  onResetFilters,
}: FilterSidebarProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Filters</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onResetFilters}
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
        >
          Reset
        </Button>
      </div>
      
      {/* Category filter */}
      <div className="mb-8">
        <h3 className="text-sm font-medium mb-3">Category</h3>
        <div className="space-y-2">
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
      
      {/* Price range filter */}
      <div className="mb-8">
        <h3 className="text-sm font-medium mb-3">Price Range</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              ${priceRange[0].toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              ${priceRange[1].toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200000"
            step="10000"
            value={priceRange[0]}
            onChange={(e) => onPriceChange(e, 0)}
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="200000"
            step="10000"
            value={priceRange[1]}
            onChange={(e) => onPriceChange(e, 1)}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Additional filters could be added here */}
    </div>
  );
};

export default FilterSidebar;
