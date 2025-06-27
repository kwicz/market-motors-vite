import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Users,
  Package,
  Star,
  Activity,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types for dashboard metrics
interface DashboardMetrics {
  overview: {
    totalCars: number;
    recentAdditions: number;
    growthPercentage: number;
    averagePrice: number;
    averageMileage: number;
    averageYear: number;
    featuredCars: number;
    inStockCars: number;
  };
  trends: {
    period: string;
    currentPeriodAdditions: number;
    previousPeriodAdditions: number;
    growthPercentage: number;
  };
  distribution: {
    byCategory: Array<{ category: string; count: number }>;
    byCondition: Array<{ condition: string; count: number }>;
  };
  topInsights: {
    topMakes: Array<{ make: string; count: number; avgPrice: number }>;
  };
}

interface RecentActivity {
  id: string;
  type: 'added' | 'updated' | 'deleted' | 'featured';
  vehicle: {
    make: string;
    model: string;
    year: number;
    price: string;
  };
  timestamp: string;
  user?: {
    email: string;
  };
}

// Types for API responses
interface CarApiResponse {
  id: string;
  make: string;
  model: string;
  year: number;
  price: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'day' | 'week' | 'month' | 'year'
  >('month');
  const navigate = useNavigate();
  const { makeAuthenticatedRequest } = useAuthContext();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setMetricsLoading(true);

