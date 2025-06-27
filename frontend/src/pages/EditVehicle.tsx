import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  DollarSign,
  Gauge,
  Palette,
  Camera,
  Loader2,
  Save,
  Eye,
  ImageIcon,
} from 'lucide-react';
import { carCreationSchema } from '@/lib/validations/vehicle';
import CameraCapture from '@/components/ui/CameraCapture';

// Types for image handling
interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

interface ImageUploadResponse {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  originalSize: number;
  dimensions: { width: number; height: number };
  dataURL: string;
  url: string;
}

interface UploadApiResponse {
  success: boolean;
  images: ImageUploadResponse[];
  message?: string;
}

type FormData = z.infer<typeof carCreationSchema>;

const FUEL_TYPES = [
  'Gasoline',
  'Diesel',
  'Electric',
  'Hybrid',
  'Plug-in Hybrid',
] as const;

const TRANSMISSION_TYPES = ['Manual', 'Automatic', 'CVT'] as const;

const CONDITIONS = ['New', 'Used', 'Certified Pre-Owned'] as const;

const CATEGORIES = [
  'Sedan',
  'SUV',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Truck',
  'Van',
  'Sports',
  'Luxury',
  'Electric',
] as const;

// Utility to convert base64 data URL to File
function base64ToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  if (!arr[1]) throw new Error('Invalid base64 image data');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [newFeature, setNewFeature] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carData, setCarData] = useState<FormData | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(carCreationSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: '0',
      mileage: 0,
      color: '',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      condition: 'Used',
      category: 'Sedan',
      description: '',
      features: [],
      images: [],
      thumbnail: '',
      inStock: true,
      isFeatured: false,
    },
  });

  // Fetch car data on component mount
  useEffect(() => {
    const fetchCarData = async () => {
      if (!id) {
        toast.error('Invalid car ID');
        navigate('/admin/inventory');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/cars/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch car data');
        }

        const result = await response.json();
        const car = result.data;

        setCarData(car);

        // Pre-populate form with existing car data
        form.reset({
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price.toString(),
          mileage: car.mileage,
          color: car.color,
          fuelType: car.fuelType,
          transmission: car.transmission,
          condition: car.condition,
          category: car.category,
          description: car.description,
          features: car.features || [],
          images: car.images || [],
          thumbnail: car.thumbnail || '',
          inStock: car.inStock ?? true,
          isFeatured: car.isFeatured ?? false,
        });

        // Set up existing images
        if (car.images && car.images.length > 0) {
          const existingImages = car.images.map(
            (url: string, index: number) => ({
              url,
              filename: `existing-${index}`,
              originalName: `Image ${index + 1}`,
              size: 0,
            })
          );
          setUploadedImages(existingImages);

          // Find thumbnail index
          if (car.thumbnail) {
            const thumbIndex = car.images.findIndex(
              (img: string) => img === car.thumbnail
            );
            if (thumbIndex !== -1) {
              setThumbnailIndex(thumbIndex);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching car data:', error);
        toast.error('Failed to load car data');
        navigate('/admin/inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchCarData();
  }, [id, navigate, form]);

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    // Validate files before uploading
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(
          `${
            file.name || 'Image'
          }: Invalid file type. Only JPEG, PNG, and WebP are allowed.`
        );
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(
          `${
            file.name || 'Image'
          }: File size exceeds ${MAX_IMAGE_SIZE_MB}MB limit.`
        );
        return;
      }
      validFiles.push(file);
    });
    if (validFiles.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('images', file);
      });
      // Set image processing options
      formData.append('quality', '85');
      formData.append('format', 'jpeg');
      formData.append('resize', 'true');
      formData.append('width', '800');
      formData.append('height', '600');
      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });
      if (response.ok) {
        const result: UploadApiResponse = await response.json();
        if (result.success) {
          const newImages: UploadedImage[] = result.images.map(
            (img: ImageUploadResponse) => ({
              url: img.dataURL,
              filename: img.filename,
              originalName: img.originalName,
              size: img.size,
            })
          );
          setUploadedImages((prev) => [...prev, ...newImages]);
          // Update form values
          const currentImages = form.getValues('images');
          const updatedImages = [
            ...currentImages,
            ...newImages.map((img) => img.url),
          ];
          form.setValue('images', updatedImages);
          // Set first image as thumbnail if none set
          if (!form.getValues('thumbnail') && updatedImages.length > 0) {
            form.setValue('thumbnail', updatedImages[0]);
            setThumbnailIndex(0);
          }
          toast.success(`${newImages.length} image(s) uploaded successfully`);
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);

    const imageUrls = updatedImages.map((img) => img.url);
    form.setValue('images', imageUrls);

    // Adjust thumbnail index if necessary
    if (index === thumbnailIndex) {
      const newThumbnailIndex = 0;
      setThumbnailIndex(newThumbnailIndex);
      form.setValue('thumbnail', updatedImages[newThumbnailIndex]?.url || '');
    } else if (index < thumbnailIndex) {
      setThumbnailIndex(thumbnailIndex - 1);
    }

    toast.success('Image removed');
  };

  const setThumbnail = (index: number) => {
    setThumbnailIndex(index);
    form.setValue('thumbnail', uploadedImages[index].url);
    toast.success('Thumbnail updated');
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = form.getValues('features');
      if (currentFeatures.length >= 20) {
        toast.error('Maximum 20 features allowed');
        return;
      }
      if (currentFeatures.includes(newFeature.trim())) {
        toast.error('Feature already exists');
        return;
      }
      form.setValue('features', [...currentFeatures, newFeature.trim()]);
      setNewFeature('');
      toast.success('Feature added');
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues('features');
    form.setValue(
      'features',
      currentFeatures.filter((_, i) => i !== index)
    );
    toast.success('Feature removed');
  };

  const onSubmit = async (data: FormData) => {
    if (uploadedImages.length === 0) {
      toast.error('At least one image is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update vehicle');
      }

      toast.success('Vehicle updated successfully!');
      navigate('/admin/inventory');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update vehicle'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span>Loading vehicle data...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/admin/inventory')}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Inventory
            </Button>
            <div>
              <h1 className='text-2xl font-bold'>Edit Vehicle</h1>
              <p className='text-muted-foreground'>
                Update vehicle information and manage images
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <div className='h-5 w-5 rounded-full bg-primary mr-3' />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='make'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., Toyota, BMW, Ford'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='model'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., Camry, X5, F-150'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='year'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={1900}
                          max={new Date().getFullYear() + 1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                          <Input
                            type='text'
                            placeholder='25000.00'
                            className='pl-10'
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Enter price in USD</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='mileage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Gauge className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                          <Input
                            type='number'
                            min={0}
                            placeholder='50000'
                            className='pl-10'
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Miles driven</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='color'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Palette className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                          <Input
                            placeholder='e.g., Black, White, Red'
                            className='pl-10'
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Vehicle Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <div className='h-5 w-5 rounded-full bg-blue-500 mr-3' />
                  Vehicle Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='fuelType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select fuel type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FUEL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='transmission'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmission</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select transmission' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRANSMISSION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='condition'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select condition' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <div className='h-5 w-5 rounded-full bg-green-500 mr-3' />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Provide a detailed description of the vehicle, including its condition, features, and any notable characteristics...'
                          className='min-h-[120px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 10 characters, maximum 2000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <div className='h-5 w-5 rounded-full bg-purple-500 mr-3' />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex space-x-2'>
                  <Input
                    placeholder='Add a feature (e.g., Leather Seats, Sunroof)'
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button type='button' onClick={addFeature} variant='outline'>
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>

                <div className='flex flex-wrap gap-2'>
                  {form.watch('features').map((feature, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='flex items-center space-x-1'
                    >
                      <span>{feature}</span>
                      <button
                        type='button'
                        onClick={() => removeFeature(index)}
                        className='ml-1 hover:text-red-500'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <div className='h-5 w-5 rounded-full bg-orange-500 mr-3' />
                  Vehicle Images
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className='flex flex-col items-center space-y-4'>
                    <div className='p-3 bg-gray-100 rounded-full'>
                      <Upload className='h-6 w-6 text-gray-600' />
                    </div>
                    <div>
                      <p className='text-lg font-medium'>
                        Drag and drop images here
                      </p>
                      <p className='text-muted-foreground'>
                        or click to select files
                      </p>
                    </div>
                    <div className='flex space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() =>
                          document.getElementById('file-upload')?.click()
                        }
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        ) : (
                          <ImageIcon className='h-4 w-4 mr-2' />
                        )}
                        Select Images
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        disabled={isUploading}
                        onClick={() => setCameraModalOpen(true)}
                      >
                        <Camera className='h-4 w-4 mr-2' />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                  <input
                    id='file-upload'
                    type='file'
                    multiple
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files);
                      }
                    }}
                  />
                </div>

                {/* Uploaded Images */}
                {uploadedImages.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-medium'>
                        Uploaded Images ({uploadedImages.length}/10)
                      </h3>
                      {carData && (
                        <Badge variant='vehicle'>{carData.category}</Badge>
                      )}
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className={`relative group border-2 rounded-lg overflow-hidden ${
                            index === thumbnailIndex
                              ? 'border-primary'
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className='w-full h-32 object-cover'
                          />
                          {index === thumbnailIndex && (
                            <Badge
                              className='absolute top-2 left-2'
                              variant='default'
                            >
                              Thumbnail
                            </Badge>
                          )}
                          <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1'>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => setThumbnail(index)}
                            >
                              Set as Thumbnail
                            </Button>
                            <Button
                              type='button'
                              size='sm'
                              variant='ghost'
                              onClick={() => removeImage(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <div className='h-5 w-5 rounded-full bg-indigo-500 mr-3' />
                  Additional Options
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='inStock'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>In Stock</FormLabel>
                        <FormDescription>
                          Mark this vehicle as available for sale
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isFeatured'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>Featured Vehicle</FormLabel>
                        <FormDescription>
                          Display this vehicle prominently on the homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className='flex justify-end space-x-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/admin/inventory')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Updating Vehicle...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    Update Vehicle
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <CameraCapture
        open={cameraModalOpen}
        onOpenChange={setCameraModalOpen}
        onCapture={async (image) => {
          const file = base64ToFile(image, `captured-${Date.now()}.jpg`);
          await handleFileUpload({
            0: file,
            length: 1,
            item: (i: number) => file,
          } as unknown as FileList);
        }}
      />
    </AdminLayout>
  );
};

export default EditVehicle;
