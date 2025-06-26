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
    phoneHref: string;
    email: string;
    hours: string[];
    googleMapsEmbedUrl: string;
  };
  footer: {
    aboutText: string;
    address: string;
    phone: string;
    phoneHref: string;
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
      title: 'Honest Cars. Honest People.',
      subtitle:
        'Family-owned, serving our community with quality used cars and straightforward service for over 20 years.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      title: 'What You See Is What You Get',
      subtitle:
        'Every vehicle is clearly described—no hidden issues, no sales games, just honest assessments.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      title: 'Part of the Community',
      subtitle:
        'Neighbors helping neighbors find reliable cars—no pressure, no gimmicks.',
    },
  ],
  about: {
    sectionLabel: 'About Market Motors',
    title: 'Family-Owned & Trusted Since 2002',
    description:
      'At Market Motors, we believe buying a used car should be simple and honest. Our family business has served northern Indiana for over 20 years, offering reliable vehicles, straightforward advice, and genuine care for our neighbors.',
    features: [
      {
        title: 'Honest Assessment',
        description:
          'We tell you what we know—good and bad—about every vehicle.',
      },
      {
        title: 'Pressure-Free Shopping',
        description: "Take your time. We're here to help, not to push.",
      },
      {
        title: 'Community Roots',
        description:
          'Proud to be part of northern Indiana for over two decades.',
      },
      {
        title: 'Family Values',
        description:
          'Personal service from people who care about your experience.',
      },
    ],
  },
  contact: {
    sectionLabel: 'Visit Our Dealership',
    title: 'Contact Us',
    description:
      'The best way to shop our vehicles is to visit us in person. Our friendly staff is ready to help you find the right car for your needs—no pressure, just honest advice.',
    address: '23785 US Highway 33, Elkhart Indiana',
    phone: '(574) 875-9700',
    phoneHref: 'tel:+15748759700',
    email: 'info@marketmotors.com',
    hours: [
      'Monday - Friday: 10:00 AM - 6:00 PM',
      'Saturday: 10:00 AM - 2:00 PM',
      'Sunday: Closed',
    ],
    googleMapsEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5963.686104456205!2d-85.92538102401069!3d41.6375237712692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8816e9da5951ff3b%3A0xab819c641f38e4d4!2sMarket%20Motors!5e0!3m2!1sen!2sus!4v1750975526060!5m2!1sen!2sus',
  },
  footer: {
    aboutText:
      'Market Motors is a family-owned used car dealership dedicated to honest service, straightforward advice, and helping our neighbors find quality vehicles—no sales games, just real people.',
    address: '23785 US Highway 33, Elkhart Indiana',
    phone: '(574) 875-9700',
    phoneHref: 'tel:+15748759700',
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
