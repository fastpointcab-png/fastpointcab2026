import React from 'react';
import { BriefcaseBusiness, Check, Luggage, Snowflake, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const travelCategories = [
  { label: 'Group Travel', icon: UsersRound },
  { label: 'Corporate Trips', icon: BriefcaseBusiness },
  { label: 'Tour & Holiday', icon: Snowflake },
  { label: 'Family Events', icon: UsersRound },
];

const features = [
  { value: '12–18', label: 'Seater', icon: UsersRound },
  { value: 'AC', label: 'Comfort', icon: Snowflake },
  { value: 'Luggage', label: 'Space', icon: Luggage },
];

const quoteUrl = 'https://wa.me/919488834020?text=Hi%20FastPointCab%2C%20I%20would%20like%20a%20quote%20for%20Urbania%20rental.';

export const UrbaniaRental: React.FC = () => (
  <div className="min-h-screen overflow-hidden bg-white pb-10 text-[#0B1733] sm:pb-14 lg:pb-16">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pt-7 text-sm font-semibold text-slate-500 sm:pt-9">
        <Link to="/" className="transition-colors hover:text-[#FF5F68]">Home</Link>
        <span aria-hidden="true" className="text-slate-300">›</span>
        <Link to="/fleet" className="transition-colors hover:text-[#FF5F68]">Fleet</Link>
        <span aria-hidden="true" className="text-slate-300">›</span>
        <span className="text-[#FF5F68]">Urbania Rental</span>
      </nav>

      <main>
        <section className="grid items-center gap-8 pb-10 pt-10 md:grid-cols-[0.85fr_1.15fr] md:gap-10 md:pb-14 md:pt-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8 lg:pb-16 lg:pt-16">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#FF5F68]">Premium Group Travel</p>
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
              Urbania <span className="text-[#FF5F68]">Rental</span>
            </h1>
            <p className="mt-6 max-w-md text-lg font-semibold leading-8 text-slate-600 sm:text-xl">
              Spacious, comfortable and premium travel for group journeys.
            </p>
            <div className="mt-6 h-1.5 w-14 rounded-full bg-[#FF5F68]" />

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 sm:gap-4">
              {features.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex min-h-[112px] flex-col items-center justify-center rounded-2xl border border-[#FFE1E4] bg-[#FFF8F8] px-2 py-4 text-center">
                  <Icon size={27} strokeWidth={2.2} className="mb-3 text-[#FF5F68]" aria-hidden="true" />
                  <p className="text-base font-extrabold leading-tight sm:text-lg">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600 sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[230px] items-center justify-center md:min-h-[330px] lg:min-h-[390px]">
            <img
              src="/images/Force-Urbania-Van.webp"
              alt="Force Urbania rental van"
              width="900"
              height="500"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-auto max-h-[390px] w-full object-contain"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr] lg:items-center lg:gap-10" aria-labelledby="rental-information">
          <div className="rounded-2xl border border-[#FFE1E4] bg-[#FFF8F8] p-6 sm:p-8">
            <h2 id="rental-information" className="text-2xl font-extrabold sm:text-3xl">Rental Information</h2>
            <p className="mt-4 text-3xl font-extrabold text-[#159447] sm:text-4xl">Contact for Pricing</p>
            <div className="mt-5 space-y-3 border-t border-[#F5D7DA] pt-5 text-sm font-semibold text-slate-700">
              {['Round Trip', 'Driver Included', 'Clean & Well-maintained'].map((item) => (
                <p key={item} className="flex items-center gap-3"><Check size={18} className="shrink-0 rounded-full bg-[#FF5F68] p-0.5 text-white" aria-hidden="true" />{item}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-0">
            {travelCategories.map(({ label, icon: Icon }, index) => (
              <div key={label} className={`flex flex-col items-center justify-center px-3 text-center ${index > 0 ? 'sm:border-l sm:border-slate-200' : ''}`}>
                <Icon size={38} strokeWidth={1.8} className="text-[#FF5F68]" aria-hidden="true" />
                <span className="mt-3 text-sm font-extrabold sm:text-base">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:mt-14 sm:p-7 md:flex-row md:items-center md:justify-between md:px-8 lg:mt-16" aria-labelledby="urbania-cta">
          <div>
            <h2 id="urbania-cta" className="text-2xl font-extrabold sm:text-3xl">Book Urbania Rental Today</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 sm:text-base">Ideal for family trips, corporate travel, tours and special events.</p>
          </div>
          <div className="flex w-full justify-start md:w-auto md:justify-end">
            <a href={quoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-[#0B1733] px-8 text-sm font-extrabold uppercase tracking-wide text-[#0B1733] transition-colors hover:bg-slate-50">
              Get a Quote
            </a>
          </div>
        </section>
      </main>
    </div>
  </div>
);
