
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import FeaturedCars from '@/components/home/FeaturedCars';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

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
        <section className="py-20 bg-market-background" id="about">
          <div className="container mx-auto px-4">
            <div>
              <span className="inline-block text-sm font-medium text-market-accent mb-2">
                About Market Motors
              </span>
              <h2 className="text-3xl md:text-4xl font-clarendon text-market-text mb-6">
                Family-Owned & Trusted Since 2002
              </h2>
              <p className="text-lg text-market-text/80 mb-6 max-w-4xl">
                At Market Motors, we believe that buying a used car should be a comfortable, 
                straightforward experience. Our family-owned dealership has been serving our 
                community for over 20 years, providing reliable vehicles and honest service.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="bg-market-yellow/20 p-2 rounded-md mr-4">
                    <span className="text-market-accent font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-clarendon text-market-text mb-1">Quality Assurance</h3>
                    <p className="text-market-text/80 text-sm">
                      Every vehicle undergoes a thorough 100-point inspection.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-market-yellow/20 p-2 rounded-md mr-4">
                    <span className="text-market-accent font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-clarendon text-market-text mb-1">Pressure-Free Shopping</h3>
                    <p className="text-market-text/80 text-sm">
                      Take your time deciding on the perfect vehicle for you.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-market-yellow/20 p-2 rounded-md mr-4">
                    <span className="text-market-accent font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-clarendon text-market-text mb-1">Friendly Customer Service</h3>
                    <p className="text-market-text/80 text-sm">
                      Our knowledgeable staff is here to help, not pressure.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-market-yellow/20 p-2 rounded-md mr-4">
                    <span className="text-market-accent font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-clarendon text-market-text mb-1">Quality Vehicles</h3>
                    <p className="text-market-text/80 text-sm">
                      All vehicles are thoroughly inspected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Contact Us Section */}
        <section className="py-20 bg-white" id="contact">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block text-sm font-medium text-market-accent mb-2">
                Visit Our Dealership
              </span>
              <h2 className="text-3xl md:text-4xl font-clarendon text-market-text mb-4">
                Contact Us
              </h2>
              <p className="text-lg text-market-text/80 max-w-2xl mx-auto">
                The best way to shop our vehicles is to visit us in person. Our friendly staff is ready to help you find the perfect car.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-50 p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-clarendon text-market-text mb-6">Get In Touch</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-market-accent/10 p-3 rounded-full mr-4">
                      <span className="text-market-accent font-bold">☏</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-market-text mb-1">Phone</h4>
                      <a href="tel:+15551234567" className="text-market-text/80 hover:text-market-accent transition-colors">
                        (555) 123-4567
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-market-accent/10 p-3 rounded-full mr-4">
                      <span className="text-market-accent font-bold">⌖</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-market-text mb-1">Address</h4>
                      <address className="text-market-text/80 not-italic">
                        123 Auto Plaza Drive<br />
                        Anytown, USA 12345
                      </address>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-market-accent/10 p-3 rounded-full mr-4">
                      <span className="text-market-accent font-bold">⏱</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-market-text mb-1">Hours</h4>
                      <div className="text-market-text/80">
                        <p>Monday - Friday: 10:00 AM - 6:00 PM</p>
                        <p>Saturday: 10:00 AM - 2:00 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-[400px] bg-gray-200 rounded-lg overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.0059418846111!3d40.71277667933105!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a1650a3159d%3A0x9c62123678887e13!2sWall%20St%2C%20New%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sca!4v1592936956363!5m2!1sen!2sca" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  title="Market Motors Location"
                  referrerPolicy="no-referrer-when-downgrade">
                </iframe>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-market-accent text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-clarendon mb-6">
              Ready to Find Your Perfect Vehicle?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Browse our selection of quality pre-owned vehicles or contact our showroom. 
              Our friendly team is ready to help you find the right car at the right price.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/inventory" 
                className="px-6 py-3 bg-white text-market-accent font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Browse Inventory
              </Link>
              <a 
                href="#contact" 
                className="px-6 py-3 bg-transparent border border-white text-white font-medium rounded-md hover:bg-white/10 transition-colors"
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
