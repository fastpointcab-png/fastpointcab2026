import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookingDetails, VehicleType } from '../types';
import { MapPin, User, Phone, Car, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Map as MapIcon, AlertTriangle } from 'lucide-react';
import { sendBookingEmail } from '../services/emailService';

declare const google: any;

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 24,
  [VehicleType.SEDAN]: 27,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const STANDARD_BASE_FARE = 80;
const PREMIUM_BASE_FARE = 150;

const NO_FARE_VEHICLES = [
  VehicleType.LUXURY,
  VehicleType.TEMPO_TRAVELLER,
  VehicleType.TOURIST_BUS,
  VehicleType.CUSTOM
];

const InputWrapper = memo(({ children, icon: Icon, label }: { children: React.ReactNode; icon: any; label?: string }) => (
  <div className="relative group w-full">
    {label && <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-yellow transition-colors duration-300 pointer-events-none z-10">
        <Icon size={16} />
      </div>
      {children}
    </div>
  </div>
));

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const pickupRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const mapInstance = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const pickupAutocomplete = useRef<any>(null);
  const dropAutocomplete = useRef<any>(null);

  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [loadingFare, setLoadingFare] = useState(false);
  const [indiaToday, setIndiaToday] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BookingDetails>({
    name: '',
    phone: '',
    pickup: '',
    drop: '',
    date: '',
    time: '',
    vehicleType: VehicleType.MINI,
    distance: '',
    estimatedFare: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    setIndiaToday(dateStr);

    if ((window as any).google?.maps) {
      setGoogleLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!googleLoaded || !mapRef.current || mapInstance.current) return;

    try {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 11.0168, lng: 76.9558 },
        zoom: 12,
        disableDefaultUI: true,
        styles: [
          { featureType: "landscape", elementType: "all", stylers: [{ color: "#f8fafc" }] },
          { featureType: "road", elementType: "all", stylers: [{ saturation: -100 }, { lightness: 45 }] },
          { featureType: "water", elementType: "all", stylers: [{ color: "#bae6fd" }] }
        ]
      });

      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: mapInstance.current,
        polylineOptions: { strokeColor: "#FF6467", strokeWeight: 6, strokeOpacity: 0.95 },
        suppressMarkers: false
      });

      const COIMBATORE_BOUNDS = new google.maps.LatLngBounds(
        new google.maps.LatLng(10.60, 76.65),
        new google.maps.LatLng(11.35, 77.10)
      );

      const options = {
        bounds: COIMBATORE_BOUNDS,
        strictBounds: false,
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry'],
      };

      if (pickupRef.current) {
        pickupAutocomplete.current = new google.maps.places.Autocomplete(pickupRef.current, options);
        pickupAutocomplete.current.addListener('place_changed', () => {
          const place = pickupAutocomplete.current.getPlace();
          if (place.formatted_address) setFormData(prev => ({ ...prev, pickup: place.formatted_address }));
        });
      }
      if (dropRef.current) {
        dropAutocomplete.current = new google.maps.places.Autocomplete(dropRef.current, options);
        dropAutocomplete.current.addListener('place_changed', () => {
          const place = dropAutocomplete.current.getPlace();
          if (place.formatted_address) setFormData(prev => ({ ...prev, drop: place.formatted_address }));
        });
      }

    } catch (e) {
      console.error("Map Initialization Error:", e);
    }
  }, [googleLoaded]);

  const updateMapRoute = useCallback((origin: string, destination: string) => {
    if (!googleLoaded || !origin || !destination || !directionsRenderer.current) return;
    directionsService.current.route(
      { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
          setMapError(null);
        } else {
          setMapError("Route update failed.");
        }
      }
    );
  }, [googleLoaded]);

  useEffect(() => {
    if (formData.pickup && formData.drop) updateMapRoute(formData.pickup, formData.drop);
  }, [formData.pickup, formData.drop, updateMapRoute]);

 const calculateFare = useCallback((origin: string, destination: string, vehicle: VehicleType) => {
  if (NO_FARE_VEHICLES.includes(vehicle)) {
    setFormData(prev => ({ ...prev, distance: '', estimatedFare: 'Manual Quote' }));
    return;
  }

  if (!origin || !destination || !(window as any).google?.maps) return;

  setLoadingFare(true);
  const service = new google.maps.DistanceMatrixService();

  service.getDistanceMatrix(
    {
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    },
    (response: any, status: string) => {
      setLoadingFare(false);

      if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
        const distanceText = response.rows[0].elements[0].distance.text;
        const distanceValue = response.rows[0].elements[0].distance.value / 1000;

        // 👉 Base fare by vehicle type
       const isPremiumSUV = [VehicleType.SUV, VehicleType.SUV_PLUS, VehicleType.INNOVA].includes(vehicle);

// 🚫 If SUV and distance ≤ 5 km → no auto fare
if (isPremiumSUV && distanceValue <= 5) {
  setFormData(prev => ({
    ...prev,
    distance: distanceText,
    estimatedFare: 'On-Call Quote'
  }));
  return;
}

// ✅ Normal fare calculation
const baseFare = isPremiumSUV ? PREMIUM_BASE_FARE : STANDARD_BASE_FARE;
const perKmRate = PRICING[vehicle];

// 👉 Always: (km × rate) + base fare
const calculatedFare = Math.round(distanceValue * perKmRate) + baseFare;

setFormData(prev => ({
  ...prev,
  distance: distanceText,
  estimatedFare: `₹${calculatedFare}`
}));

      }
    }
  );
}, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    const p = pickupRef.current?.value || formData.pickup;
    const d = dropRef.current?.value || formData.drop;
    if (p && d) {
      setFormData(prev => ({ ...prev, pickup: p, drop: d }));
      calculateFare(p, d, formData.vehicleType);
      setStep(2);
      setTimeout(() => {
        if (mapInstance.current) {
          google.maps.event.trigger(mapInstance.current, 'resize');
          if (directionsRenderer.current && directionsRenderer.current.getDirections()) {
            mapInstance.current.fitBounds(directionsRenderer.current.getDirections().routes[0].bounds);
          }
        }
      }, 50);
    } else {
      alert("Please enter pickup and destination.");
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const success = await sendBookingEmail(formData);
    if (success) {
      setSubmitted(true);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert("Booking failed. Please try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Error sending booking. Check console.");
  } finally {
    setLoading(false);
  }
};


  

 const handleWhatsAppConfirm = () => {
  const message = `*NEW BOOKING CONFIRMATION*%0A*Name:* ${formData.name}%0A*Phone:* ${formData.phone}%0A*Pickup:* ${formData.pickup}%0A*Drop:* ${formData.drop}%0A*Fare:* ${formData.estimatedFare}`;
  window.open(`https://wa.me/919488834020?text=${message}`, '_blank');
};

