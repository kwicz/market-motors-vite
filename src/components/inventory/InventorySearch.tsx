import { Search } from 'lucide-react';
import { siteConfig } from '@/siteConfig';

interface InventorySearchProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const InventorySearch = ({
  searchQuery,
  onSearchChange,
}: InventorySearchProps) => {
  return (
    <section
      className={['InventorySearch', 'py-16 md:py-24'].join(' ')}
      style={{
        background: siteConfig.styles.colors.accent,
        color: '#fff',
      }}
    >
      <div className='container mx-auto px-4'>
        <div className='max-w-3xl'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 text-white'>
            Explore Our Inventory
          </h1>
          <p className='text-lg mb-8 text-white'>
            Discover our handpicked selection of premium vehicles, each meeting
            our strict standards for quality and performance.
          </p>
          <div className='relative'>
            <input
              type='text'
              placeholder='Search by make, model, or keywords...'
              value={searchQuery}
              onChange={onSearchChange}
              className='w-full py-3 px-4 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent'
            />
            <Search
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70'
              size={20}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InventorySearch;
