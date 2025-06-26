// Master site config for easy customization

export interface SiteConfig {
  siteName: string;
  heroSlides: Array<{
    image: string;
    title: string;
    subtitle: string;
  }>;
  about: {
    sectionLabel: string;
    title: string;
    description: string;
    features: Array<{
      title: string;
      description: string;
    }>;
  };
  contact: {
    sectionLabel: string;
    title: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    hours: string[];
    googleMapsEmbedUrl: string;
  };
  footer: {
    aboutText: string;
    address: string;
    phone: string;
    email: string;
  };
  styles: {
    fonts: {
      heading: string;
      body: string;
    };
    colors: {
      primary: string;
      secondary: string;
      background: string;
      accent: string;
      secondaryAccent: string;
      tertiaryAccent: string;
      text: string;
    };
    logos: {
      smallLogo: string;
      bigLogo: string;
    };
  };
}

export const siteConfig: SiteConfig = {
  siteName: 'Market Motors',
  heroSlides: [
    {
      image:
        'https://images.unsplash.com/photo-1559416523-140ddc3d238c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      title: 'Find Your Perfect Vehicle',
      subtitle:
        'Discover quality pre-owned cars with confidence and peace of mind.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      title: 'Quality You Can Trust',
      subtitle:
        'Every vehicle is thoroughly inspected and comes with our warranty.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      title: 'Competitive Financing',
      subtitle: 'Get pre-approved with competitive rates and flexible terms.',
    },
  ],
  about: {
    sectionLabel: 'About Market Motors',
    title: 'Family-Owned & Trusted Since 2002',
    description:
      'At Market Motors, we believe that buying a used car should be a comfortable, straightforward experience. Our family-owned dealership has been serving our community for over 20 years, providing reliable vehicles and honest service.',
    features: [
      {
        title: 'Quality Assurance',
        description: 'Every vehicle undergoes a thorough 100-point inspection.',
      },
      {
        title: 'Pressure-Free Shopping',
        description: 'Take your time deciding on the perfect vehicle for you.',
      },
      {
        title: 'Friendly Customer Service',
        description: 'Our knowledgeable staff is here to help, not pressure.',
      },
      {
        title: 'Quality Vehicles',
        description: 'All vehicles are thoroughly inspected.',
      },
    ],
  },
  contact: {
    sectionLabel: 'Visit Our Dealership',
    title: 'Contact Us',
    description:
      'The best way to shop our vehicles is to visit us in person. Our friendly staff is ready to help you find the perfect car.',
    address: '123 Auto Plaza Drive, Anytown, USA 12345',
    phone: '(555) 123-4567',
    email: 'info@marketmotors.com',
    hours: [
      'Monday - Friday: 10:00 AM - 6:00 PM',
      'Saturday: 10:00 AM - 2:00 PM',
      'Sunday: Closed',
    ],
    googleMapsEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.0059418846111!3d40.71277667933105!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a1650a3159d%3A0x9c62123678887e13!2sWall%20St%2C%20New%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sca!4v1592936956363!5m2!1sen!2sca',
  },
  footer: {
    aboutText:
      'Market Motors is a family-owned used car dealership dedicated to providing quality vehicles, honest service, and peace of mind with every purchase.',
    address: '123 Market Street, Hometown, HT 12345',
    phone: '(555) 234-5678',
    email: 'info@marketmotors.com',
  },
  styles: {
    fonts: {
      heading: 'Clarendon, serif',
      body: 'Inter, sans-serif',
    },
    colors: {
      primary: '#405855',
      secondary: '#f7f7f7',
      background: '#fff',
      accent: '#405855',
      secondaryAccent: '#e9bf22',
      tertiaryAccent: '#B36B42',
      text: '#333333',
    },
    logos: {
      smallLogo: '/icon.png',
      bigLogo: '/logo.png',
    },
  },
};
