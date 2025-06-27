import React, { useState } from 'react';
import { Settings, Save, Shield, Database, Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState('Market Motors');
  const [supportEmail, setSupportEmail] = useState('support@marketmotors.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col gap-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold'>System Settings</h1>
              <p className='text-muted-foreground'>
                Configure system preferences and administrative options
              </p>
            </div>
            <Badge variant='outline' className='flex items-center gap-2'>
              <Shield className='h-3 w-3' />
              Super Admin Only
            </Badge>
          </div>

          <Card>
            <CardContent className='p-6'>
              <Tabs defaultValue='general' className='w-full'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='general'>General</TabsTrigger>
                  <TabsTrigger value='security'>Security</TabsTrigger>
                  <TabsTrigger value='email'>Email</TabsTrigger>
                  <TabsTrigger value='system'>System</TabsTrigger>
                </TabsList>

                <TabsContent value='general' className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      General Settings
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='siteName'>Site Name</Label>
                          <Input
                            id='siteName'
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='supportEmail'>Support Email</Label>
                          <Input
                            id='supportEmail'
                            type='email'
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between p-4 border rounded-lg'>
                          <div className='space-y-0.5'>
                            <Label className='text-base'>
                              Maintenance Mode
                            </Label>
                            <p className='text-sm text-muted-foreground'>
                              Temporarily disable public access
                            </p>
                          </div>
                          <Switch
                            checked={maintenanceMode}
                            onCheckedChange={setMaintenanceMode}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='flex justify-end pt-4'>
                      <Button onClick={handleSaveSettings} disabled={loading}>
                        <Save className='h-4 w-4 mr-2' />
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='security' className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Security Settings
                    </h3>
                    <div className='space-y-4'>
                      <Card>
                        <CardHeader>
                          <CardTitle>Security Configuration</CardTitle>
                          <CardDescription>
                            Manage security policies and access controls
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className='text-muted-foreground'>
                            Security settings will be available in a future
                            update.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='email' className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Email Settings
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 border rounded-lg'>
                        <div className='space-y-0.5'>
                          <Label className='text-base'>
                            Email Notifications
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            Enable email notifications for system events
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                    </div>
                    <div className='flex justify-end pt-4'>
                      <Button onClick={handleSaveSettings} disabled={loading}>
                        <Mail className='h-4 w-4 mr-2' />
                        Save Email Settings
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='system' className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      System Management
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2'>
                            <Database className='h-5 w-5' />
                            Database
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-2'>
                            <div className='flex justify-between'>
                              <span>Last Backup</span>
                              <Badge variant='outline'>2 hours ago</Badge>
                            </div>
                            <div className='flex justify-between'>
                              <span>Size</span>
                              <Badge variant='secondary'>245 MB</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>System Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-2'>
                            <div className='flex justify-between'>
                              <span>Status</span>
                              <Badge variant='default' className='bg-green-600'>
                                Online
                              </Badge>
                            </div>
                            <div className='flex justify-between'>
                              <span>Active Users</span>
                              <Badge variant='outline'>23</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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

export default AdminSettings;
