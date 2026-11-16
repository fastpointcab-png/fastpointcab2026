
import React, { useEffect, useRef, useState } from 'react';
import { SERVICES_DATA } from '../constants';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Services: React.FC = () => {
  const servicesRef = useRef<HTMLDivElement>(null);
  const [visibleServices, setVisibleServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sections = servicesRef.current?.querySelectorAll<HTMLElement>('[data-service-id]');
    if (!sections) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleServices(new Set(SERVICES_DATA.map((service) => service.id)));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = (entry.target as HTMLElement).dataset.serviceId;
        if (id) setVisibleServices((current) => new Set(current).add(id));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white pb-0 sm:pb-0 md:pb-16 lg:pb-20">
      <div className="container mx-auto max-w-[1200px] px-4 sm:px-5 md:px-6">
        <header className="grid px-1 pb-8 pt-8 text-left sm:px-0 md:grid-cols-2 md:items-center md:gap-8 md:pb-10 md:pt-10 lg:gap-12 lg:pb-12 lg:pt-14">
          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FF5F68] sm:text-xs">Our Services</p>
            <h1 className="text-[29px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0B1733]  md:text-[34px] lg:text-[44px]">Reliable Cab Services in Coimbatore</h1>
            <div className="mt-4 h-1 w-14 rounded-full bg-[#FF5F68]"></div>
          </div>

          <p className="mt-6 text-sm font-medium leading-[1.6] text-slate-600  md:mt-0 md:text-[15px] lg:text-base lg:leading-[1.7]">
            Safe and reliable <Link to="/taxi-service-in-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">cab services in Coimbatore</Link>, offering city rides, airport transfers, and outstation trips with online booking.
          </p>
          <nav aria-label="Popular taxi services" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[#0B1733] md:col-span-2">
            <Link to="/airport-taxi-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Airport taxi</Link>
            <Link to="/outstation-taxi-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Outstation taxi</Link>
            <Link to="/hourly-taxi-rental-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Hourly taxi rental</Link>
          </nav>
        </header>

        <div ref={servicesRef}>
          {SERVICES_DATA.map((service, index) => (
            <section
              key={service.id}
              data-service-id={service.id}
              className={`grid items-center border-b border-slate-200 py-10 transition-all duration-500 ease-out last:border-b-0  md:grid-cols-2 md:gap-10 md:py-12 lg:gap-16 lg:py-16 motion-reduce:translate-y-0 motion-reduce:transition-none ${visibleServices.has(service.id) ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
            >
              <div className={`flex min-h-[220px] items-center justify-center sm:min-h-[280px] lg:min-h-[360px] ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                <img 
                  src={service.image}
                  alt={service.title}
                  width="800"
                  height="600"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="h-[220px] w-full object-contain sm:h-[280px] lg:h-[360px]"
                />
              </div>

              <div className={`flex flex-col justify-center pt-5 text-left md:pt-0 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                <div className="mb-4 text-xs font-extrabold tracking-[0.16em] text-[#FF5F68]">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#0B1733]  sm:text-3xl">{service.title}</h2>
                <p className="mt-4 text-sm font-medium leading-7 text-slate-600  sm:text-base">
                  {service.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-medium leading-6 text-slate-700 ">
                      <Check className="mt-1 shrink-0 text-[#FF5F68]" size={15} strokeWidth={3} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/"
                  state={{ scrollToBook: true }}
                  className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-[#FF5F68] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#F04F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F68] focus-visible:ring-offset-4 md:w-fit"
                >
                  Book This Service
                </Link>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-4 border-t border-slate-200 px-1 py-6 text-center sm:mt-6 sm:py-6 md:py-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#0B1733]  sm:text-3xl">Plan Your Cab Booking Today</h2>
          <Link
            to="/"
            state={{ scrollToBook: true }}
            className="mt-6 inline-flex rounded-lg bg-[#FF5F68] px-10 py-4 text-xs font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-[#F04F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F68] focus-visible:ring-offset-4"
          >
            Book Now
          </Link>
        </section>
      </div>
    </div>
  );
};
