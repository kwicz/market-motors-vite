import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Users,
  Shield,
  Activity,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
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
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { toast } from '../components/ui/use-toast';
import { useAuth } from '../hooks/useAuth';
import {
  User,
  CreateUserData,
  UserListParams,
  UserStats,
  PaginatedUsers,
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserStats,
  getRoleDisplayName,
  getRoleBadgeColor,
  formatDate,
} from '../utils/users';
import { UserRole } from '../types/auth';
import AdminLayout from '../components/layout/AdminLayout';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'updatedAt' | 'email' | 'username' | 'role'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Create user dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    role: UserRole.ADMIN,
  });

  // User action states
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  // Fetch users on component mount and when filters change
  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
      fetchUserStats();
    }
  }, [
    isSuperAdmin,
    pagination.page,
    searchTerm,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: UserListParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        role:
          roleFilter !== 'all'
            ? (roleFilter as 'user' | 'admin' | 'super_admin')
            : undefined,
        status:
          statusFilter !== 'all'
            ? (statusFilter as 'active' | 'inactive')
            : undefined,
        sortBy,
        sortOrder,
      };

      const result: PaginatedUsers = await getUsers(params);
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleCreateUser = async () => {
    if (
      !newUserData.email ||
      !newUserData.password ||
      !newUserData.confirmPassword
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newUserData.password !== newUserData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newUserData.password.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await createUser(newUserData);
      toast({
        title: 'Success',
        description: `New ${getRoleDisplayName(
          newUserData.role
        ).toLowerCase()} account created successfully.`,
      });
      setShowCreateDialog(false);
      setNewUserData({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        role: UserRole.ADMIN,
      });
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUserRole = async (user: User, newRole: UserRole) => {
    if (user.id === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'You cannot change your own role.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRole(user.id, newRole);
      toast({
        title: 'Success',
        description: `User role updated to ${getRoleDisplayName(
          newRole
        ).toLowerCase()}.`,
      });
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUserStatus = async (user: User, isActive: boolean) => {
    if (user.id === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'You cannot change your own account status.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserStatus(user.id, isActive);
      toast({
        title: 'Success',
        description: `User account ${
          isActive ? 'activated' : 'deactivated'
        } successfully.`,
      });
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteUser(userToDelete.id);
      toast({
        title: 'Success',
        description: 'User account deleted successfully.',
      });
      setUserToDelete(null);
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (!isSuperAdmin) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl font-semibold leading-none tracking-tight'>
              <Shield className='h-5 w-5' />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the user management interface.
              Only super administrators can manage user accounts.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col gap-6'>
          {/* Header */}
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold'>User Management</h1>
              <p className='text-muted-foreground'>
                Manage user accounts and permissions
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                  <DialogTitle>Create New User Account</DialogTitle>
                  <DialogDescription>
                    Create a new administrator or super administrator account.
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email Address *</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='admin@marketmotors.com'
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='username'>Username</Label>
                    <Input
                      id='username'
                      placeholder='admin'
                      value={newUserData.username}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='password'>Password *</Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='Minimum 8 characters'
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='confirmPassword'>Confirm Password *</Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      placeholder='Confirm password'
                      value={newUserData.confirmPassword}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='role'>Role *</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(
                        value: UserRole.ADMIN | UserRole.SUPER_ADMIN
                      ) => setNewUserData((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>
                          Administrator
                        </SelectItem>
                        <SelectItem value={UserRole.SUPER_ADMIN}>
                          Super Administrator
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowCreateDialog(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating && (
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    )}
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          {userStats && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                    Total Users
                  </CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {userStats.totalUsers}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {userStats.recentUsers} new this month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                    Active Users
                  </CardTitle>
                  <Activity className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {userStats.activeUsers}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {(
                      (userStats.activeUsers / userStats.totalUsers) *
                      100
                    ).toFixed(1)}
                    % of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                    Administrators
                  </CardTitle>
                  <Shield className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {userStats.usersByRole.admin}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Regular administrators
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                    Super Admins
                  </CardTitle>
                  <UserPlus className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {userStats.usersByRole.super_admin}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Full access accounts
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className='text-xl font-semibold leading-none tracking-tight'>
                User Accounts
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col sm:flex-row gap-4 mb-6'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search users by email or username...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-8'
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Filter by role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Roles</SelectItem>
                    <SelectItem value='user'>Users</SelectItem>
                    <SelectItem value='admin'>Administrators</SelectItem>
                    <SelectItem value='super_admin'>Super Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className='cursor-pointer'
                        onClick={() => {
                          setSortBy('email');
                          setSortOrder(
                            sortBy === 'email' && sortOrder === 'asc'
                              ? 'desc'
                              : 'asc'
                          );
                        }}
                      >
                        Email{' '}
                        {sortBy === 'email' &&
                          (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead
                        className='cursor-pointer'
                        onClick={() => {
                          setSortBy('role');
                          setSortOrder(
                            sortBy === 'role' && sortOrder === 'asc'
                              ? 'desc'
                              : 'asc'
                          );
                        }}
                      >
                        Role{' '}
                        {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead
                        className='cursor-pointer'
                        onClick={() => {
                          setSortBy('createdAt');
                          setSortOrder(
                            sortBy === 'createdAt' && sortOrder === 'asc'
                              ? 'desc'
                              : 'asc'
                          );
                        }}
                      >
                        Created{' '}
                        {sortBy === 'createdAt' &&
                          (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8'>
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
                          <p className='mt-2 text-muted-foreground'>
                            Loading users...
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8'>
                          <div className='text-muted-foreground'>
                            <Users className='h-8 w-8 mx-auto mb-2' />
                            <p>No users found</p>
                            <p className='text-sm'>
                              Try adjusting your search criteria
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className='font-medium'>
                            {user.email}
                          </TableCell>
                          <TableCell>{user.username || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.isActive ? 'default' : 'secondary'}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className='text-right'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' className='h-8 w-8 p-0'>
                                  <MoreHorizontal className='w-full h-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Role Change Options */}
                                {user.role !== UserRole.SUPER_ADMIN && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateUserRole(
                                        user,
                                        UserRole.SUPER_ADMIN
                                      )
                                    }
                                    disabled={
                                      isUpdating || user.id === currentUser?.id
                                    }
                                  >
                                    Promote to Super Admin
                                  </DropdownMenuItem>
                                )}
                                {user.role !== UserRole.ADMIN && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateUserRole(user, UserRole.ADMIN)
                                    }
                                    disabled={
                                      isUpdating || user.id === currentUser?.id
                                    }
                                  >
                                    {user.role === UserRole.SUPER_ADMIN
                                      ? 'Demote to Admin'
                                      : 'Promote to Admin'}
                                  </DropdownMenuItem>
                                )}
                                {user.role !== UserRole.USER && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateUserRole(user, UserRole.USER)
                                    }
                                    disabled={
                                      isUpdating || user.id === currentUser?.id
                                    }
                                  >
                                    Demote to User
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {/* Status Change */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateUserStatus(user, !user.isActive)
                                  }
                                  disabled={
                                    isUpdating || user.id === currentUser?.id
                                  }
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}{' '}
                                  Account
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Delete User */}
                                <DropdownMenuItem
                                  onClick={() => setUserToDelete(user)}
                                  disabled={user.id === currentUser?.id}
                                  className='text-destructive'
                                >
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between space-x-2 py-4'>
                  <div className='text-sm text-muted-foreground'>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{' '}
                    of {pagination.total} users
                  </div>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete User Confirmation Dialog */}
          <AlertDialog
            open={!!userToDelete}
            onOpenChange={() => setUserToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the account for{' '}
                  <strong>{userToDelete?.email}</strong>?
                  <br />
                  <br />
                  This action cannot be undone. The user will lose access to
                  their account and all associated data will be permanently
                  removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
