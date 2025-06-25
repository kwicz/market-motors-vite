
import { Search } from 'lucide-react';

interface InventorySearchProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const InventorySearch = ({ searchQuery, onSearchChange }: InventorySearchProps) => {
  return (
    <section className="bg-gray-900 text-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Our Inventory</h1>
          <p className="text-lg text-gray-300 mb-8">
            Discover our handpicked selection of premium vehicles, each meeting our strict standards for quality and performance.
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by make, model, or keywords..."
              value={searchQuery}
              onChange={onSearchChange}
              className="w-full py-3 px-4 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InventorySearch;
