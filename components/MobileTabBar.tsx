import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Car, Phone, Calendar, Mail } from 'lucide-react';
import { resetHomepageScroll } from '../utils/homeScroll';

export const MobileTabBar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/') return;

    event.preventDefault();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    resetHomepageScroll(behavior);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/fleet', label: 'Fleet', icon: Car },
    { 
      path: '/book-a-trip', 
      label: 'Book', 
      icon: Calendar, 
      isAction: true, 
      isPrimary: true,
      action: () => navigate('/book-a-trip') 
    },
    { 
      path: 'tel:+919488834020', 
      label: 'Call', 
      icon: Phone, 
      isExternal: true,
      isHotline: true
    },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full rounded-t-2xl rounded-b-none bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)]">
      <style>{`\n        @keyframes fp-call-ring {\n          0%, 30%, 100% { transform: rotate(0deg); }\n          6% { transform: rotate(-10deg); }\n          12% { transform: rotate(10deg); }\n          18% { transform: rotate(-7deg); }\n          24% { transform: rotate(5deg); }\n        }\n        .fp-call-ring { animation: fp-call-ring 5s ease-in-out infinite; transform-origin: 50% 50%; }\n        @media (prefers-reduced-motion: reduce) {\n          .fp-call-ring { animation: none; }\n        }\n      `}</style>
      <div className="grid h-[68px] grid-cols-[repeat(5,minmax(0,1fr))] items-stretch overflow-visible rounded-t-2xl rounded-b-none px-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          // Primary CTA Style (Book)
          if (item.isPrimary) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex h-full min-w-0 flex-col items-center justify-end pb-2 text-[#FF6269] transition-all active:scale-95 group"
              >
                <Icon size={22} strokeWidth={2.5} className="group-active:scale-110 transition-transform" />
                <span className="mt-1 text-[9px] font-bold uppercase tracking-tighter text-[#FF6269]">
                  {item.label}
                </span>
              </button>
            );
          }

          // Urgent Action Style (Call)
          if (item.isHotline) {
            return (
              <a
                key={item.label}
                href={item.path}
                className="flex h-full min-w-0 flex-col items-center justify-end pb-2 text-[#0B1733] transition-all active:bg-slate-50 group"
              >
                <Icon size={22} strokeWidth={2.2} className="fp-call-ring text-black" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-black">
                  {item.label}
                </span>
              </a>
            );
          }

          // Standard Nav Items (Home, Fleet, Contact)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={item.path === '/' ? handleHomeClick : undefined}
              className={`relative flex h-full min-w-0 flex-col items-center justify-end pb-2 transition-all group active:scale-95 ${
                'text-black'
              }`}
            >
              <Icon size={22} strokeWidth={2.2} className="group-hover:scale-110 transition-transform" />
              <span className={`text-[9px] font-bold mt-1 uppercase tracking-tighter transition-colors ${
                'text-black'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
