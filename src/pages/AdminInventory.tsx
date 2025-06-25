import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Car,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Package,
  StarOff,
  PackageX,
  MoreHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  loadCars,
  deleteCar,
  performBulkOperation,
  BulkOperationData,
} from '@/utils/cars';
import { Car as CarType } from '../../lib/db/schema';
import { toast } from 'sonner';

const AdminInventory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<CarType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [carToDelete, setCarToDelete] = useState<CarType | null>(null);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<string>('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState<Record<string, unknown>>(
    {}
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const loadedCars = await loadCars();
        setCars(loadedCars);
      } catch (error) {
        console.error('Error loading cars:', error);
        toast.error('Failed to load vehicles');
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const handleDeleteCar = async (car: CarType) => {
    setIsDeleting(true);
    try {
      await deleteCar(car.id);
      setCars(cars.filter((c) => c.id !== car.id));
      setCarToDelete(null);
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error('Failed to delete vehicle');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectCar = (carId: string) => {
    setSelectedCars((prev) =>
      prev.includes(carId)
        ? prev.filter((id) => id !== carId)
        : [...prev, carId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCars.length === filteredCars.length) {
      setSelectedCars([]);
    } else {
      setSelectedCars(filteredCars.map((car) => car.id));
    }
  };

  const handleBulkOperation = async () => {
    if (!bulkOperation || selectedCars.length === 0) return;

    setIsBulkOperating(true);
    try {
      const operationData: BulkOperationData = {
        carIds: selectedCars,
        operation: bulkOperation as BulkOperationData['operation'],
        ...(bulkOperation === 'update' && { updateData: bulkUpdateData }),
      };

      const result = await performBulkOperation(operationData);

      // Update local state based on operation
      switch (bulkOperation) {
        case 'delete':
          setCars(cars.filter((car) => !selectedCars.includes(car.id)));
          break;
        case 'feature':
          setCars(
            cars.map((car) =>
              selectedCars.includes(car.id) ? { ...car, isFeatured: true } : car
            )
          );
          break;
        case 'unfeature':
          setCars(
            cars.map((car) =>
              selectedCars.includes(car.id)
                ? { ...car, isFeatured: false }
                : car
            )
          );
          break;
        case 'stock':
          setCars(
            cars.map((car) =>
              selectedCars.includes(car.id) ? { ...car, inStock: true } : car
            )
          );
          break;
        case 'unstock':
          setCars(
            cars.map((car) =>
              selectedCars.includes(car.id) ? { ...car, inStock: false } : car
            )
          );
          break;
        case 'update':
          setCars(
            cars.map((car) =>
              selectedCars.includes(car.id)
                ? { ...car, ...bulkUpdateData }
                : car
            )
          );
          break;
      }

      setSelectedCars([]);
      setShowBulkDialog(false);
      setBulkOperation('');
      setBulkUpdateData({});

      toast.success(
        `Successfully ${bulkOperation}d ${result.affectedCount} vehicles`
      );
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('Failed to perform bulk operation');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const getBulkOperationLabel = (operation: string) => {
    switch (operation) {
      case 'delete':
        return 'Delete Selected';
      case 'feature':
        return 'Mark as Featured';
      case 'unfeature':
        return 'Remove Featured';
      case 'stock':
        return 'Mark In Stock';
      case 'unstock':
        return 'Mark Out of Stock';
      case 'update':
        return 'Update Selected';
      default:
        return operation;
    }
  };

  const getBulkOperationDescription = (operation: string, count: number) => {
    switch (operation) {
      case 'delete':
        return `Are you sure you want to delete ${count} selected vehicles? This action cannot be undone.`;
      case 'feature':
        return `Mark ${count} selected vehicles as featured? Featured vehicles will be displayed prominently on the homepage.`;
      case 'unfeature':
        return `Remove featured status from ${count} selected vehicles?`;
      case 'stock':
        return `Mark ${count} selected vehicles as in stock?`;
      case 'unstock':
        return `Mark ${count} selected vehicles as out of stock?`;
      case 'update':
        return `Update ${count} selected vehicles with the specified changes?`;
      default:
        return `Perform ${operation} on ${count} selected vehicles?`;
    }
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'certified pre-owned':
      case 'certified':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Vehicle Inventory</h1>
            <p className='text-gray-600 mt-1'>
              Manage your vehicle inventory ({filteredCars.length} vehicles)
            </p>
          </div>
          <Button onClick={() => navigate('/admin/add-vehicle')}>
            <Plus className='h-4 w-4 mr-2' />
            Add Vehicle
          </Button>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between space-x-4'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Search vehicles...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
              <div className='flex items-center space-x-2'>
                <Button variant='outline' size='sm' onClick={handleSelectAll}>
                  {selectedCars.length === filteredCars.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                {selectedCars.length > 0 && (
                  <Badge variant='secondary'>
                    {selectedCars.length} selected
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Operations Toolbar */}
        {selectedCars.length > 0 && (
          <Card className='border-primary/20 bg-primary/5'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <Settings className='h-4 w-4 text-primary' />
                    <span className='font-medium text-primary'>
                      Bulk Actions ({selectedCars.length} selected)
                    </span>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  {/* Quick Actions */}
                  <Dialog
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setBulkOperation('feature');
                          setShowBulkDialog(true);
                        }}
                      >
                        <Star className='h-4 w-4 mr-1' />
                        Feature
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Dialog
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setBulkOperation('unfeature');
                          setShowBulkDialog(true);
                        }}
                      >
                        <StarOff className='h-4 w-4 mr-1' />
                        Unfeature
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Dialog
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setBulkOperation('stock');
                          setShowBulkDialog(true);
                        }}
                      >
                        <Package className='h-4 w-4 mr-1' />
                        In Stock
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Dialog
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setBulkOperation('unstock');
                          setShowBulkDialog(true);
                        }}
                      >
                        <PackageX className='h-4 w-4 mr-1' />
                        Out of Stock
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  {/* More Actions Dropdown */}
                  <Select
                    onValueChange={(value) => {
                      setBulkOperation(value);
                      setShowBulkDialog(true);
                    }}
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue placeholder='More Actions' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='update'>Update Fields</SelectItem>
                      <SelectItem value='delete' className='text-red-600'>
                        Delete Selected
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Operation Confirmation Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center space-x-2'>
                <div
                  className={`p-2 rounded-full ${
                    bulkOperation === 'delete' ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                >
                  {bulkOperation === 'delete' ? (
                    <AlertTriangle className='h-4 w-4 text-red-600' />
                  ) : (
                    <Settings className='h-4 w-4 text-blue-600' />
                  )}
                </div>
                <span>{getBulkOperationLabel(bulkOperation)}</span>
              </DialogTitle>
              <DialogDescription>
                {getBulkOperationDescription(
                  bulkOperation,
                  selectedCars.length
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Update Fields Form */}
            {bulkOperation === 'update' && (
              <div className='space-y-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium'>Category</label>
                    <Select
                      onValueChange={(value) =>
                        setBulkUpdateData((prev) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Sedan'>Sedan</SelectItem>
                        <SelectItem value='SUV'>SUV</SelectItem>
                        <SelectItem value='Truck'>Truck</SelectItem>
                        <SelectItem value='Coupe'>Coupe</SelectItem>
                        <SelectItem value='Convertible'>Convertible</SelectItem>
                        <SelectItem value='Hatchback'>Hatchback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Condition</label>
                    <Select
                      onValueChange={(value) =>
                        setBulkUpdateData((prev) => ({
                          ...prev,
                          condition: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select condition' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='New'>New</SelectItem>
                        <SelectItem value='Used'>Used</SelectItem>
                        <SelectItem value='Certified Pre-Owned'>
                          Certified Pre-Owned
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowBulkDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkOperation}
                disabled={isBulkOperating}
                className={
                  bulkOperation === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                }
              >
                {isBulkOperating ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Processing...
                  </>
                ) : (
                  getBulkOperationLabel(bulkOperation)
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vehicle List */}
        <div className='grid gap-4'>
          {filteredCars.length === 0 ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <Car className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No vehicles found
                </h3>
                <p className='text-gray-500 mb-4'>
                  {searchQuery
                    ? 'Try adjusting your search query.'
                    : 'Get started by adding your first vehicle.'}
                </p>
                <Button onClick={() => navigate('/admin/add-vehicle')}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCars.map((car) => (
              <Card
                key={car.id}
                className={`overflow-hidden ${
                  selectedCars.includes(car.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardContent className='p-0'>
                  <div className='flex'>
                    {/* Image */}
                    <div className='w-48 h-32 bg-gray-200 flex-shrink-0'>
                      {car.thumbnail ? (
                        <img
                          src={car.thumbnail}
                          alt={`${car.make} ${car.model}`}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <Car className='h-8 w-8 text-gray-400' />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className='flex-1 p-6'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <input
                              type='checkbox'
                              checked={selectedCars.includes(car.id)}
                              onChange={() => handleSelectCar(car.id)}
                              className='rounded border-gray-300'
                            />
                            <h3 className='text-lg font-semibold'>
                              {car.year} {car.make} {car.model}
                            </h3>
                            {car.isFeatured && (
                              <Star className='h-4 w-4 text-yellow-500 fill-current' />
                            )}
                          </div>

                          <div className='flex items-center space-x-4 text-sm text-gray-600 mb-3'>
                            <span>{car.mileage.toLocaleString()} miles</span>
                            <span>{car.fuelType}</span>
                            <span>{car.transmission}</span>
                            <span>{car.color}</span>
                          </div>

                          <div className='flex items-center space-x-2 mb-3'>
                            <Badge
                              className={getConditionBadgeColor(car.condition)}
                            >
                              {car.condition}
                            </Badge>
                            <Badge variant='outline'>{car.category}</Badge>
                            {car.inStock ? (
                              <div className='flex items-center text-green-600 text-sm'>
                                <CheckCircle className='h-4 w-4 mr-1' />
                                In Stock
                              </div>
                            ) : (
                              <div className='flex items-center text-red-600 text-sm'>
                                <XCircle className='h-4 w-4 mr-1' />
                                Out of Stock
                              </div>
                            )}
                          </div>

                          <p className='text-2xl font-bold text-primary'>
                            {formatCurrency(car.price)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center space-x-2 ml-4'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => navigate(`/car/${car.id}`)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              navigate(`/admin/edit-vehicle/${car.id}`)
                            }
                          >
                            <Edit className='h-4 w-4' />
                          </Button>

                          {/* Delete Button with AlertDialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                onClick={() => setCarToDelete(car)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <div className='flex items-center space-x-2'>
                                  <div className='p-2 bg-red-100 rounded-full'>
                                    <AlertTriangle className='h-4 w-4 text-red-600' />
                                  </div>
                                  <AlertDialogTitle>
                                    Delete Vehicle
                                  </AlertDialogTitle>
                                </div>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{' '}
                                  <span className='font-semibold'>
                                    {car.year} {car.make} {car.model}
                                  </span>
                                  ? This action cannot be undone and will
                                  permanently remove the vehicle from your
                                  inventory.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCar(car)}
                                  disabled={isDeleting}
                                  className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
                                >
                                  {isDeleting ? (
                                    <>
                                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className='h-4 w-4 mr-2' />
                                      Delete Vehicle
                                    </>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
