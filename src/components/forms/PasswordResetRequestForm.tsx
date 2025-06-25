import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Validation schema
const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;

interface PasswordResetRequestFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const PasswordResetRequestForm: React.FC<
  PasswordResetRequestFormProps
> = ({ onSuccess, onBack }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const onSubmit = async (data: PasswordResetRequestFormData) => {
    try {
      setError(null);

      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to send password reset email');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Network error. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <Mail className='h-6 w-6 text-green-600' />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a password reset link to{' '}
            <span className='font-medium'>{getValues('email')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-muted-foreground text-center'>
            <p>Didn't receive the email? Check your spam folder or</p>
            <Button
              variant='link'
              className='p-0 h-auto font-normal'
              onClick={() => setIsSubmitted(false)}
            >
              try again
            </Button>
          </div>
          <div className='flex flex-col space-y-2'>
            <Button variant='outline' onClick={onBack} className='w-full'>
              <ArrowLeft className='mr-2 h-4 w-4' />
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
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email'>Email Address</Label>
            <Input
              id='email'
              type='email'
              placeholder='Enter your email address'
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className='text-sm text-destructive'>{errors.email.message}</p>
            )}
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <div className='text-center'>
            <Button
              variant='link'
              onClick={onBack}
              className='text-sm'
              type='button'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordResetRequestForm;
