
import React, { useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resetHomepageScroll } from '../utils/homeScroll';

export const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const pendingPathRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (pendingPathRef.current !== pathname) return;

    pendingPathRef.current = null;
    resetHomepageScroll();
  }, [pathname]);

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== '/') return;

    event.preventDefault();
    resetHomepageScroll('smooth');
  };

  const handleQuickLinkClick = (path: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === path) {
      event.preventDefault();
      resetHomepageScroll();
      return;
    }

    pendingPathRef.current = path;
  };

  return (
    <footer className="relative border-t border-slate-100 bg-white pb-24 pt-12 md:pb-6">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.15fr] lg:gap-12">
          <div>
            <Link to="/" onClick={handleHomeClick} className="inline-flex items-center gap-1">
              <span className="text-xl font-extrabold tracking-tight text-[#0B1733]">FastPoint</span>
              <span className="text-xl font-extrabold tracking-tight text-[#FF5F68]">Cab</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Reliable taxi rides in Coimbatore for local travel, airport transfers, outstation trips, and rentals.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#0B1733]">Quick Links</h2>
            <nav className="mt-4 flex flex-col items-start gap-3">
              {[
                ['Home', '/'],
                ['About', '/about'],
                ['Fleet', '/fleet'],
                ['Services', '/services'],
                ['Contact', '/contact'],
              ].map(([item, path]) => (
                <Link
                  key={item}
                  to={path}
                  onClick={(event) => handleQuickLinkClick(path, event)}
                  className="text-sm text-slate-600 transition-colors hover:text-[#FF5F68]"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#0B1733]">Contact</h2>
            <address className="mt-4 flex flex-col gap-3 text-sm not-italic leading-6 text-slate-600">
              <span>Coimbatore, Tamil Nadu, India</span>
              <a href="tel:+919488834020" className="font-semibold text-[#0B1733] transition-colors hover:text-[#FF5F68]">
                +91 94888 34020
              </a>
            </address>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-5 text-xs text-slate-500 md:mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} FastPointCab. All Rights Reserved.</p>
            <p>
              Partner:{' '}
              <a href="https://www.trustyyellowcabs.in/" target="_blank" rel="noopener noreferrer" className="font-medium transition-colors hover:text-[#FF5F68]">
                www.trustyyellowcabs.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
