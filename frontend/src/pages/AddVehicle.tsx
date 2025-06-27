import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Upload,
  X,
  Plus,
  Star,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Car,
  DollarSign,
  Gauge,
  Calendar,
  Palette,
  Fuel,
  Settings,
  FileText,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import CameraCapture from '@/components/ui/CameraCapture';

// Form validation schema
const addVehicleSchema = z.object({
  make: z
    .string()
    .min(1, 'Make is required')
    .max(50, 'Make must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s-]+$/,
      'Make can only contain letters, spaces, and hyphens'
    ),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters'),
  year: z
    .number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(
      new Date().getFullYear() + 1,
      `Year cannot be later than ${new Date().getFullYear() + 1}`
    ),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal number')
    .refine((val) => parseFloat(val) >= 0, 'Price must be non-negative')
    .refine(
      (val) => parseFloat(val) <= 10000000,
      'Price cannot exceed $10,000,000'
    ),
  mileage: z
    .number()
    .int('Mileage must be an integer')
    .min(0, 'Mileage cannot be negative')
    .max(1000000, 'Mileage cannot exceed 1,000,000'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(30, 'Color must be less than 30 characters')
    .regex(
      /^[a-zA-Z\s-]+$/,
      'Color can only contain letters, spaces, and hyphens'
    ),
  fuelType: z.enum(
    ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'],
    {
      errorMap: () => ({ message: 'Please select a valid fuel type' }),
    }
  ),
  transmission: z.enum(['Manual', 'Automatic', 'CVT'], {
    errorMap: () => ({ message: 'Please select a valid transmission type' }),
  }),
  condition: z.enum(['New', 'Used', 'Certified Pre-Owned'], {
    errorMap: () => ({ message: 'Please select a valid condition' }),
  }),
  category: z.enum(
    [
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
    ],
    {
      errorMap: () => ({ message: 'Please select a valid category' }),
    }
  ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  features: z
    .array(
      z
        .string()
        .min(1, 'Feature cannot be empty')
        .max(100, 'Feature must be less than 100 characters')
    )
    .min(1, 'At least one feature is required')
    .max(20, 'Cannot have more than 20 features'),
  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Cannot have more than 10 images'),
  thumbnail: z.string().url('Thumbnail must be a valid URL'),
  inStock: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type AddVehicleFormData = z.infer<typeof addVehicleSchema>;

interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

// Add interface for API response
interface ImageUploadResponse {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  originalSize: number;
  dimensions: {
    original: { width: number; height: number };
    processed: { width?: number; height?: number };
  };
  dataURL: string;
  url: string;
}

interface UploadApiResponse {
  success: boolean;
  data: {
    images: ImageUploadResponse[];
    totalImages: number;
    totalOriginalSize: number;
  };
  message?: string;
}

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

const AddVehicle: React.FC = () => {
  const navigate = useNavigate();
  const { makeAuthenticatedRequest } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const form = useForm<AddVehicleFormData>({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      mileage: 0,
      color: '',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      condition: 'New',
      category: 'Sedan',
      description: '',
      features: [],
      images: [],
      thumbnail: '',
      inStock: true,
      isFeatured: false,
    },
  });

  const { watch, setValue, getValues } = form;
  const watchedFeatures = watch('features');
  const watchedImages = watch('images');

  // Handle file upload
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

    setUploadingImages(true);
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

      const response = await makeAuthenticatedRequest('/api/upload/multiple', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result: UploadApiResponse = await response.json();
        if (result.success) {
          const newImages: UploadedImage[] = result.data.images.map(
            (img: ImageUploadResponse) => ({
              url: img.dataURL,
              filename: img.filename,
              originalName: img.originalName,
              size: img.size,
            })
          );

          setUploadedImages((prev) => [...prev, ...newImages]);

          // Update form values
          const currentImages = getValues('images');
          const updatedImages = [
            ...currentImages,
            ...newImages.map((img) => img.url),
          ];
          setValue('images', updatedImages);

          // Set first image as thumbnail if none set
          if (!getValues('thumbnail') && updatedImages.length > 0) {
            setValue('thumbnail', updatedImages[0]);
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
      setUploadingImages(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const currentImages = getValues('images');
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setValue('images', updatedImages);

    // Update uploaded images state
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));

    // Update thumbnail if necessary
    if (index === thumbnailIndex) {
      if (updatedImages.length > 0) {
        setValue('thumbnail', updatedImages[0]);
        setThumbnailIndex(0);
      } else {
        setValue('thumbnail', '');
        setThumbnailIndex(0);
      }
    } else if (index < thumbnailIndex) {
      setThumbnailIndex(thumbnailIndex - 1);
    }
  };

  // Set thumbnail
  const setThumbnail = (index: number) => {
    const images = getValues('images');
    if (images[index]) {
      setValue('thumbnail', images[index]);
      setThumbnailIndex(index);
      toast.success('Thumbnail updated');
    }
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim() && watchedFeatures.length < 20) {
      const updatedFeatures = [...watchedFeatures, newFeature.trim()];
      setValue('features', updatedFeatures);
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    const updatedFeatures = watchedFeatures.filter((_, i) => i !== index);
    setValue('features', updatedFeatures);
  };

  // Handle form submission
  const onSubmit = async (data: AddVehicleFormData) => {
    setIsSubmitting(true);
    try {
      const response = await makeAuthenticatedRequest('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Vehicle added successfully!');
          navigate('/admin/inventory');
        } else {
          throw new Error(result.message || 'Failed to add vehicle');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add vehicle');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add vehicle'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Add New Vehicle</h1>
            <p className='text-gray-600 mt-1'>
              Add a new vehicle to your inventory with comprehensive details and
              images.
            </p>
          </div>
          <Button
            variant='outline'
            onClick={() => navigate('/admin/inventory')}
          >
            Cancel
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Car className='h-5 w-5 mr-2' />
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
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                          <Input
                            placeholder='25000.00'
                            className='pl-10'
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the price in dollars (e.g., 25000.00)
                      </FormDescription>
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
                  <Settings className='h-5 w-5 mr-2' />
                  Vehicle Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Sedan'>Sedan</SelectItem>
                          <SelectItem value='SUV'>SUV</SelectItem>
                          <SelectItem value='Hatchback'>Hatchback</SelectItem>
                          <SelectItem value='Coupe'>Coupe</SelectItem>
                          <SelectItem value='Convertible'>
                            Convertible
                          </SelectItem>
                          <SelectItem value='Truck'>Truck</SelectItem>
                          <SelectItem value='Van'>Van</SelectItem>
                          <SelectItem value='Sports'>Sports</SelectItem>
                          <SelectItem value='Luxury'>Luxury</SelectItem>
                          <SelectItem value='Electric'>Electric</SelectItem>
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select condition' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='New'>New</SelectItem>
                          <SelectItem value='Used'>Used</SelectItem>
                          <SelectItem value='Certified Pre-Owned'>
                            Certified Pre-Owned
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='fuelType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <Fuel className='h-4 w-4 mr-2' />
                            <SelectValue placeholder='Select fuel type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Gasoline'>Gasoline</SelectItem>
                          <SelectItem value='Diesel'>Diesel</SelectItem>
                          <SelectItem value='Electric'>Electric</SelectItem>
                          <SelectItem value='Hybrid'>Hybrid</SelectItem>
                          <SelectItem value='Plug-in Hybrid'>
                            Plug-in Hybrid
                          </SelectItem>
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select transmission' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Manual'>Manual</SelectItem>
                          <SelectItem value='Automatic'>Automatic</SelectItem>
                          <SelectItem value='CVT'>CVT</SelectItem>
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
                  <FileText className='h-5 w-5 mr-2' />
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
                          placeholder='Provide a detailed description of the vehicle, including its condition, special features, maintenance history, and any other relevant information...'
                          className='min-h-[120px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/2000 characters
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
                  <Tag className='h-5 w-5 mr-2' />
                  Vehicle Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Add a feature (e.g., Leather Seats, Sunroof, GPS)'
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={addFeature}
                      disabled={
                        !newFeature.trim() || watchedFeatures.length >= 20
                      }
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Add
                    </Button>
                  </div>

                  {watchedFeatures.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {watchedFeatures.map((feature, index) => (
                        <Badge
                          key={index}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {feature}
                          <X
                            className='h-3 w-3 cursor-pointer hover:text-red-500'
                            onClick={() => removeFeature(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No features added yet. Add features to highlight what
                      makes this vehicle special.
                    </p>
                  )}

                  <FormField
                    control={form.control}
                    name='features'
                    render={() => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <ImageIcon className='h-5 w-5 mr-2' />
                  Vehicle Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {/* Upload Area */}
                  <div
                    className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors'
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className='space-y-4'>
                      <div className='flex justify-center'>
                        {uploadingImages ? (
                          <Loader2 className='h-12 w-12 text-gray-400 animate-spin' />
                        ) : (
                          <Upload className='h-12 w-12 text-gray-400' />
                        )}
                      </div>
                      <div>
                        <p className='text-lg font-medium'>
                          {uploadingImages
                            ? 'Uploading images...'
                            : 'Upload vehicle images'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Drag and drop images here, or click to select files
                        </p>
                        <p className='text-xs text-gray-400 mt-2'>
                          Supports JPEG, PNG, WebP • Max 10 images • Max 10MB
                          per image
                        </p>
                      </div>
                      <div className='flex justify-center gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          disabled={uploadingImages}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/jpeg,image/png,image/webp';
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement)
                                .files;
                              if (files) handleFileUpload(files);
                            };
                            input.click();
                          }}
                        >
                          <Upload className='h-4 w-4 mr-2' />
                          Choose Files
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          disabled={uploadingImages}
                          onClick={() => setCameraModalOpen(true)}
                        >
                          <Camera className='h-4 w-4 mr-2' />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Image Preview Grid */}
                  {watchedImages.length > 0 && (
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                      {watchedImages.map((image, index) => (
                        <div
                          key={index}
                          className={`relative group rounded-lg overflow-hidden border-2 ${
                            index === thumbnailIndex
                              ? 'border-primary'
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Vehicle image ${index + 1}`}
                            className='w-full h-32 object-cover'
                          />
                          <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                            {index !== thumbnailIndex && (
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => setThumbnailIndex(index)}
                              >
                                Set as Thumbnail
                              </Button>
                            )}
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeImage(index)}
                            >
                              Remove
                            </Button>
                          </div>
                          {index === thumbnailIndex && (
                            <div className='absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded flex items-center gap-1'>
                              <Star className='h-3 w-3' />
                              Thumbnail
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name='images'
                    render={() => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Options</CardTitle>
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
                          Highlight this vehicle on the homepage and in search
                          results
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className='flex justify-end gap-4 pt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/admin/inventory')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Adding Vehicle...
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Add Vehicle
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
          // Convert base64 to File and upload
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

export default AddVehicle;
