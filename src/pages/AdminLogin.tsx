import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // For demo purposes, we're using a simple check for admin credentials
    // In a real app, this would be authenticated against a secure backend
    if (username === 'admin' && password === 'password') {
      // Simulate network delay
      setTimeout(() => {
        // Store admin session in localStorage (not secure, just for demo)
        localStorage.setItem('adminLoggedIn', 'true');
        toast.success('Login successful');
        navigate('/admin');
        setLoading(false);
      }, 1000);
    } else {
      setTimeout(() => {
        toast.error('Invalid credentials');
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <>
      <Navbar />
      <main className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12'>
        <Card className='w-full max-w-md shadow-lg'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center'>
              Admin Login
            </CardTitle>
            <CardDescription className='text-center'>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  type='text'
                  placeholder='admin'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className='text-xs text-muted-foreground text-right'>
                  For demo: username: admin, password: password
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type='submit'
                className='w-full'
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
          <CardFooter className='pt-0'>
            <div className='text-sm text-center w-full'>
              <Link
                to='/forgot-password'
                className='text-muted-foreground hover:text-primary hover:underline'
              >
                Forgot your password?
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default AdminLogin;
