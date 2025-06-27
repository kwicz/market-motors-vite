import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <div className='text-center'>
            <ShieldX className='mx-auto h-12 w-12 text-red-500' />
            <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
              Access Denied
            </h2>
            <p className='mt-2 text-sm text-gray-600'>
              You don't have permission to access this page.
            </p>
            <p className='mt-1 text-sm text-gray-500'>
              Please contact your administrator if you believe this is an error.
            </p>
          </div>

          <div className='mt-8 space-y-4'>
            <Link
              to='/'
              className='w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Home className='h-4 w-4 mr-2' />
              Go to Homepage
            </Link>

            <button
              onClick={() => window.history.back()}
              className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
