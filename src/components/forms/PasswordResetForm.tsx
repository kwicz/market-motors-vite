import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
import { Label } from '../ui/label';
import { Eye, EyeOff } from 'lucide-react';

// Validation schema for password reset
const passwordResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
}

/**
 * PasswordResetForm component for requesting password reset
 */
export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  token: propToken,
  onSuccess,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = propToken || searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const newPassword = watch('newPassword');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token');
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await fetch('/api/password-reset/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (result.valid) {
          setTokenValid(true);
        } else {
          setError(result.message || 'Invalid or expired reset token');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Network error. Please try again.');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: PasswordResetFormData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsResetComplete(true);
        onSuccess?.();
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Network error. Please try again.');
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[Math.min(strength - 1, 4)] || '' };
  };

  const passwordStrength = getPasswordStrength(newPassword || '');

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <Loader2 className='mx-auto h-8 w-8 animate-spin text-muted-foreground' />
            <p className='mt-2 text-sm text-muted-foreground'>
              Validating reset token...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (isResetComplete) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <CardTitle>Password Reset Successful</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You can now log in with
            your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/login')} className='w-full'>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state for invalid token
  if (!tokenValid) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='h-6 w-6 text-red-600' />
          </div>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className='flex flex-col space-y-2'>
            <Button
              onClick={() => navigate('/forgot-password')}
              className='w-full'
            >
              Request New Reset Link
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate('/login')}
              className='w-full'
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='text-center'>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='newPassword'>New Password</Label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your new password'
                {...register('newPassword')}
                disabled={isSubmitting}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className='text-sm text-destructive'>
                {errors.newPassword.message}
              </p>
            )}
            {newPassword && (
              <div className='space-y-1'>
                <div className='flex items-center justify-between text-xs'>
                  <span>Password strength:</span>
                  <span
                    className={`font-medium ${
                      passwordStrength.strength < 3
                        ? 'text-red-600'
                        : passwordStrength.strength < 4
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className='flex space-x-1'>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrength.strength
                          ? passwordStrength.strength < 3
                            ? 'bg-red-500'
                            : passwordStrength.strength < 4
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm New Password</Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Confirm your new password'
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className='text-sm text-destructive'>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type='submit'
            className='w-full'
            disabled={isSubmitting || passwordStrength.strength < 3}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordResetForm;
