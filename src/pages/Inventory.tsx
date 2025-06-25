
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Car } from '@/utils/types';
import { loadCars } from '@/utils/cars';
import InventorySearch from '@/components/inventory/InventorySearch';
import FilterSidebar from '@/components/inventory/FilterSidebar';
import InventoryResults from '@/components/inventory/InventoryResults';
import MobileFilterToggle from '@/components/inventory/MobileFilterToggle';

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortOption, setSortOption] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Sedan', 'SUV', 'Sports', 'Luxury', 'Electric'];
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchCars = async () => {
      try {
        const allCars = await loadCars();
        setCars(allCars);
      } catch (error) {
        console.error("Error loading cars:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCars();
    
    // Initialize from URL params
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setSearchParams({ category: selectedCategory });
    }
  }, [selectedCategory, setSearchParams]);

  useEffect(() => {
    if (cars.length) {
      let result = [...cars];
      
      // Apply category filter
      if (selectedCategory !== 'All') {
        result = result.filter(car => car.category === selectedCategory);
      }
      
      // Apply price range filter
      result = result.filter(car => car.price >= priceRange[0] && car.price <= priceRange[1]);
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(car => 
          car.make.toLowerCase().includes(query) || 
          car.model.toLowerCase().includes(query) || 
          `${car.make} ${car.model}`.toLowerCase().includes(query) ||
          car.description.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      if (sortOption === 'newest') {
        result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
      } else if (sortOption === 'priceAsc') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortOption === 'priceDesc') {
        result.sort((a, b) => b.price - a.price);
      }
      
      setFilteredCars(result);
    }
  }, [cars, selectedCategory, sortOption, priceRange, searchQuery]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = parseInt(event.target.value);
    setPriceRange(prev => {
      const newRange = [...prev] as [number, number];
      newRange[index] = newValue;
      return newRange;
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setPriceRange([0, 200000]);
    setSearchQuery('');
    setSortOption('newest');
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        {/* Hero section with search */}
        <InventorySearch 
          searchQuery={searchQuery} 
          onSearchChange={handleSearchChange} 
        />
        
        {/* Filters and results */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="lg:grid lg:grid-cols-4 lg:gap-8">
              {/* Mobile filter toggle */}
              <MobileFilterToggle 
                showFilters={showFilters} 
                onToggleFilters={() => setShowFilters(!showFilters)} 
              />
              
              {/* Filters sidebar */}
              <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                <FilterSidebar 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  priceRange={priceRange}
                  onCategoryChange={handleCategoryClick}
                  onPriceChange={handlePriceChange}
                  onResetFilters={resetFilters}
                />
              </div>
              
              {/* Results */}
              <InventoryResults 
                filteredCars={filteredCars}
                loading={loading}
                sortOption={sortOption}
                onSortChange={setSortOption}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                priceRange={priceRange}
                onCategoryReset={() => setSelectedCategory('All')}
                onSearchReset={() => setSearchQuery('')}
                onPriceReset={() => setPriceRange([0, 200000])}
                onResetAllFilters={resetFilters}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Inventory;