if (submitted) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-sm mx-auto">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 relative">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Booking Sent!</h2>
      <p className="text-[11px] text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">Driver details will arrive via phone call.</p>

      {/* WhatsApp Confirm Button */}
      <button 
        onClick={handleWhatsAppConfirm} 
        className="w-full bg-[#25D366] text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg text-[10px] uppercase tracking-widest active:scale-95 transition-all mb-3"
      >
        <MessageCircle size={50} /> WhatsApp support
      </button>

      {/* Book Another Ride Button */}
      <button 
  onClick={() => {
    setSubmitted(false);      // go back to the form
    setStep(1);               // start from step 1
    setFormData({             // reset all fields
      name: '',
      phone: '',
      pickup: '',
      drop: '',
      date: '',
      time: '',
      vehicleType: VehicleType.MINI,
      distance: '',
      estimatedFare: '',
    });

    // Re-initialize map/autocomplete after a short delay
    setTimeout(() => {
      if (pickupRef.current) pickupRef.current.value = '';
      if (dropRef.current) dropRef.current.value = '';
      
      // Clear directions if any
      if (directionsRenderer.current) directionsRenderer.current.setDirections({ routes: [] });

      // Trigger useEffect that sets up autocomplete
      setStep(1); 
    }, 50);
  }} 
  className="w-full text-[10px] font-bold text-slate-900 dark:text-white uppercase border border-slate-300 dark:border-slate-700 rounded-2xl py-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
>
  Book Another Ride
