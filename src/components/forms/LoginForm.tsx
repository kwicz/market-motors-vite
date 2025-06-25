import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { userLoginSchema } from '../../../lib/validations/user';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

// Form data type
type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

/**
 * LoginForm component with React Hook Form validation
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo,
}) => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Get the redirect path from location state or use default
  const from = location.state?.from?.pathname || redirectTo || '/dashboard';

  // Initialize form with React Hook Form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);

      const result = await login(data);

      if (result.success) {
        // Call success callback if provided
        onSuccess?.();

        // Navigate to the intended page
        navigate(from, { replace: true });
      } else {
        // Handle login errors
        if (result.errors) {
          // Set field-specific errors
          result.errors.forEach((error) => {
            if (error.path && error.path.length > 0) {
              const fieldName = error.path[0] as keyof LoginFormData;
              form.setError(fieldName, {
                type: 'server',
                message: error.message,
              });
            }
          });
        } else {
          // Set general error message
          setLoginError(result.message);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold text-center'>
          Sign In
        </CardTitle>
        <CardDescription className='text-center'>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* General error message */}
            {loginError && (
              <Alert variant='destructive'>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            {/* Email field */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='Enter your email'
                      autoComplete='email'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your password'
                        autoComplete='current-password'
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember me checkbox */}
            <FormField
              control={form.control}
              name='rememberMe'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-normal'>
                      Remember me for 30 days
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit button */}
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className='flex flex-col space-y-4'>
        <div className='text-sm text-center text-muted-foreground'>
          Don't have an account?{' '}
          <Link
            to='/register'
            className='font-medium text-primary hover:underline'
          >
            Sign up
          </Link>
        </div>

        <div className='text-sm text-center'>
          <Link
            to='/forgot-password'
            className='text-muted-foreground hover:text-primary hover:underline'
          >
            Forgot your password?
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
