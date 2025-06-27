import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import FeaturedCars from '@/components/home/FeaturedCars';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '@/siteConfig';

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedCars />

        {/* About/Why Choose Us Section */}
        <section className='bg-market-background' id='about'>
          <div className='w-full'>
            <img
              src='/banner.jpg'
              alt='Market Motors Banner'
              className='w-full h-56 md:h-80 object-cover'
            />
          </div>
          <div className='container mx-auto px-4 py-20'>
            <div>
              <span className='inline-block text-sm font-medium text-market-accent mb-2'>
                {siteConfig.about.sectionLabel}
              </span>
              <h2 className='text-3xl md:text-4xl font-clarendon text-market-text mb-6'>
                {siteConfig.about.title}
              </h2>
              <p className='text-lg text-market-text/80 mb-6 max-w-4xl'>
                {siteConfig.about.description}
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {siteConfig.about.features.map((feature, idx) => (
                  <div className='flex items-start' key={idx}>
                    <div className='bg-market-yellow/20 p-2 rounded-md mr-4'>
                      <span className='text-market-accent font-bold'>✓</span>
                    </div>
                    <div>
                      <h3 className='font-clarendon text-market-text mb-1'>
                        {feature.title}
                      </h3>
                      <p className='text-market-text/80 text-sm'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className='py-20 bg-white' id='contact'>
          <div className='container mx-auto px-4'>
            <div className='text-center mb-12'>
              <span className='inline-block text-sm font-medium text-market-accent mb-2'>
                {siteConfig.contact.sectionLabel}
              </span>
              <h2 className='text-3xl md:text-4xl font-clarendon text-market-text mb-4'>
                {siteConfig.contact.title}
              </h2>
              <p className='text-lg text-market-text/80 max-w-2xl mx-auto'>
                {siteConfig.contact.description}
              </p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
              <div className='bg-gray-50 p-8 rounded-lg shadow-sm'>
                <h3 className='text-xl font-clarendon text-market-text mb-6'>
                  Get In Touch
                </h3>

                <div className='space-y-6'>
                  <div className='flex items-start'>
                    <div className='bg-market-accent/10 p-3 rounded-full mr-4'>
                      <span className='text-market-accent font-bold'>☏</span>
                    </div>
                    <div>
                      <h4 className='font-medium text-market-text mb-1'>
                        Phone
                      </h4>
                      <a
                        href={`tel:${siteConfig.contact.phone.replace(
                          /[^\d+]/g,
                          ''
                        )}`}
                        className='text-market-text/80 hover:text-market-accent transition-colors'
                      >
                        {siteConfig.contact.phone}
                      </a>
                    </div>
                  </div>

                  <div className='flex items-start'>
                    <div className='bg-market-accent/10 p-3 rounded-full mr-4'>
                      <span className='text-market-accent font-bold'>⌖</span>
                    </div>
                    <div>
                      <h4 className='font-medium text-market-text mb-1'>
                        Address
                      </h4>
                      <address className='text-market-text/80 not-italic'>
                        {siteConfig.contact.address}
                      </address>
                    </div>
                  </div>

                  <div className='flex items-start'>
                    <div className='bg-market-accent/10 p-3 rounded-full mr-4'>
                      <span className='text-market-accent font-bold'>⏱</span>
                    </div>
                    <div>
                      <h4 className='font-medium text-market-text mb-1'>
                        Hours
                      </h4>
                      <div className='text-market-text/80'>
                        {siteConfig.contact.hours.map((h, i) => (
                          <p key={i}>{h}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='h-[400px] bg-gray-200 rounded-lg overflow-hidden'>
                <iframe
                  src={siteConfig.contact.googleMapsEmbedUrl}
                  width='100%'
                  height='100%'
                  style={{ border: 0 }}
                  allowFullScreen
                  loading='lazy'
                  title='Market Motors Location'
                  referrerPolicy='no-referrer-when-downgrade'
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-16 bg-market-accent text-white'>
          <div className='container mx-auto px-4 text-center'>
            <h2 className='text-3xl md:text-4xl font-clarendon mb-6 text-white'>
              Ready to Find Your Perfect Vehicle?
            </h2>
            <p className='text-lg opacity-90 max-w-2xl mx-auto mb-8 text-white'>
              Browse our selection of quality pre-owned vehicles or contact our
              showroom. Our friendly team is ready to help you find the right
              car at the right price.
            </p>
            <div className='flex flex-col sm:flex-row justify-center gap-4'>
              <Link
                to='/inventory'
                className='px-6 py-3 bg-white text-market-accent font-medium rounded-md hover:bg-gray-100 transition-colors'
              >
                Browse Inventory
              </Link>
              <a
                href='#contact'
                className='px-6 py-3 bg-transparent border border-white text-white font-medium rounded-md hover:bg-white/10 transition-colors'
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Index;
