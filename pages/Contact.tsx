import React from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const handleWhatsAppClick = () => {
    // General inquiry message for WhatsApp
    const text = `Hi Trustyyellowcabs, I have an inquiry about your taxi services in Coimbatore.`;
    const phoneNumber = '919488834020';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Online taxi booking support</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Book a safe and comfortable ride in Coimbatore anytime — 24/7 support and hassle-free Kovai red taxi booking available.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Customer Support</h3>
                <div className="space-y-8">
                  <a href="tel:+918870088020" className="flex items-start gap-6 group">
                   <div className="bg-[#FF6467]/20 dark:bg-[#FF6467]/30 p-4 rounded-2xl text-[#FF6467] group-hover:bg-[#FF6467] group-hover:text-white transition-all duration-300">
  <Phone size={24} />
</div>

                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-lg group-hover:text-[#FF6467] transition-colors">Phone</p>

                      <p className="text-slate-600 dark:text-slate-400 group-hover:text-[#FF6467] transition-colors font-medium">+91 94888 34020</p>

                    </div>
                  </a>
                  <a href="mailto:trustyyellowcabs@gmail.com" className="flex items-start gap-6 group">
  <div className="bg-[#FF6467]/20 dark:bg-[#FF6467]/30 p-4 rounded-2xl text-[#FF6467] group-hover:bg-[#FF6467] group-hover:text-white transition-all duration-300">
    <Mail size={24} />
  </div>
  <div>
    <p className="font-semibold text-slate-900 dark:text-white text-lg group-hover:text-[#FF6467] transition-colors">Email</p>
    <p className="text-slate-600 dark:text-slate-400 group-hover:text-[#FF6467] transition-colors font-medium">fastpointcab@gmail.com</p>
  </div>
</a>
 <div className="flex items-start gap-6 group">
  <div className="bg-[#FF6467]/20 dark:bg-[#FF6467]/30 p-4 rounded-2xl text-[#FF6467] group-hover:bg-[#FF6467] group-hover:text-white transition-all duration-300">
    <MapPin size={24} />
  </div>
  <div>
    <p className="font-semibold text-slate-900 dark:text-white text-lg group-hover:text-[#FF6467] transition-colors">Address</p>
    <p className="text-slate-600 dark:text-slate-400 group-hover:text-[#FF6467] transition-colors">
     Fastpoint Cab-Taxi services<br />
      Coimbatore, Tamil Nadu 641014
    </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Map Embed */}
              <div className="w-full h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 mt-12">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125322.44163071375!2d76.88483286780826!3d11.014203302096378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859af2f971cb5%3A0x2fc1c817186f121b!2sCoimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1709555000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Coimbatore Map"
                  className="grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Quick Connect / WhatsApp */}
          <div className="flex flex-col justify-center bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border-2 border-dashed border-[#FF6467]/30 dark:border-[#FF6467]/50 text-center shadow-xl shadow-[#FF6467]/25 dark:shadow-none">
  <div className="w-24 h-24 bg-[#FF6467]/20 dark:bg-[#FF6467]/30 rounded-full flex items-center justify-center text-[#FF6467] mx-auto mb-8 animate-pulse-slow">
    <MessageCircle size={48} />
  </div>

  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-[#FF6467] transition-colors">
    Direct WhatsApp Booking
  </h3>

  <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-md mx-auto group-hover:text-[#FF6467] transition-colors">
   Reach out 24/7 for Instant taxi , including Outstation Cab Booking and business travel in Covai.
  </p>
            <div className="space-y-4">
              <button 
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl shadow-green-500/25 text-xl"
              >
                <MessageCircle size={24} />
                Message on WhatsApp
              </button>
              
              <a 
                href="tel:+919488834020"
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all text-xl"
              >
                <Phone size={24} />
                Call Directly
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};