        // Fetch dashboard metrics
        const metricsResponse = await makeAuthenticatedRequest(
          `/api/cars/dashboard/metrics?period=${selectedPeriod}`
        );

        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          if (metricsData.success) {
            setMetrics(metricsData.data);
          }
        }

        // Fetch recent activity (using cars endpoint for now)
        const carsResponse = await makeAuthenticatedRequest(
          '/api/cars?limit=10&sort=createdAt:desc'
        );
        if (carsResponse.ok) {
          const carsData: ApiResponse<CarApiResponse[]> =
            await carsResponse.json();
          if (carsData.success) {
            // Transform cars data to recent activity format
            const activities: RecentActivity[] = carsData.data.map(
              (car: CarApiResponse) => ({
                id: car.id,
                type: 'added' as const,
                vehicle: {
                  make: car.make,
                  model: car.model,
                  year: car.year,
                  price: car.price,
                },
                timestamp: car.createdAt,
                user: car.user ? { email: car.user.email } : undefined,
              })
            );
            setRecentActivity(activities);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
        setMetricsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod, makeAuthenticatedRequest]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpRight className='h-4 w-4 text-green-600' />;
    } else if (growth < 0) {
      return <ArrowDownRight className='h-4 w-4 text-red-600' />;
    }
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'added':
        return <Plus className='h-4 w-4 text-green-600' />;
      case 'updated':
        return <Activity className='h-4 w-4 text-blue-600' />;
      case 'deleted':
        return <AlertCircle className='h-4 w-4 text-red-600' />;
      case 'featured':
        return <Star className='h-4 w-4 text-yellow-600' />;
      default:
        return <Activity className='h-4 w-4 text-gray-600' />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    const vehicle = `${activity.vehicle.year} ${activity.vehicle.make} ${activity.vehicle.model}`;
    switch (activity.type) {
      case 'added':
        return `Added ${vehicle}`;
      case 'updated':
        return `Updated ${vehicle}`;
      case 'deleted':
        return `Deleted ${vehicle}`;
      case 'featured':
        return `Featured ${vehicle}`;
      default:
        return `Activity on ${vehicle}`;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleSelectPeriod = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value as 'day' | 'week' | 'month' | 'year');
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
        <div
          className='flex flex-col md:flex-row md:items-center md:justify-between'
          data-lov-id='src/pages/AdminDashboard.tsx:242:8'
        >
          <div>
            <h1 className='text-3xl font-bold'>Dashboard</h1>
            <p className='text-gray-600 mt-1'>
              Welcome back! Here's your inventory overview.
            </p>
          </div>
          <div className='flex items-center space-x-3 mt-4 md:mt-0 md:justify-end justify-start w-full md:w-auto'>
            <select
              value={selectedPeriod}
              onChange={handleSelectPeriod}
              className='px-[12px] py-[12px] border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            >
              <option value='day'>Today</option>
              <option value='week'>This Week</option>
              <option value='month'>This Month</option>
              <option value='year'>This Year</option>
            </select>
            <Button
              className='font-inter'
              onClick={() => navigate('/admin/add-vehicle')}
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                Total Vehicles
              </CardTitle>
              <Car className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metricsLoading
                  ? '...'
                  : formatNumber(metrics?.overview.totalCars || 0)}
              </div>
              {metrics?.trends.growthPercentage !== undefined && (
                <div
                  className={`flex items-center text-sm ${getGrowthColor(
                    metrics.trends.growthPercentage
                  )}`}
                >
                  {getGrowthIcon(metrics.trends.growthPercentage)}
                  <span className='ml-1'>
                    {Math.abs(metrics.trends.growthPercentage)}% from last{' '}
                    {selectedPeriod}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                Total Value
              </CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metricsLoading
                  ? '...'
                  : formatCurrency(metrics?.overview.averagePrice || 0)}
              </div>
              <p className='text-sm text-muted-foreground'>
                Avg. price per vehicle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                In Stock
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                {metricsLoading
                  ? '...'
                  : formatNumber(metrics?.overview.inStockCars || 0)}
              </div>
              <p className='text-sm text-muted-foreground'>
                Available for sale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                Featured
              </CardTitle>
              <Star className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-600'>
                {metricsLoading
                  ? '...'
                  : formatNumber(metrics?.overview.featuredCars || 0)}
              </div>
              <p className='text-sm text-muted-foreground'>
                Highlighted vehicles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                Recent Additions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-blue-600'>
                {metricsLoading
                  ? '...'
                  : formatNumber(metrics?.trends.currentPeriodAdditions || 0)}
              </div>
              <p className='text-sm text-muted-foreground'>
                Added this {selectedPeriod}
              </p>
              {metrics?.trends.growthPercentage !== undefined && (
                <div
                  className={`flex items-center mt-2 text-sm ${getGrowthColor(
                    metrics.trends.growthPercentage
                  )}`}
                >
                  {getGrowthIcon(metrics.trends.growthPercentage)}
                  <span className='ml-1'>
                    {Math.abs(metrics.trends.growthPercentage)}% vs last{' '}
                    {selectedPeriod}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                Average Mileage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>
                {metricsLoading
                  ? '...'
                  : formatNumber(metrics?.overview.averageMileage || 0)}
              </div>
              <p className='text-sm text-muted-foreground'>
                Miles across inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                Average Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>
                {metricsLoading
                  ? '...'
                  : Math.round(metrics?.overview.averageYear || 0)}
              </div>
              <p className='text-sm text-muted-foreground'>
                Model year average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight flex items-center'>
                <BarChart3 className='h-5 w-5 mr-2' />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {metricsLoading ? (
                  <div className='text-center py-4'>Loading...</div>
                ) : (
                  metrics?.distribution.byCategory.map((item) => (
                    <div
                      key={item.category}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm font-medium'>
                        {item.category}
                      </span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-24 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-primary h-2 rounded-full'
                            style={{
                              width: `${
                                (item.count /
                                  (metrics?.overview.totalCars || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className='text-sm text-muted-foreground w-8'>
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight flex items-center'>
                <Users className='h-5 w-5 mr-2' />
                Top Makes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {metricsLoading ? (
                  <div className='text-center py-4'>Loading...</div>
                ) : (
                  metrics?.topInsights.topMakes.slice(0, 5).map((make) => (
                    <div
                      key={make.make}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm font-medium'>{make.make}</span>
                      <div className='text-right'>
                        <div className='text-sm font-semibold'>
                          {make.count} vehicles
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Avg. {formatCurrency(make.avgPrice)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between text-xl font-semibold leading-none tracking-tight'>
              <div className='flex items-center'>
                <Activity className='h-5 w-5 mr-2' />
                Recent Activity
              </div>
              <Button
                className='font-inter'
                onClick={() => navigate('/admin/inventory')}
              >
                <Activity className='h-4 w-4 mr-2' />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentActivity.length === 0 ? (
                <div className='text-center py-8'>
                  <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No recent activity
                  </h3>
                  <p className='text-gray-500'>
                    Recent vehicle changes will appear here.
                  </p>
                </div>
              ) : (
                recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className='flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex-shrink-0'>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900'>
                        {getActivityText(activity)}
                      </p>
                      <div className='flex items-center space-x-2 mt-1'>
                        <p className='text-sm text-gray-500'>
                          {formatCurrency(parseFloat(activity.vehicle.price))}
                        </p>
                        {activity.user && (
                          <>
                            <span className='text-gray-300'>•</span>
                            <p className='text-sm text-gray-500'>
                              by {activity.user.email}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className='text-sm text-gray-500 flex-shrink-0'>
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
