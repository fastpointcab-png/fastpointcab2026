import React, { useLayoutEffect } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { SEO } from './components/SEO';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
const Fleet = React.lazy(() => import('./pages/Fleet').then((module) => ({ default: module.Fleet })));
const Services = React.lazy(() => import('./pages/Services').then((module) => ({ default: module.Services })));
const About = React.lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = React.lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const UrbaniaRental = React.lazy(() => import('./pages/UrbaniaRental').then((module) => ({ default: module.UrbaniaRental })));
const BookATrip = React.lazy(() => import('./pages/BookATrip').then((module) => ({ default: module.BookATrip })));
const BookingConfirmed = React.lazy(() => import('./pages/BookingConfirmed').then((module) => ({ default: module.BookingConfirmed })));
import { FloatingCallButton } from './components/FloatingCallButton';
import { MobileTabBar } from './components/MobileTabBar';
const TaxiServiceCoimbatore = React.lazy(() => import('./pages/TaxiServiceCoimbatore').then((module) => ({ default: module.TaxiServiceCoimbatore })));
const SeoLandingPage = React.lazy(() => import('./pages/SeoLandingPage').then((module) => ({ default: module.SeoLandingPage })));
import { PUBLISHED_SEO_PAGES } from './data/seoPageCandidates';
import { resetHomepageScroll } from './utils/homeScroll';


const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname !== '/') return;

    resetHomepageScroll();
  }, [pathname]);

  return null;
};

const NotFound: React.FC = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-6 text-center">
    <p className="text-xs font-bold uppercase tracking-widest text-[#FF5F68]">FastPointCab</p>
    <h1 className="mt-3 text-4xl font-extrabold text-[#0B1733]">Page not found</h1>
    <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">The page you requested does not exist.</p>
    <a href="/" className="mt-6 rounded-lg bg-[#FF5F68] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white">Return home</a>
  </div>
);

const App: React.FC = () => {
  const { pathname } = useLocation();
  const [homeBookingMapOpen, setHomeBookingMapOpen] = React.useState(false);
  const isBookingConfirmed = pathname === '/booking-confirmed';
  const isBookATripPage = pathname === '/book-a-trip';

  return (
    <>
      <ScrollToTop />
      <SEO pathname={pathname} />
      <div className={`min-h-screen flex flex-col bg-white ${isBookATripPage ? 'book-a-trip-app-shell' : ''}`}>
        {!isBookingConfirmed && (
          <div className={isBookATripPage ? 'book-a-trip-desktop-chrome' : undefined}>
            <Navbar />
          </div>
        )}
        <main className={isBookATripPage ? 'flex-grow book-a-trip-main' : 'flex-grow'}>
          <React.Suspense fallback={null}>
            <Routes>
            <Route path="/" element={<Home onBookingMapChange={setHomeBookingMapOpen} />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/urbania-rental" element={<UrbaniaRental />} />
            <Route path="/taxi-service-in-coimbatore" element={<TaxiServiceCoimbatore />} />
            {PUBLISHED_SEO_PAGES
              .filter((page) => page.category !== 'existing')
              .map((page) => <Route key={page.path} path={page.path} element={<SeoLandingPage />} />)}
            <Route path="/book-a-trip" element={<BookATrip />} />
            <Route path="/booking-confirmed" element={<BookingConfirmed />} />
            <Route path="/bill-request" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
           
          

            </Routes>
          </React.Suspense>
        </main>
        {!isBookingConfirmed && (
          <div className={isBookATripPage ? 'book-a-trip-desktop-chrome' : undefined}>
            <Footer />
          </div>
        )}
        {!isBookingConfirmed && (
          <div className={isBookATripPage ? 'book-a-trip-desktop-chrome' : undefined}>
            <FloatingCallButton />
          </div>
        )}
        {!isBookingConfirmed && pathname !== '/book-a-trip' && !(pathname === '/' && homeBookingMapOpen) && <MobileTabBar />}
      </div>
    </>
  );
};

export default App;
