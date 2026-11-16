import React, { useEffect } from 'react';
import { SEO_PAGE_CANDIDATES } from '../data/seoPageCandidates';

export const SITE_URL = 'https://www.fastpointcab.in';
const LOGO_URL = `${SITE_URL}/images/taxi-icon-512.png`;

type SeoRoute = 'home' | 'about' | 'fleet' | 'services' | 'contact' | 'urbania-rental' | 'taxi-service' | 'book-a-trip' | 'booking-confirmed';

const routeSeo: Record<SeoRoute, { title: string; description: string; path: string; noindex?: boolean }> = {
  home: {
    title: 'Taxi Service in Coimbatore | FastPointCab',
    description: 'Book FastPointCab for city taxi rides, airport transfers, outstation trips, and hourly rentals in Coimbatore.',
    path: '/',
  },
  about: {
    title: 'About FastPointCab | Coimbatore Taxi Service',
    description: 'Learn about FastPointCab and our approach to dependable city, airport, and outstation taxi services in Coimbatore.',
    path: '/about',
  },
  fleet: {
    title: 'Taxi Fleet in Coimbatore | FastPointCab',
    description: 'Explore FastPointCab vehicles for Coimbatore city rides, airport transfers, rentals, and outstation travel.',
    path: '/fleet',
  },
  services: {
    title: 'Local, Airport & Outstation Taxi Services | FastPointCab',
    description: 'View FastPointCab taxi services in Coimbatore, including local rides, airport transfers, hourly rentals, and outstation trips.',
    path: '/services',
  },
  contact: {
    title: 'Contact FastPointCab | Coimbatore Taxi Booking',
    description: 'Contact FastPointCab for taxi booking, WhatsApp support, and reliable travel services in Coimbatore, Tamil Nadu.',
    path: '/contact',
  },
  'urbania-rental': {
    title: 'Urbania Rental in Coimbatore | FastPointCab',
    description: 'Book a spacious Force Urbania rental in Coimbatore for group travel, corporate trips, tours, holidays, and family events.',
    path: '/urbania-rental',
  },
  'taxi-service': {
    title: 'Taxi Service in Coimbatore | FastPointCab',
    description: 'Book a Coimbatore taxi with FastPointCab for local rides, airport transfers, hourly rentals, outstation trips, and business travel.',
    path: '/taxi-service-in-coimbatore',
  },
  'book-a-trip': {
    title: 'Book a Trip | FastPointCab',
    description: 'Book a taxi trip with FastPointCab in Coimbatore.',
    path: '/book-a-trip',
    noindex: true,
  },
  'booking-confirmed': {
    title: 'Booking Confirmed | FastPointCab',
    description: 'Your FastPointCab booking confirmation.',
    path: '/booking-confirmed',
    noindex: true,
  },
};

const getRouteSeo = (pathname: string) => {
  const configuredPage = SEO_PAGE_CANDIDATES.find((page) => page.path === pathname && page.status === 'published');
  if (configuredPage) return { ...configuredPage, noindex: false };
  if (pathname === '/') return routeSeo.home;
  if (pathname === '/about') return routeSeo.about;
  if (pathname === '/fleet') return routeSeo.fleet;
  if (pathname === '/services') return routeSeo.services;
  if (pathname === '/contact') return routeSeo.contact;
  if (pathname === '/urbania-rental') return routeSeo['urbania-rental'];
  if (pathname === '/taxi-service-in-coimbatore') return routeSeo['taxi-service'];
  if (pathname === '/book-a-trip') return routeSeo['book-a-trip'];
  if (pathname === '/booking-confirmed') return routeSeo['booking-confirmed'];
  return {
    title: 'Page Not Found | FastPointCab',
    description: 'The requested FastPointCab page could not be found.',
    path: pathname,
    noindex: true,
  };
};

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'FastPointCab',
  url: SITE_URL,
  logo: LOGO_URL,
  telephone: '+919488834020',
};

const localBusiness = {
  '@type': 'TaxiService',
  '@id': `${SITE_URL}/#taxi-service`,
  name: 'FastPointCab',
  url: SITE_URL,
  logo: LOGO_URL,
  telephone: '+919488834020',
  areaServed: {
    '@type': 'City',
    name: 'Coimbatore',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Coimbatore',
    addressRegion: 'Tamil Nadu',
    postalCode: '641014',
    addressCountry: 'IN',
  },
  parentOrganization: { '@id': `${SITE_URL}/#organization` },
};

export const SEO: React.FC<{ pathname: string }> = ({ pathname }) => {
  const seo = getRouteSeo(pathname);
  const canonical = `${SITE_URL}${seo.path === '/' ? '/' : seo.path}`;
  const configuredPage = SEO_PAGE_CANDIDATES.find((page) => page.path === pathname && page.status === 'published');
  const graph: Record<string, unknown>[] = [organization, localBusiness, {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'FastPointCab',
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }];

  if (pathname === '/services' || pathname === '/taxi-service-in-coimbatore' || Boolean(configuredPage && configuredPage.category !== 'existing')) {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: 'Taxi service in Coimbatore',
      serviceType: 'Taxi service',
      provider: { '@id': `${SITE_URL}/#taxi-service` },
      areaServed: { '@type': 'City', name: 'Coimbatore' },
      description: seo.description,
    });
  }

  if (pathname !== '/' && !seo.noindex) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: seo.title.split(' | ')[0], item: canonical },
      ],
    });
  }

  useEffect(() => {
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      const matches = Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));
      const meta = matches[0] || document.createElement('meta');
      matches.slice(1).forEach((node) => node.remove());
      meta.setAttribute(attribute, key);
      meta.setAttribute('content', content);
      if (!meta.parentNode) document.head.appendChild(meta);
    };
    const canonicalLinks = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
    const canonicalLink = canonicalLinks[0] || document.createElement('link');
    canonicalLinks.slice(1).forEach((node) => node.remove());
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonical;
    if (!canonicalLink.parentNode) document.head.appendChild(canonicalLink);
    document.title = seo.title;
    setMeta('meta[name="description"]', 'name', 'description', seo.description);
    setMeta('meta[name="robots"]', 'name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'FastPointCab');
    setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', LOGO_URL);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', LOGO_URL);
    const script = (document.getElementById('seo-jsonld') as HTMLScriptElement | null) || document.createElement('script');
    script.id = 'seo-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    if (!script.parentNode) document.head.appendChild(script);
  }, [pathname]);

  return null;
};
