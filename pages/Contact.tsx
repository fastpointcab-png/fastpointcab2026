import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const Contact: React.FC = () => {
  const [showTerms, setShowTerms] = useState(false);

  const handleWhatsAppClick = () => {
    const text = `Hi Fastpointcab, I have an inquiry about your taxi services in Coimbatore.`;
    const phoneNumber = '919488834020';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-white pb-0 pt-10  sm:pt-12 md:min-h-screen md:py-12 lg:py-16">
      <div className="container mx-auto max-w-[1200px] px-5 md:px-6">
        <header className="mb-10 max-w-3xl text-left sm:mb-12">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FF5F68] sm:text-xs">Contact Us</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-[#0B1733]  sm:text-4xl lg:text-5xl">Get in Touch</h1>
          <div className="my-4 h-1 w-14 rounded-full bg-[#FF5F68]"></div>
          <p className="text-sm font-medium leading-7 text-slate-600  sm:text-base">
            Fast pointCab for 24/7 safe and reliable taxi services in Coimbatore, Tamil Nadu.
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-[45fr_55fr] lg:gap-0">
          <section className="lg:border-r lg:border-slate-200 lg:pr-10 ">
            <h2 className="mb-6 text-2xl font-extrabold text-[#0B1733] ">Customer Support</h2>
            <div className="border-t border-slate-200 ">
              <a href="tel:+919488834020" className="group flex items-start gap-4 border-b border-slate-200 py-5 ">
                <Phone size={18} className="mt-1 shrink-0 text-[#FF5F68]" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#0B1733] ">Phone</p>
                  <p className="mt-1 text-sm font-medium text-slate-600 transition-colors group-hover:text-[#FF5F68] ">+91 94888 34020</p>
                </div>
              </a>

              <a href="mailto:fastpointcab@gmail.com" className="group flex items-start gap-4 border-b border-slate-200 py-5 ">
                <Mail size={18} className="mt-1 shrink-0 text-[#FF5F68]" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#0B1733] ">Email</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-600 transition-colors group-hover:text-[#FF5F68] ">fastpointcab@gmail.com</p>
                </div>
              </a>

              <div className="flex items-start gap-4 border-b border-slate-200 py-5 ">
                <MapPin size={18} className="mt-1 shrink-0 text-[#FF5F68]" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#0B1733] ">Address</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600 ">
                    Fastpoint Cab – Taxi Services <br />
                    Coimbatore, Tamil Nadu 641014
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:pl-10">
            <h2 className="mb-4 text-2xl font-extrabold text-[#0B1733] ">Direct WhatsApp Booking</h2>
            <p className="mb-7 text-sm font-medium leading-7 text-slate-600  sm:text-base">
              Reach out 24/7 for instant taxi booking including outstation and business travel in Coimbatore.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleWhatsAppClick}
                className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#25D366] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1DA851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-4"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Message on WhatsApp
              </button>

              <a
                href="tel:+919488834020"
                className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#E2E8F0] bg-white px-6 text-sm font-semibold text-[#0B1733] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-4    "
              >
                <Phone size={18} aria-hidden="true" />
                Call Directly
              </a>
            </div>
          </section>
        </div>

        <section className="mt-10 sm:mt-12">
          <div className="h-[240px] w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white   md:h-[300px] md:rounded-2xl lg:h-[350px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125322.44163071375!2d76.88483286780826!3d11.014203302096378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859af2f971cb5%3A0x2fc1c817186f121b!2sCoimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1709555000000!5m2!1sen!2sin"
              className="h-full w-full"
              loading="eager"
              title="Coimbatore Map"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section className="mt-8 border-b border-slate-200  sm:mt-10">
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="flex w-full items-center justify-between py-5 text-left text-base font-bold text-[#0B1733] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F68]  sm:text-lg"
            aria-expanded={showTerms}
          >
            <span>Terms and Conditions</span>
            {showTerms ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showTerms && (
            <div className="space-y-2 border-t border-slate-200 py-5 text-sm leading-6 text-slate-600  ">
              <p>1. All taxi bookings are subject to availability.</p>
              <p>2. Customers must provide accurate pickup and drop location details.</p>
              <p>3. Payments can be made in cash or via approved digital payment methods.</p>
              <p>4. FastPointCab & Trustyyellowcabs is not responsible for delays due to traffic, weather, or unforeseen circumstances.</p>
              <p>5. Cancellation policies apply; cancellation fees are applicable. Please refer to our cancellation terms when booking.</p>
              <p>6. By using our services, you agree to follow all applicable local regulations.</p>
              <p>7. One day is equal to one calendar day (from midnight to midnight).</p>
              <p>8. Parking, toll, and interstate permit charges are extra.</p>
              <p>9. Driver allowance will be extra if the driver drives between 10:00 PM to 6:00 AM.</p>
              <p>10. Total km and time calculation is from office to office.
                Fare shown during booking is an estimate only. Final fare will be based on actual distance traveled and applicable tariff.
              </p>
              <p>11. AC will not work in hill areas (upwards) and stopped/parked vehicles.</p>
              <p>12. If km usage exceeds standard limits, tariff shifts automatically to Day/KM Basis.</p>
              <p>13. Bookings made via online ads (e.g., Google Ads) may appear when searching for other brands. Trustyyellowcabs is only responsible for bookings actually made with us. Customers cannot claim services from other brands using our ad links.</p>
              <p>14. Our website and booking page may appear in search results when customers search for other taxi brand names. By clicking our advertisement, website link, WhatsApp, or call button, the customer acknowledges that they are contacting our company directly, not any other brand.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
