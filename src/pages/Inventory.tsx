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
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [sortOption, setSortOption] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMake, setSelectedMake] = useState('');
  const [mileageRange, setMileageRange] = useState<[number, number]>([
    0, 200000,
  ]);
  const [yearRange, setYearRange] = useState<[number, number]>([
    1990,
    new Date().getFullYear() + 1,
  ]);
  const [transmission, setTransmission] = useState<string[]>([]);

  const categories = ['All', 'Sedan', 'SUV', 'Sports', 'Luxury', 'Electric'];

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCars = async () => {
      try {
        const allCars = await loadCars();
        setCars(allCars);
      } catch (error) {
        console.error('Error loading cars:', error);
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
        result = result.filter((car) => car.category === selectedCategory);
      }

      // Apply make filter
      if (selectedMake) {
        result = result.filter((car) => car.make === selectedMake);
      }

      // Apply price range filter
      result = result.filter((car) => {
        const price =
          typeof car.price === 'string' ? parseFloat(car.price) : car.price;
        return price >= priceRange[0] && price <= priceRange[1];
      });

      // Apply mileage range filter
      result = result.filter(
        (car) =>
          car.mileage >= mileageRange[0] && car.mileage <= mileageRange[1]
      );

      // Apply year range filter
      result = result.filter(
        (car) => car.year >= yearRange[0] && car.year <= yearRange[1]
      );

      // Apply transmission filter
      if (transmission.length > 0) {
        result = result.filter((car) =>
          transmission.includes(car.transmission)
        );
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (car) =>
            car.make.toLowerCase().includes(query) ||
            car.model.toLowerCase().includes(query) ||
            `${car.make} ${car.model}`.toLowerCase().includes(query) ||
            car.description.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (sortOption === 'newest') {
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortOption === 'priceAsc') {
        result.sort((a, b) => {
          const priceA =
            typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const priceB =
            typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return priceA - priceB;
        });
      } else if (sortOption === 'priceDesc') {
        result.sort((a, b) => {
          const priceA =
            typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const priceB =
            typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return priceB - priceA;
        });
      }

      setFilteredCars(result);
    }
  }, [
    cars,
    selectedCategory,
    selectedMake,
    sortOption,
    priceRange,
    mileageRange,
    yearRange,
    transmission,
    searchQuery,
  ]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleMakeChange = (make: string) => setSelectedMake(make);
  const handleMileageChange = (range: [number, number]) =>
    setMileageRange(range);
  const handleYearChange = (range: [number, number]) => setYearRange(range);
  const handleTransmissionChange = (type: string) => {
    setTransmission((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedMake('');
    setPriceRange([0, 200000]);
    setMileageRange([0, 200000]);
    setYearRange([1990, new Date().getFullYear() + 1]);
    setTransmission([]);
    setSearchQuery('');
    setSortOption('newest');
  };

  const makes = Array.from(new Set(cars.map((car) => car.make))).sort();

  return (
    <>
      <Navbar />
      <main className='pt-16 min-h-screen'>
        {/* Hero section with search */}
        <InventorySearch
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {/* Filters and results */}
        <section className='py-16 bg-gray-50'>
          <div className='container mx-auto px-4'>
            <div className='lg:grid lg:grid-cols-4 lg:gap-8'>
              {/* Mobile filter toggle */}
              <MobileFilterToggle
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
              />

              {/* Filters sidebar */}
              <div
                className={`${
                  showFilters ? 'block' : 'hidden'
                } lg:block lg:col-span-1`}
              >
                <FilterSidebar
                  categories={categories}
                  makes={makes}
                  selectedMake={selectedMake}
                  selectedCategory={selectedCategory}
                  priceRange={priceRange}
                  mileageRange={mileageRange}
                  yearRange={yearRange}
                  transmission={transmission}
                  onCategoryChange={handleCategoryClick}
                  onMakeChange={handleMakeChange}
                  onPriceChange={handlePriceChange}
                  onMileageChange={handleMileageChange}
                  onYearChange={handleYearChange}
                  onTransmissionChange={handleTransmissionChange}
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
