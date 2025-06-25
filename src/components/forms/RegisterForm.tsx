import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { userRegistrationSchema } from '../../../lib/validations/user';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Progress } from '../ui/progress';

// Form data type
type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
};

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

// Password strength checker
const getPasswordStrength = (
  password: string
): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/\d/.test(password)) {
    score += 20;
  } else {
    feedback.push('One number');
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 20;
  } else {
    feedback.push('One special character (@$!%*?&)');
  }

  return { score, feedback };
};

/**
 * RegisterForm component with React Hook Form validation
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo = '/dashboard',
}) => {
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Initialize form with React Hook Form
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch password for strength indicator
  const watchedPassword = form.watch('password');
  const passwordStrength = getPasswordStrength(watchedPassword || '');

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setRegisterError(null);

      const result = await register(data);

      if (result.success) {
        // Call success callback if provided
        onSuccess?.();

        // Navigate to the intended page
        navigate(redirectTo, { replace: true });
      } else {
        // Handle registration errors
        if (result.errors) {
          // Set field-specific errors
          result.errors.forEach((error) => {
            if (error.path && error.path.length > 0) {
              const fieldName = error.path[0] as keyof RegisterFormData;
              form.setError(fieldName, {
                type: 'server',
                message: error.message,
              });
            }
          });
        } else {
          // Set general error message
          setRegisterError(result.message);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError('An unexpected error occurred. Please try again.');
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold text-center'>
          Create Account
        </CardTitle>
        <CardDescription className='text-center'>
          Enter your information to create your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* General error message */}
            {registerError && (
              <Alert variant='destructive'>
                <AlertDescription>{registerError}</AlertDescription>
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

            {/* Username field (optional) */}
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      placeholder='Choose a username'
                      autoComplete='username'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Letters, numbers, underscores, and dashes only
                  </FormDescription>
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
                        placeholder='Create a password'
                        autoComplete='new-password'
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

                  {/* Password strength indicator */}
                  {watchedPassword && (
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Progress
                          value={passwordStrength.score}
                          className='flex-1'
                        />
                        <span className='text-xs text-muted-foreground'>
                          {passwordStrength.score < 40
                            ? 'Weak'
                            : passwordStrength.score < 80
                            ? 'Good'
                            : 'Strong'}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className='text-xs text-muted-foreground'>
                          <p className='font-medium'>Password must include:</p>
                          <ul className='mt-1 space-y-1'>
                            {passwordStrength.feedback.map((item, index) => (
                              <li
                                key={index}
                                className='flex items-center space-x-1'
                              >
                                <X className='h-3 w-3 text-red-500' />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password field */}
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm your password'
                        autoComplete='new-password'
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
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

            {/* Submit button */}
            <Button
              type='submit'
              className='w-full'
              disabled={isLoading || passwordStrength.score < 100}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className='flex flex-col space-y-4'>
        <div className='text-sm text-center text-muted-foreground'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-medium text-primary hover:underline'
          >
            Sign in
          </Link>
        </div>

        <div className='text-xs text-center text-muted-foreground'>
          By creating an account, you agree to our{' '}
          <Link to='/terms' className='hover:underline'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to='/privacy' className='hover:underline'>
            Privacy Policy
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
