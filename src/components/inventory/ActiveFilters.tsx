import { X } from 'lucide-react';

interface ActiveFiltersProps {
  selectedCategory: string;
  searchQuery: string;
  priceRange: [number, number];
  onCategoryReset: () => void;
  onSearchReset: () => void;
  onPriceReset: () => void;
}

const ActiveFilters = ({
  selectedCategory,
  searchQuery,
  priceRange,
  onCategoryReset,
  onSearchReset,
  onPriceReset,
}: ActiveFiltersProps) => {
  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery ||
    priceRange[0] > 0 ||
    priceRange[1] < 200000;

  if (!hasActiveFilters) return null;

  return (
    <div className='ActiveFilters mb-6 flex flex-wrap gap-2'>
      {selectedCategory !== 'All' && (
        <div className='inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm'>
          Category: {selectedCategory}
          <button
            onClick={onCategoryReset}
            className='ml-1 text-gray-500 hover:text-gray-700'
          >
            <X size={14} />
          </button>
        </div>
      )}
      {searchQuery && (
        <div className='inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm'>
          Search: {searchQuery}
          <button
            onClick={onSearchReset}
            className='ml-1 text-gray-500 hover:text-gray-700'
          >
            <X size={14} />
          </button>
        </div>
      )}
      {(priceRange[0] > 0 || priceRange[1] < 200000) && (
        <div className='inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm'>
          Price: ${priceRange[0].toLocaleString()} - $
          {priceRange[1].toLocaleString()}
          <button
            onClick={onPriceReset}
            className='ml-1 text-gray-500 hover:text-gray-700'
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveFilters;
