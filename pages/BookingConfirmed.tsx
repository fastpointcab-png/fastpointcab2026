import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { BookingDetails, TripType } from '../types';

export const BookingConfirmed: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking as BookingDetails | undefined;
  const emailAccepted = location.state?.emailAccepted !== false;

  useEffect(() => {
    if (!booking) navigate('/', { replace: true });
  }, [booking, navigate]);

  if (!booking) return null;

  const handleWhatsAppConfirm = () => {
    const tripDetails = booking.tripType === TripType.RENTAL
      ? `*Package:* ${booking.localPackage || 'Not specified'}\n*Drop:* ${booking.drop || 'Not specified'}`
      : `*Drop:* ${booking.drop || 'Not specified'}${booking.tripType === TripType.ROUND_TRIP ? `\n*Days:* ${booking.numberOfDays || '1'}` : ''}`;
    const dateTimeStr = (booking.date || booking.time)
      ? `*Date/Time:* ${booking.date || 'Not specified'} at ${booking.time || 'Not specified'}`
      : '*Date/Time:* Not specified';
    const customerName = (booking as BookingDetails & { name?: string }).name || 'Web Booking';
    const message =
      `*NEW BOOKING CONFIRMATION*\n` +
      `*Booking ID:* ${booking.leadId || 'Not specified'}\n` +
      `*Customer:* ${customerName}\n` +
      `*Phone:* ${booking.phone}\n` +
      `*Pickup:* ${booking.pickup}\n` +
      `${tripDetails}\n` +
      `${dateTimeStr}\n` +
      `*Vehicle:* ${booking.vehicleType}\n` +
      `*Estimated Fare:* ${booking.estimatedFare || 'Not specified'}`;

    const whatsappUrl = new URL('https://wa.me/919488834020');
    whatsappUrl.searchParams.set('text', message);
    window.open(whatsappUrl.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="booking-confirmed-icon relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <CheckCircle2 size={40} className="booking-confirmed-mark" />
        </div>
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-slate-900">Booking Confirmed!</h1>
        <p className="mb-8 text-[11px] font-bold uppercase leading-relaxed tracking-widest text-slate-500">
          Driver will call you shortly.{!emailAccepted && ' Email notification is pending; your booking is saved.'}
        </p>

        {!emailAccepted && (
          <button
            onClick={handleWhatsAppConfirm}
            className="mb-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#25D366] py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95"
          >
            <MessageCircle size={20} /> Send Booking via WhatsApp
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="w-full cursor-pointer rounded-2xl border border-slate-300 py-4 text-[10px] font-bold uppercase text-slate-900 transition-all hover:bg-slate-100"
        >
          BACK TO HOME
        </button>
      </div>
    </main>
  );
};
