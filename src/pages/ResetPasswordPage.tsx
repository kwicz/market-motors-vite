import React from 'react';
import { PasswordResetForm } from '../components/forms/PasswordResetForm';

const ResetPasswordPage: React.FC = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <PasswordResetForm />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
