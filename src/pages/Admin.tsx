
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Car } from '@/utils/types';
import { loadCars, saveCar, deleteCar } from '@/utils/cars';
import { logout } from '@/utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const Admin = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const navigate = useNavigate();
  
  // Form state
  const [formValues, setFormValues] = useState<Partial<Car>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    color: '',
    description: '',
    features: [],
    images: [],
    thumbnail: '',
    category: 'Sedan',
    condition: 'New',
    isFeatured: false,
    inStock: true,
    dateAdded: new Date().toISOString().split('T')[0],
  });
  
  // Track current feature being added
  const [newFeature, setNewFeature] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const loadedCars = await loadCars();
        setCars(loadedCars);
      } catch (error) {
        console.error('Error loading cars:', error);
        toast.error('Failed to load vehicle inventory');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCars();
  }, []);

  const filteredCars = cars.filter((car) => {
    const query = searchQuery.toLowerCase();
    return (
      car.make.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.category.toLowerCase().includes(query) ||
      car.condition.toLowerCase().includes(query)
    );
  });

  const handleAddCar = () => {
    setEditingCar(null);
    setFormValues({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      color: '',
      description: '',
      features: [],
      images: [],
      thumbnail: '',
      category: 'Sedan',
      condition: 'New',
      isFeatured: false,
      inStock: true,
      dateAdded: new Date().toISOString().split('T')[0],
    });
    setShowAddEditModal(true);
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setFormValues({ ...car });
    setShowAddEditModal(true);
  };

  const handleDeleteCar = (car: Car) => {
    setCarToDelete(car);
    setConfirmDeleteInput('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!carToDelete) return;
    
    try {
      setLoading(true);
      const success = await deleteCar(carToDelete.id);
      
      if (success) {
        setCars(cars.filter((car) => car.id !== carToDelete.id));
        toast.success('Vehicle deleted successfully');
      } else {
        toast.error('Failed to delete vehicle');
      }
      
      setShowDeleteModal(false);
      setCarToDelete(null);
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error('Error deleting vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    
    // For number inputs
    if (type === 'number') {
      setFormValues((prev) => ({ ...prev, [name]: parseFloat(value) }));
      return;
    }
    
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    
    setFormValues((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()]
    }));
    
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    
    // Make the first image the thumbnail if not set
    if (!formValues.thumbnail) {
      setFormValues((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImageUrl.trim()],
        thumbnail: newImageUrl.trim()
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImageUrl.trim()]
      }));
    }
    
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    const newImages = formValues.images?.filter((_, i) => i !== index) || [];
    
    // If removed image was the thumbnail, set a new one if available
    if (formValues.images && formValues.images[index] === formValues.thumbnail) {
      setFormValues((prev) => ({
        ...prev,
        images: newImages,
        thumbnail: newImages.length > 0 ? newImages[0] : ''
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        images: newImages
      }));
    }
  };

  const setAsThumbnail = (index: number) => {
    if (formValues.images && formValues.images[index]) {
      setFormValues((prev) => ({
        ...prev,
        thumbnail: prev.images?.[index] || ''
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formValues.make) errors.make = 'Make is required';
    if (!formValues.model) errors.model = 'Model is required';
    if (!formValues.price || formValues.price <= 0) errors.price = 'Valid price is required';
    if (!formValues.description) errors.description = 'Description is required';
    if (!formValues.images || formValues.images.length === 0) errors.images = 'At least one image is required';
    if (!formValues.thumbnail) errors.thumbnail = 'Thumbnail is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const carData = {
        ...formValues,
        id: editingCar?.id || uuidv4(),
      } as Car;
      
      const savedCar = await saveCar(carData);
      
      if (savedCar) {
        // Update the cars list
        if (editingCar) {
          setCars(cars.map(c => c.id === savedCar.id ? savedCar : c));
        } else {
          setCars([...cars, savedCar]);
        }
        
        toast.success(`Vehicle ${editingCar ? 'updated' : 'added'} successfully`);
        setSaveSuccess(true);
        
        setTimeout(() => {
          setSaveSuccess(false);
          setShowAddEditModal(false);
        }, 1500);
      } else {
        toast.error('Failed to save vehicle');
      }
      
    } catch (error) {
      console.error('Error saving car:', error);
      toast.error('Error saving vehicle data');
      setSaveSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-2xl font-bold">Vehicle Inventory Management</h1>
                  <p className="text-muted-foreground">
                    Add, edit and manage your vehicle listings
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={handleAddCar}>
                    Add Vehicle
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Search and filters */}
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by make, model, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Vehicle table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Vehicle</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Details</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    [...Array(5)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded mr-3"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-24 bg-gray-200 rounded"></div>
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            <div className="h-3 w-12 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-8 w-20 bg-gray-200 rounded inline-block"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredCars.length > 0 ? (
                    filteredCars.map((car) => (
                      <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3">
                              <img 
                                src={car.thumbnail} 
                                alt={`${car.make} ${car.model}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{car.make} {car.model}</div>
                              <div className="text-sm text-muted-foreground">{car.year}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>{car.mileage.toLocaleString()} miles</div>
                            <div className="text-muted-foreground">{car.fuelType} • {car.transmission}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatPrice(car.price)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                car.inStock 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {car.inStock ? 'In Stock' : 'Sold'}
                            </span>
                            {car.isFeatured && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/car/${car.id}`)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCar(car)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCar(car)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <div className="text-muted-foreground">
                          {searchQuery 
                            ? 'No vehicles match your search criteria' 
                            : 'No vehicles in inventory'}
                        </div>
                        <Button
                          variant="outline"
                          className="mt-3"
                          onClick={handleAddCar}
                        >
                          Add Your First Vehicle
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Add/Edit Vehicle Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <button 
                onClick={() => setShowAddEditModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Basic Information */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      Basic Information
                    </h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Make
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={formValues.make || ''}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        formErrors.make ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.make && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.make}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formValues.model || ''}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        formErrors.model ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.model && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.model}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formValues.year || new Date().getFullYear()}
                      onChange={handleFormChange}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formValues.color || ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  {/* Pricing and Status */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      Pricing & Status
                    </h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formValues.price || 0}
                      onChange={handleFormChange}
                      min="0"
                      step="100"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        formErrors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Mileage
                    </label>
                    <input
                      type="number"
                      name="mileage"
                      value={formValues.mileage || 0}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formValues.category || 'Sedan'}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Truck">Truck</option>
                      <option value="Sports">Sports</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formValues.condition || 'New'}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Certified Pre-Owned">Certified Pre-Owned</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Fuel Type
                    </label>
                    <select
                      name="fuelType"
                      value={formValues.fuelType || 'Gasoline'}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Gasoline">Gasoline</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Transmission
                    </label>
                    <select
                      name="transmission"
                      value={formValues.transmission || 'Automatic'}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        name="isFeatured"
                        checked={formValues.isFeatured || false}
                        onChange={(e) => setFormValues(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="featured" className="ml-2 text-sm text-gray-900">
                        Featured
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="inStock"
                        name="inStock"
                        checked={formValues.inStock || false}
                        onChange={(e) => setFormValues(prev => ({ ...prev, inStock: e.target.checked }))}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="inStock" className="ml-2 text-sm text-gray-900">
                        In Stock
                      </label>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formValues.description || ''}
                      onChange={handleFormChange}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        formErrors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                    ></textarea>
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                    )}
                  </div>
                  
                  {/* Features */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Vehicle Features</h3>
                    <div className="flex mb-3">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <Button
                        type="button"
                        onClick={addFeature}
                        className="rounded-l-none"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formValues.features && formValues.features.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formValues.features.map((feature, index) => (
                          <div 
                            key={index}
                            className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                          >
                            {feature}
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No features added yet</p>
                    )}
                  </div>
                  
                  {/* Images */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Vehicle Images</h3>
                    
                    <div className={`flex mb-3 ${formErrors.images ? 'border-red-300' : ''}`}>
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Enter image URL..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <Button
                        type="button"
                        onClick={addImage}
                        className="rounded-l-none"
                      >
                        Add Image
                      </Button>
                    </div>
                    
                    {formErrors.images && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.images}</p>
                    )}
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <strong>Note:</strong> In a real application, you would upload images directly. 
                      For this demo, please use image URLs.
                    </div>
                    
                    {formValues.images && formValues.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formValues.images.map((image, index) => (
                          <div 
                            key={index}
                            className={`relative rounded-lg overflow-hidden border ${
                              image === formValues.thumbnail ? 'border-primary border-2' : 'border-gray-200'
                            }`}
                          >
                            <img 
                              src={image} 
                              alt={`Vehicle image ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {image !== formValues.thumbnail && (
                                <Button 
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAsThumbnail(index)}
                                  className="bg-white/80 text-foreground"
                                >
                                  Set as Thumbnail
                                </Button>
                              )}
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeImage(index)}
                                className="bg-white/80 text-red-500"
                              >
                                Remove
                              </Button>
                            </div>
                            {image === formValues.thumbnail && (
                              <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                Thumbnail
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="text-muted-foreground">No images added yet</div>
                      </div>
                    )}
                    
                    {formErrors.thumbnail && (
                      <p className="mt-2 text-sm text-red-500">{formErrors.thumbnail}</p>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-4">
              {saveSuccess && (
                <div className="flex items-center text-green-600 mr-auto">
                  <span>Vehicle saved successfully!</span>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowAddEditModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFormSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingCar ? 'Update Vehicle' : 'Save Vehicle')}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && carToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-4">
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Vehicle</h3>
                <p className="text-muted-foreground mt-1">
                  Are you sure you want to delete <strong>{carToDelete.make} {carToDelete.model}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-1">
                To confirm, type "delete"
              </label>
              <input
                type="text"
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="delete"
              />
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="ghost"
                className="bg-red-500 text-white hover:bg-red-600"
                disabled={confirmDeleteInput !== 'delete' || loading}
                onClick={confirmDelete}
              >
                {loading ? 'Deleting...' : 'Delete Vehicle'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Admin;
