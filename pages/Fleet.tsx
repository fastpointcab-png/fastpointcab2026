import React from 'react';
import { FLEET_DATA } from '../constants';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Fleet: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pb-14  sm:pb-16 lg:pb-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-6 lg:px-8">
        <header className="grid px-1 pb-8 pt-8 text-left sm:px-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end md:gap-12 md:pb-10 md:pt-12 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-14 lg:pt-16">
          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FF5F68] md:text-xs">
              Explore Our Vehicles
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-none tracking-[-0.035em] text-[#0B1733]  md:text-[44px] lg:text-[56px]">
              Our Fleet
            </h1>
            <div className="mt-4 h-1 w-14 rounded-full bg-[#FF5F68]"></div>
          </div>

          <p className="mt-6 max-w-[650px] text-sm font-medium leading-[1.7] text-slate-600  md:mt-0 md:text-[15px] lg:text-base">
            Book your Coimbatore taxi or outstation taxi from our wide range of vehicles, from budget sedans to premium coaches.
          </p>
          <nav aria-label="Vehicle taxi pages" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[#0B1733] md:col-span-2">
            <Link to="/mini-taxi-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Mini taxi</Link>
            <Link to="/sedan-taxi-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Sedan taxi</Link>
            <Link to="/suv-taxi-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">SUV taxi</Link>
            <Link to="/innova-taxi-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Innova taxi</Link>
            <Link to="/tempo-traveller-rental-coimbatore" className="underline decoration-[#FF5F68]/50 underline-offset-4">Tempo Traveller rental</Link>
            <Link
              to="/urbania-rental"
              onClick={() => document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
              className="underline decoration-[#FF5F68]/50 underline-offset-4"
            >
              Urbania rental
            </Link>
          </nav>
        </header>

        <div className="space-y-0 md:space-y-6 lg:space-y-8">
          {FLEET_DATA.map((car, index) => (
            <section
              key={car.id}
              className="group grid overflow-hidden border-b border-slate-200 bg-white py-8 first:pt-0 last:border-b-0   md:grid-cols-2 md:rounded-[22px] md:border md:py-0 md:shadow-[0_10px_35px_rgba(15,23,42,0.05)] md:transition-shadow md:duration-300 md:hover:shadow-[0_16px_45px_rgba(15,23,42,0.09)]"
            >
              <div className={`relative flex min-h-[230px] items-center justify-center bg-white px-0 py-2  sm:min-h-[260px] md:p-7 lg:min-h-[320px] lg:p-10 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                <img 
                  src={car.image} 
                  alt={car.name} 
                  width="800"
                  height="500"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="h-full max-h-[280px] w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                />
              </div>

              <div className={`flex flex-col justify-center px-0 pb-0 pt-4 md:border-t-0 md:p-8 lg:p-10 ${index % 2 === 0 ? 'md:order-1 md:border-r md:border-slate-100 ' : 'md:order-2 md:border-l md:border-slate-100 '}`}>
                <div className="mb-4">
                  <span className="inline-flex rounded-md bg-[#FFF0F2] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#FF5F68] ">
                    {car.type}
                  </span>
                  <h3 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-[-0.02em] text-[#0B1733]  lg:text-3xl">
                    {car.name}
                  </h3>
                </div>

                <div className="mb-5 flex text-sm font-semibold text-slate-600  md:mb-6 md:text-[10px] md:font-bold md:uppercase md:tracking-widest">
                  <div className="flex items-center gap-2 md:rounded-lg md:bg-slate-100 md:px-3 md:py-2 ">
                    <Users size={15} className="hidden text-[#FF5F68] md:block" aria-hidden="true" />
                    <span>{car.capacity} Seats Available</span>
                  </div>
                </div>

                <div className="mb-7 grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-1 lg:grid-cols-2">
                  {car.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm font-medium leading-5 text-slate-600 ">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5F68]"></span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link 
                  to="/" 
                  state={{ scrollToBook: true }}
                  className="block w-full rounded-lg bg-[#FF5F68] px-6 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(255,95,104,0.22)] transition-all duration-300 hover:bg-[#F04F59] hover:shadow-[0_10px_24px_rgba(255,95,104,0.3)] active:scale-[0.98] md:w-fit md:min-w-56"
                >
                  Book This Vehicle
                </Link>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