</button>
    </div>
  );
}


  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm mx-auto transition-all duration-500 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {step === 1 ? 'Trip Details' : 'Confirm Booking'}
        </h3>
        <div className="flex gap-2">
          <div className={`h-1 w-6 rounded-full transition-all ${step === 1 ? 'bg-brand-yellow' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1 w-6 rounded-full transition-all ${step === 2 ? 'bg-brand-yellow' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1 */}
        <div className={`${step === 1 ? 'space-y-4' : 'hidden'} animate-fade-in`}>
          <InputWrapper icon={MapPin} label="Pickup">
            <input ref={pickupRef} type="text" required placeholder="Enter Pickup Location" defaultValue={formData.pickup} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-brand-yellow rounded-xl text-xs font-bold outline-none dark:text-white" />
          </InputWrapper>
          <InputWrapper icon={MapPin} label="Destination">
            <input ref={dropRef} type="text" required placeholder="Enter Destination" defaultValue={formData.drop} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-brand-yellow rounded-xl text-xs font-bold outline-none dark:text-white" />
          </InputWrapper>
          <div className="grid grid-cols-2 gap-4">
            <InputWrapper icon={Calendar} label="Date (Optional)">
              <input type="date" name="date" min={indiaToday} value={formData.date} onChange={handleChange} className="w-full pl-11 pr-2 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white" />
            </InputWrapper>
            <InputWrapper icon={Clock} label="Time (Optional)">
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-11 pr-2 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white" />
            </InputWrapper>
          </div>
<button 
  type="button" 
  onClick={handleNextStep} 
  className="w-full bg-gradient-to-r from-red-400 to-red-300 dark:from-red-200 dark:to-red-100
             text-white dark:text-red-900 font-extrabold py-3 px-4 rounded-2xl 
             flex items-center justify-center gap-3 shadow-xl text-base uppercase tracking-wide 
             active:scale-95 transform transition-all duration-200"
>
  Continue Booking<ArrowRight size={28} />
</button>
 </div>
 {/* Step 2 */}
        <div className={`${step === 2 ? 'space-y-4' : 'hidden'} animate-fade-in`}>
          <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner">
            <div ref={mapRef} className="w-full h-full" />
            {mapError && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-4 text-center">
                <AlertTriangle size={20} className="text-brand-yellow mb-1" />
                <p className="text-[9px] text-white font-bold uppercase">{mapError}</p>
              </div>
            )}
            {!mapError && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/70 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-tighter flex items-center gap-1.5 z-10">
                <MapIcon size={10} /> Live Route Map
              </div>
            )}
          </div>

          <div className="bg-brand-yellow/5 dark:bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Estimated Fare</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {loadingFare ? '...' : formData.estimatedFare || '₹0'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Distance</span>
              <span className="text-xs font-black text-brand-yellow">{formData.distance || '--- km'}</span>
            </div>
          </div>

          <InputWrapper icon={Car} label="Select Vehicle">
            <select name="vehicleType" value={formData.vehicleType} onChange={(e) => {
              const v = e.target.value as VehicleType;
              setFormData(prev => ({ ...prev, vehicleType: v }));
              calculateFare(formData.pickup, formData.drop, v);
            }} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer">
              {Object.values(VehicleType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </InputWrapper>

          <div className="grid grid-cols-1 gap-3">
            <InputWrapper icon={User}>
              <input type="text" name="name" required placeholder="Your Name" value              ={formData.name} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-brand-yellow rounded-xl text-xs font-bold outline-none dark:text-white" />
            </InputWrapper>
            <InputWrapper icon={Phone}>
              <input type="tel" name="phone" required placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full pl-11 pr-4 py-4 border-2 border-brand-yellow rounded-xl text-base font-black outline-none dark:bg-slate-950 dark:text-white" />
            </InputWrapper>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
              <ArrowLeft size={20} />
            </button>
            <button
  type="submit"
  disabled={loading}
  className="flex-1 
             bg-gradient-to-r from-red-400 to-red-300 
             dark:from-red-200 dark:to-red-100
             text-white dark:text-red-900 
             font-black py-4.5 rounded-2xl 
             shadow-xl shadow-red-400/20 
             uppercase tracking-widest text-[10px] 
             active:scale-95 transform transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Processing...' : 'Confirm Booking'}
</button>

            
          </div>
        </div>
      </form>
    </div>
  );
};

