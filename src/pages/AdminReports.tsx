import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Car,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';

const AdminReports = () => {
  const [dateRange, setDateRange] = useState('last30days');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const reportStats = {
    totalVehicles: 156,
    vehiclesSold: 23,
    totalRevenue: 487500,
    activeUsers: 1247,
    monthlyGrowth: 12.5,
    topPerformingModel: 'Toyota Camry',
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: string) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    // In a real app, this would trigger a download
  };

  return (
    <AdminLayout>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col gap-6'>
          {/* Header */}
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold'>Reports & Analytics</h1>
              <p className='text-muted-foreground'>
                Generate detailed reports and view business analytics
              </p>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => handleExportReport('pdf')}
              >
                <Download className='h-4 w-4 mr-2' />
                Export PDF
              </Button>
              <Button
                variant='outline'
                onClick={() => handleExportReport('csv')}
              >
                <Download className='h-4 w-4 mr-2' />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Vehicles
                </CardTitle>
                <Car className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {reportStats.totalVehicles}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Active inventory
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Vehicles Sold
                </CardTitle>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {reportStats.vehiclesSold}
                </div>
                <p className='text-xs text-muted-foreground'>This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Revenue
                </CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  ${reportStats.totalRevenue.toLocaleString()}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +{reportStats.monthlyGrowth}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Users
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {reportStats.activeUsers}
                </div>
                <p className='text-xs text-muted-foreground'>Platform users</p>
              </CardContent>
            </Card>
          </div>

          {/* Report Generation */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Generate Custom Report
              </CardTitle>
              <CardDescription>
                Create detailed reports based on your specific requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='reportType'>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select report type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='overview'>
                        Business Overview
                      </SelectItem>
                      <SelectItem value='inventory'>
                        Inventory Analysis
                      </SelectItem>
                      <SelectItem value='sales'>Sales Performance</SelectItem>
                      <SelectItem value='users'>User Activity</SelectItem>
                      <SelectItem value='financial'>
                        Financial Summary
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='dateRange'>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select date range' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='last7days'>Last 7 Days</SelectItem>
                      <SelectItem value='last30days'>Last 30 Days</SelectItem>
                      <SelectItem value='last3months'>Last 3 Months</SelectItem>
                      <SelectItem value='last6months'>Last 6 Months</SelectItem>
                      <SelectItem value='lastyear'>Last Year</SelectItem>
                      <SelectItem value='custom'>Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex items-end'>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className='w-full'
                  >
                    {loading ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className='h-4 w-4 mr-2' />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View detailed analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='sales' className='w-full'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='sales'>Sales</TabsTrigger>
                  <TabsTrigger value='inventory'>Inventory</TabsTrigger>
                  <TabsTrigger value='users'>Users</TabsTrigger>
                  <TabsTrigger value='performance'>Performance</TabsTrigger>
                </TabsList>

                <TabsContent value='sales' className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Monthly Sales</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-bold text-green-600'>
                          ${reportStats.totalRevenue.toLocaleString()}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          {reportStats.vehiclesSold} vehicles sold this month
                        </p>
                        <Badge variant='secondary' className='mt-2'>
                          +{reportStats.monthlyGrowth}% growth
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          Top Performing Model
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-xl font-semibold'>
                          {reportStats.topPerformingModel}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          8 units sold this month
                        </p>
                        <Badge variant='default' className='mt-2'>
                          Best Seller
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='inventory' className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          Inventory Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex justify-between'>
                            <span>Total Vehicles</span>
                            <span className='font-semibold'>
                              {reportStats.totalVehicles}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Available</span>
                            <span className='font-semibold text-green-600'>
                              134
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Sold</span>
                            <span className='font-semibold text-blue-600'>
                              22
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          Popular Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex justify-between'>
                            <span>Sedans</span>
                            <Badge variant='secondary'>45%</Badge>
                          </div>
                          <div className='flex justify-between'>
                            <span>SUVs</span>
                            <Badge variant='secondary'>32%</Badge>
                          </div>
                          <div className='flex justify-between'>
                            <span>Trucks</span>
                            <Badge variant='secondary'>23%</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='users' className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>User Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-bold'>
                          {reportStats.activeUsers}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Active users this month
                        </p>
                        <Badge variant='outline' className='mt-2'>
                          <Activity className='h-3 w-3 mr-1' />
                          +15% increase
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          User Engagement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex justify-between'>
                            <span>Page Views</span>
                            <span className='font-semibold'>12,543</span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Avg. Session</span>
                            <span className='font-semibold'>4m 32s</span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Bounce Rate</span>
                            <span className='font-semibold'>23%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='performance' className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          System Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          <div className='flex justify-between'>
                            <span>Response Time</span>
                            <Badge variant='default'>Fast</Badge>
                          </div>
                          <div className='flex justify-between'>
                            <span>Uptime</span>
                            <Badge variant='default'>99.9%</Badge>
                          </div>
                          <div className='flex justify-between'>
                            <span>Server Load</span>
                            <Badge variant='secondary'>Low</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2 text-sm'>
                          <div className='flex justify-between'>
                            <span>Database backups</span>
                            <span className='text-green-600'>✓ Complete</span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Security scans</span>
                            <span className='text-green-600'>✓ Passed</span>
                          </div>
                          <div className='flex justify-between'>
                            <span>System updates</span>
                            <span className='text-blue-600'>• Scheduled</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
