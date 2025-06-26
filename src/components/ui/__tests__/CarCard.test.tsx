import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import CarCard from '../CarCard';
import { Car } from '@/utils/types';

// Mock car data for testing
const mockCar: Car = {
  id: '1',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  price: 25000,
  mileage: 15000,
  fuelType: 'Gasoline',
  transmission: 'Automatic',
  condition: 'Used',
  category: 'Sedan',
  description:
    'A reliable and fuel-efficient sedan perfect for daily commuting.',
  thumbnail: 'https://example.com/car-image.jpg',
};

const mockNewCar: Car = {
  ...mockCar,
  id: '2',
  condition: 'New',
  mileage: 0,
};

const mockLowMileageCar: Car = {
  ...mockCar,
  id: '3',
  mileage: 8000,
};

// Wrapper component to provide Router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CarCard Component', () => {
  it('renders car information correctly', () => {
    renderWithRouter(<CarCard car={mockCar} />);

    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('2023 • Gasoline • Automatic')).toBeInTheDocument();
    expect(screen.getByText('15,000 miles')).toBeInTheDocument();
    expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(
      screen.getByText(/A reliable and fuel-efficient sedan/)
    ).toBeInTheDocument();
  });

  it('displays car image with correct alt text', () => {
    renderWithRouter(<CarCard car={mockCar} />);

    const image = screen.getByAltText('Toyota Camry');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockCar.thumbnail);
  });

  it('creates correct link to car detail page', () => {
    renderWithRouter(<CarCard car={mockCar} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/car/1');
  });

  it('shows "New Arrival" tag for new cars', () => {
    renderWithRouter(<CarCard car={mockNewCar} />);

    expect(screen.getByText('New Arrival')).toBeInTheDocument();
    expect(screen.getByText('New Arrival')).toHaveClass('bg-primary');
  });

  it('shows "Like New" tag for cars with very low mileage', () => {
    renderWithRouter(<CarCard car={mockLowMileageCar} />);

    expect(screen.getByText('Like New')).toBeInTheDocument();
    expect(screen.getByText('Like New')).toHaveClass('bg-green-600');
  });

  it('shows "Low Mileage" tag for cars with mileage between 10k-30k', () => {
    const lowMileageCar = { ...mockCar, mileage: 25000 };
    renderWithRouter(<CarCard car={lowMileageCar} />);

    expect(screen.getByText('Low Mileage')).toBeInTheDocument();
    expect(screen.getByText('Low Mileage')).toHaveClass('bg-blue-600');
  });

  it('does not show any tag for high mileage cars', () => {
    const highMileageCar = { ...mockCar, mileage: 50000 };
    renderWithRouter(<CarCard car={highMileageCar} />);

    expect(screen.queryByText('New Arrival')).not.toBeInTheDocument();
    expect(screen.queryByText('Like New')).not.toBeInTheDocument();
    expect(screen.queryByText('Low Mileage')).not.toBeInTheDocument();
  });

  it('handles image loading states correctly', () => {
    renderWithRouter(<CarCard car={mockCar} />);

    const image = screen.getByAltText('Toyota Camry');

    // Initially image should have opacity-0 (not loaded)
    expect(image).toHaveClass('opacity-0');

    // Simulate image load
    fireEvent.load(image);

    // After loading, image should have opacity-100
    expect(image).toHaveClass('opacity-100');
  });

  it('applies hover effects correctly', () => {
    renderWithRouter(<CarCard car={mockCar} />);

    const cardLink = screen.getByRole('link');
    const image = screen.getByAltText('Toyota Camry');

    // Initially no scale transform
    expect(image).toHaveClass('scale-100');

    // Hover over the card
    fireEvent.mouseEnter(cardLink);

    // Should apply scale transform on hover
    expect(image).toHaveClass('scale-110');

    // Mouse leave
    fireEvent.mouseLeave(cardLink);

    // Should return to normal scale
    expect(image).toHaveClass('scale-100');
  });

  it('formats price correctly', () => {
    const expensiveCar = { ...mockCar, price: 1234567 };
    renderWithRouter(<CarCard car={expensiveCar} />);

    expect(screen.getByText('$1,234,567')).toBeInTheDocument();
  });

  it('formats mileage correctly with commas', () => {
    const highMileageCar = { ...mockCar, mileage: 123456 };
    renderWithRouter(<CarCard car={highMileageCar} />);

    expect(screen.getByText('123,456 miles')).toBeInTheDocument();
  });

  it('handles missing thumbnail gracefully', () => {
    const carWithoutThumbnail = { ...mockCar, thumbnail: undefined };
    renderWithRouter(<CarCard car={carWithoutThumbnail} />);

    const image = screen.getByAltText('Toyota Camry');
    expect(image).toBeInTheDocument();
  });

  it('displays all car specifications', () => {
    renderWithRouter(<CarCard car={mockCar} />);

    // Check that year, fuel type, and transmission are all displayed
    const specs = screen.getByText('2023 • Gasoline • Automatic');
    expect(specs).toBeInTheDocument();
  });

  it('truncates long descriptions properly', () => {
    const carWithLongDescription = {
      ...mockCar,
      description:
        'This is a very long description that should be truncated because it exceeds the typical length that we want to display in the car card component and should show ellipsis.',
    };

    renderWithRouter(<CarCard car={carWithLongDescription} />);

    const description = screen.getByText(/This is a very long description/);
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('line-clamp-2');
  });
});
