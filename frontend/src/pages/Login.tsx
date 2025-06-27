import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { User, ShieldCheck, AlertCircle } from 'lucide-react';
import { login, authenticate } from '@/utils/auth';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use hardcoded authentication
      const user = authenticate(username, password);

      if (!user) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      // User authenticated
      login(user);
      toast.success('Login successful!');
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className='min-h-screen pt-16 bg-gray-50 flex items-center justify-center'>
        <div className='container max-w-md mx-auto px-4 py-16'>
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <div className='bg-primary text-primary-foreground p-6 text-center'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 backdrop-blur-sm mb-4'>
                <ShieldCheck className='w-8 h-8' />
              </div>
              <h1 className='text-2xl font-bold'>Admin Login</h1>
              <p className='text-primary-foreground/80 mt-2'>
                Access the dealer management system
              </p>
            </div>

            <div className='p-6'>
              {error && (
                <div className='mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700'>
                  <AlertCircle className='w-5 h-5 mr-2 flex-shrink-0' />
                  <span className='text-sm'>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label
                    htmlFor='username'
                    className='block text-sm font-medium text-foreground mb-1'
                  >
                    Username
                  </label>
                  <div className='relative'>
                    <input
                      id='username'
                      type='text'
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pl-10'
                      required
                    />
                    <User className='w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2' />
                  </div>
                </div>

                <div>
                  <div className='flex items-baseline justify-between'>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-foreground mb-1'
                    >
                      Password
                    </label>
                    <a
                      href='#'
                      className='text-xs text-primary hover:underline'
                    >
                      Forgot password?
                    </a>
                  </div>
                  <input
                    id='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    required
                  />
                </div>

                <div>
                  <Button type='submit' className='w-full' disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>

              <div className='mt-6 text-center text-sm text-muted-foreground'>
                <p>Default admin credentials:</p>
                <p className='font-medium text-foreground'>
                  Username: admin, Password: admin123
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Login;
