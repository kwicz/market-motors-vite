import Link from 'next/link';

export default function Home() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Simple Header */}
      <header className='bg-market-accent text-white p-4'>
        <div className='container mx-auto'>
          <h1 className='text-2xl font-bold'>Market Motors</h1>
          <p className='text-sm opacity-90'>Premium Car Dealership</p>
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-12'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold text-market-text mb-4'>
            Welcome to Market Motors
          </h2>
          <p className='text-lg text-market-text/80 max-w-2xl mx-auto mb-8'>
            Your trusted family-owned dealership serving the community for over
            20 years. Find quality pre-owned vehicles with honest service and no
            pressure sales.
          </p>
          <div className='flex flex-col sm:flex-row justify-center gap-4'>
            <Link
              href='/inventory'
              className='px-6 py-3 bg-market-accent text-white font-medium rounded-md hover:bg-market-accent/90 transition-colors'
            >
              Browse Inventory
            </Link>
            <Link
              href='/contact'
              className='px-6 py-3 bg-transparent border border-market-accent text-market-accent font-medium rounded-md hover:bg-market-accent/10 transition-colors'
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
          <div className='text-center p-6 bg-gray-50 rounded-lg'>
            <div className='text-3xl mb-4'>🚗</div>
            <h3 className='text-xl font-semibold text-market-text mb-2'>
              Quality Vehicles
            </h3>
            <p className='text-market-text/80'>
              Every car undergoes thorough inspection
            </p>
          </div>
          <div className='text-center p-6 bg-gray-50 rounded-lg'>
            <div className='text-3xl mb-4'>👥</div>
            <h3 className='text-xl font-semibold text-market-text mb-2'>
              Family Owned
            </h3>
            <p className='text-market-text/80'>
              Serving our community since 2002
            </p>
          </div>
          <div className='text-center p-6 bg-gray-50 rounded-lg'>
            <div className='text-3xl mb-4'>✓</div>
            <h3 className='text-xl font-semibold text-market-text mb-2'>
              No Pressure
            </h3>
            <p className='text-market-text/80'>
              Take your time to find the right car
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className='bg-market-background p-8 rounded-lg text-center'>
          <h3 className='text-2xl font-bold text-market-text mb-4'>
            Visit Our Showroom
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-market-text/80'>
            <div>
              <strong className='text-market-text'>Phone:</strong>
              <br />
              <a
                href='tel:+15551234567'
                className='hover:text-market-accent transition-colors'
              >
                (555) 123-4567
              </a>
            </div>
            <div>
              <strong className='text-market-text'>Address:</strong>
              <br />
              123 Auto Plaza Drive
              <br />
              Anytown, USA 12345
            </div>
            <div>
              <strong className='text-market-text'>Hours:</strong>
              <br />
              Mon-Fri: 10AM-6PM
              <br />
              Sat: 10AM-2PM
              <br />
              Sun: Closed
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className='bg-gray-800 text-white p-6 mt-12'>
        <div className='container mx-auto text-center'>
          <p>&copy; 2024 Market Motors. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
