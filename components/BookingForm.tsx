import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookingDetails, VehicleType } from '../types';
import { MapPin, User, Phone, Car, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Map as MapIcon, AlertTriangle, LocateFixed } from 'lucide-react';
import { sendBookingEmail } from '../services/emailService';
import { appendBookingToSheet } from '../services/googleSheets';

declare const google: any;

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const NO_FARE_VEHICLES = [
  VehicleType.LUXURY,
  VehicleType.TEMPO_TRAVELLER,
  VehicleType.TOURIST_BUS,
  VehicleType.CUSTOM
];

const getFare = (distance: number, vehicle: VehicleType): string => {
  if (NO_FARE_VEHICLES.includes(vehicle)) return 'Call for Quote';
  
  const perKmRate = PRICING[vehicle] || 0;
  let baseFare = 0;

  if (vehicle === VehicleType.MINI || vehicle === VehicleType.SEDAN) {
    if (distance <= 39) baseFare = 80;
    else if (distance <= 65) baseFare = 139;
    else baseFare = 300;
  } else if (vehicle === VehicleType.SUV || vehicle === VehicleType.SUV_PLUS) {
    if (distance <= 5) baseFare = 150;
    else if (distance <= 7) baseFare = 200;
    else if (distance <= 65) baseFare = 203;
    else baseFare = 350;
  } else if (vehicle === VehicleType.INNOVA) {
    if (distance <= 5) return 'Call for Quote';
    else if (distance <= 65) baseFare = 203;
    else baseFare = 399;
  } else {
    baseFare = 80; 
  }

  const total = Math.round(distance * perKmRate) + baseFare;
  return `₹${total}`;
};

const VEHICLE_CONFIG = [
  { 
    type: VehicleType.MINI, 
    label: 'MINI / ANY SEDAN', 
    image: '/images/car_etios.svg', 
    capacity: 4,
    description: 'AFFORDABLE'
  },
  { 
    type: VehicleType.SEDAN, 
    label: 'Sedan', 
    image: '/images/sedan.webp', 
    capacity: 4,
    description: 'PRIME SEDAN'
  },
  { 
    type: VehicleType.SUV, 
    label: 'SUV', 
    image: '/images/car_suv.svg', 
    capacity: 6,
    description: '6-7 MEMBERS'
  },
  { 
    type: VehicleType.INNOVA, 
    label: 'Innova', 
    image: '/images/car_innova.svg', 
    capacity: 7,
    description: 'PREMIUM INNOVA'
  },
  { 
    type: VehicleType.TEMPO_TRAVELLER, 
    label: 'Traveller', 
    image: '/images/tempo travaller.webp',
    capacity: 12,
    description: 'Group travel(12-18 seats)'
  },
  { 
    type: VehicleType.TOURIST_BUS, 
    label: 'Tourist Bus', 
    image: '/images/bus.webp',
    capacity: 40,
    description: '(20-55 seats)'
  },
  { 
    type: VehicleType.CUSTOM, 
    label: 'Custom', 
    image: '', 
    capacity: 'Any',
    description: 'Any types of vehicle available'
  },
];

const InputWrapper = memo(({ children, icon: Icon, label }: { children: React.ReactNode; icon: any; label?: string }) => (
  <div className="relative group w-full">
    {label && <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6467] transition-colors duration-300 pointer-events-none z-10">
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
  const [locating, setLocating] = useState(false);
  const lastActiveField = useRef<'pickup' | 'drop'>('pickup');
  const isMapMoving = useRef(false);

  const [formData, setFormData] = useState<BookingDetails>({
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
  const sessionLeadId = useRef(`lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, leadId: sessionLeadId.current }));
  }, []);

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

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setGoogleLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 🔥 Google Autocomplete Light Theme Injection
useEffect(() => {
  const style = document.createElement("style");
style.innerHTML = `
  .pac-container {
    background-color: #ffffff !important;
    border-radius: 16px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
    padding: 6px 0 !important;
    z-index: 9999 !important;
    max-height: 400px !important; /* allow scrolling for long lists */
    overflow-y: auto !important;
  }

  .pac-item {
    padding: 12px 16px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #111827 !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    flex-direction: column !important;
    white-space: normal !important; /* allow full address wrap */
  }

  .pac-item .pac-item-query {
    font-weight: 900 !important;
    color: #FF6467 !important; /* custom highlight */
  }

  .pac-item .pac-item-subtitle {
    font-weight: 400 !important;
    font-size: 12px !important;
    color: #6b7280 !important;
  }

  .pac-item:hover {
    background-color: #f3f4f6 !important;
  }

  /* Subtle "Powered by Google" */
  .pac-logo:after {
    opacity: 0.6 !important;
  }

  /* Elegant thin scrollbar */
  .app-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .app-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .app-scroll::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
  .dark .app-scroll::-webkit-scrollbar-thumb {
    background: #334155;
  }
  .app-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
  .dark .app-scroll { scrollbar-color: #334155 transparent; }
`;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
  };
}, []);


  // Initialize Autocomplete (Always active for inputs)
  useEffect(() => {
    if (!googleLoaded) return;
    if (pickupAutocomplete.current && dropAutocomplete.current) return;

    try {
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

      if (pickupRef.current && !pickupAutocomplete.current) {
        pickupAutocomplete.current = new google.maps.places.Autocomplete(pickupRef.current, options);
        pickupAutocomplete.current.addListener('place_changed', () => {
          const place = pickupAutocomplete.current.getPlace();
          if (place.geometry?.location) {
            lastActiveField.current = 'pickup';
            if (mapInstance.current) {
              isMapMoving.current = true;
              mapInstance.current.setCenter(place.geometry.location);
              mapInstance.current.setZoom(17);
              reverseGeocode(place.geometry.location, 'pickup');
            }
          }
        });
      }

      if (dropRef.current && !dropAutocomplete.current) {
        dropAutocomplete.current = new google.maps.places.Autocomplete(dropRef.current, options);
        dropAutocomplete.current.addListener('place_changed', () => {
          const place = dropAutocomplete.current.getPlace();
          if (place.geometry?.location) {
            lastActiveField.current = 'drop';
            if (mapInstance.current) {
              isMapMoving.current = true;
              mapInstance.current.setCenter(place.geometry.location);
              mapInstance.current.setZoom(17);
              reverseGeocode(place.geometry.location, 'drop');
            }
          }
        });
      }
    } catch (e) {
      console.error("Autocomplete Initialization Error:", e);
    }
  }, [googleLoaded]);

  const reverseGeocode = (latlng: any, field: 'pickup' | 'drop') => {
    if (!googleLoaded) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latlng }, (results: any, status: string) => {
      isMapMoving.current = false;
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        // Handle LatLng vs LatLngLiteral
        const lat = typeof latlng.lat === 'function' ? latlng.lat() : latlng.lat;
        const lng = typeof latlng.lng === 'function' ? latlng.lng() : latlng.lng;
        const coords = { lat, lng };
        
        setFormData(prev => ({
          ...prev,
          [field]: address,
          [`${field}Coords`]: coords
        }));

        if (field === 'pickup' && pickupRef.current) pickupRef.current.value = address;
        if (field === 'drop' && dropRef.current) dropRef.current.value = address;
      }
    });
  };

  // Initialize Map (Only when visible)
  useEffect(() => {
    if (!googleLoaded || !mapRef.current) {
      mapInstance.current = null;
      directionsRenderer.current = null;
      return;
    }
    if (mapInstance.current) return;

    try {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 11.0168, lng: 76.9558 },
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles:[{ featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] }]
      });

      mapInstance.current.addListener('dragstart', () => {
        isMapMoving.current = true;
      });

      mapInstance.current.addListener('idle', () => {
        if (isMapMoving.current) {
          const center = mapInstance.current.getCenter();
          reverseGeocode(center, lastActiveField.current);
        }
      });

      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: mapInstance.current,
        polylineOptions: { strokeColor: "#FF6467", strokeWeight: 6, strokeOpacity: 0.95 },
        suppressMarkers: false
      });
    } catch (e) {
      console.error("Map Initialization Error:", e);
    }

    return () => {
      mapInstance.current = null;
      directionsRenderer.current = null;
    };
  }, [googleLoaded, !!(formData.pickup && formData.drop)]);

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
    if (step === 1 && mapInstance.current) {
      // Small timeout to ensure DOM is updated and map container has dimensions
      const timer = setTimeout(() => {
        if ((window as any).google?.maps) {
          google.maps.event.trigger(mapInstance.current, 'resize');
          if (formData.pickup && formData.drop) {
            updateMapRoute(formData.pickup, formData.drop);
          } else {
            mapInstance.current.setCenter({ lat: 11.0168, lng: 76.9558 });
            mapInstance.current.setZoom(12);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, formData.pickup, formData.drop, updateMapRoute]);

  useEffect(() => {
    if (formData.pickup && formData.drop) updateMapRoute(formData.pickup, formData.drop);
  }, [formData.pickup, formData.drop, updateMapRoute]);

  const calculateFare = useCallback((origin: string, destination: string, vehicle: VehicleType) => {
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

          setFormData(prev => ({
            ...prev,
            distance: distanceText,
            estimatedFare: getFare(distanceValue, vehicle)
          }));
        }
      }
    );
  }, []);

  useEffect(() => {
    if (formData.pickup && formData.drop) {
      calculateFare(formData.pickup, formData.drop, formData.vehicleType);
    }
  }, [formData.pickup, formData.drop, formData.vehicleType, calculateFare]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        const latlng = { lat: latitude, lng: longitude };

        if (!(window as any).google?.maps) {
          alert('Google Maps not loaded yet');
          return;
        }

        reverseGeocode(latlng, 'pickup');
        
        if (mapInstance.current) {
          mapInstance.current.setCenter(latlng);
          mapInstance.current.setZoom(15);
        }
      },
      (error) => {
        setLocating(false);
        alert('Error getting location: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleNextStep = async () => {
    const p = pickupRef.current?.value || formData.pickup;
    const d = dropRef.current?.value || formData.drop;
    const phone = formData.phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!p || !d) {
      alert("Please enter pickup and destination.");
      return;
    }
    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    const updatedData = { ...formData, pickup: p, drop: d };
    setFormData(updatedData);
    calculateFare(p, d, formData.vehicleType);
    
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Abandoned Lead Capture Logic
  const leadSentRef = useRef(false);
  useEffect(() => {
    const handleAbandonment = async () => {
      // Only send if we have basic info, not submitted, not currently submitting, and haven't sent yet
      if (!submitted && !isSubmittingRef.current && !leadSentRef.current && formData.phone && formData.phone.length === 10 && formData.pickup && formData.drop) {
        const isStep2 = step === 2;
        const bookingData = {
          ...formData,
          estimatedFare: formData.estimatedFare || (isStep2 ? 'Abandoned at Step 2' : 'Abandoned Lead (Step 1)')
        };
        
        // ⚠️ Mark as sent synchronously BEFORE async calls to prevent duplicate triggers
        leadSentRef.current = true;
        
        sendBookingEmail(bookingData);
        
        // Save to Google Sheets
        try {
          await appendBookingToSheet(bookingData);
        } catch (err) {
          console.error('Abandonment sheet sync error:', err);
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAbandonment();
      }
    };

    // iOS Safari reliability: pagehide
    window.addEventListener('pagehide', handleAbandonment);
    window.addEventListener('beforeunload', handleAbandonment);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handleAbandonment);
      window.removeEventListener('beforeunload', handleAbandonment);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [formData, submitted, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = formData.phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    setLoading(true);
    isSubmittingRef.current = true;
    leadSentRef.current = true; // Prevent abandonment lead during/after this process

    try {
      // Send Email
      const success = await sendBookingEmail(formData);
      
      // Save to Google Sheets
      try {
        await appendBookingToSheet(formData);
      } catch (err) {
        console.error('Sheet sync error:', err);
      }
      
      if (success) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        isSubmittingRef.current = false;
        leadSentRef.current = false; // Allow retry or abandonment capture on failure
        alert("Booking failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      isSubmittingRef.current = false;
      leadSentRef.current = false;
      alert("Error sending booking. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppConfirm = () => {
  const message = `*NEW BOOKING CONFIRMATION*%0A*Phone:* ${formData.phone}%0A*Pickup:* ${formData.pickup}%0A*Drop:* ${formData.drop}%0A*Fare:* ${formData.estimatedFare}`;
  window.open(`https://wa.me/918870088020?text=${message}`, '_blank');
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
  type="button"   // important to prevent accidental form submission
  onClick={() => {
    setSubmitted(false);      // go back to the form
    setStep(1);               // start from step 1
    setFormData({             // reset all fields
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
      if (directionsRenderer.current) {
        directionsRenderer.current.setDirections({ routes: [] });
      }

      // Reset map center and zoom
      if (mapInstance.current) {
        mapInstance.current.setCenter({ lat: 11.0168, lng: 76.9558 });
        mapInstance.current.setZoom(12);
      }

      // ✅ Reload page
      window.location.reload();
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
    <div className="bg-white dark:bg-slate-900 p-5 pb-10 sm:pb-5 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm mx-auto transition-all duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {step === 1 ? 'Trip Details' : 'Confirm Booking'}
        </h3>
        <div className="flex gap-2">
          <div className={`h-1 w-6 rounded-full transition-all ${step === 1 ? 'bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1 w-6 rounded-full transition-all ${step === 2 ? 'bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Step 1 */}
        <div className={`${step === 1 ? 'space-y-3.5' : 'hidden'} animate-fade-in`}>
          {/* Map - Always Visible in Step 1 for "Trust Map Center" experience */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner animate-in fade-in zoom-in duration-500">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Center Pin - Uber style */}
            {(!formData.pickup || !formData.drop) && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[#FF6467]/20 flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-[#FF6467]" />
                  </div>
                  <MapPin className="text-[#FF6467] absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-lg" size={32} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-900/10 rounded-full" />
                </div>
              </div>
            )}

            {mapError && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-4 text-center">
                <AlertTriangle size={20} className="text-[#FF6467] mb-1" />
                <p className="text-[9px] text-white font-bold uppercase">{mapError}</p>
              </div>
            )}
          </div>

          
          <div className="grid grid-cols-1 gap-3">
            <InputWrapper icon={MapPin} label="Pickup">
              <div className="relative w-full">
                <input
                  ref={pickupRef}
                  type="text"
                  required
                  placeholder="Enter Pickup Location"
                  defaultValue={formData.pickup}
                  onFocus={() => { lastActiveField.current = 'pickup'; }}
                  className="w-full pl-11 pr-16 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-[#FF6467] rounded-xl text-xs font-bold outline-none dark:text-white"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {formData.pickup && (
                    <button
                      type="button"
                      onClick={() => {
                        if (pickupRef.current) pickupRef.current.value = '';
                        setFormData(prev => ({ ...prev, pickup: '', pickupCoords: undefined }));
                      }}
                      className="text-slate-400 hover:text-[#FF6467]"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className={`text-slate-400 hover:text-[#FF6467] transition-all ${locating ? 'animate-pulse text-[#FF6467]' : ''}`}
                    title="Use Current Location"
                  >
                    <LocateFixed size={16} />
                  </button>
                </div>
              </div>
            </InputWrapper>

           
            <InputWrapper icon={MapPin} label="Destination">
              <div className="relative w-full">
                <input
                  ref={dropRef}
                  type="text"
                  required
                  placeholder="Enter Destination"
                  defaultValue={formData.drop}
                  onFocus={() => { lastActiveField.current = 'drop'; }}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-[#FF6467] rounded-xl text-xs font-bold outline-none dark:text-white"
                />

                {formData.drop && (
                  <button
                    type="button"
                    onClick={() => {
                      if (dropRef.current) dropRef.current.value = '';
                      setFormData(prev => ({ ...prev, drop: '' }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF6467]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </InputWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputWrapper icon={Calendar} label="Date (optional)">
              <input type="date" name="date" min={indiaToday} value={formData.date} onChange={handleChange} className="w-full pl-11 pr-2 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white" />
            </InputWrapper>
            <InputWrapper icon={Clock} label="Time (optional)">
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-11 pr-2 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white" />
            </InputWrapper>
          </div>

<div className="grid grid-cols-1 gap-3">
  <InputWrapper icon={Phone} label="Phone Number">
    <input
      type="tel"
      name="phone"
      required
      placeholder="10-digit number"
      value={formData.phone}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, phone: cleaned.slice(0, 10) }));
      }}
      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-[#FF6467] rounded-xl text-xs font-black outline-none dark:text-white
                 ring-2 ring-[#FF6467] ring-opacity-40 transition-all duration-200"
      maxLength={10}
    />
            </InputWrapper>
          </div>

          <button 
            type="button" 
            onClick={handleNextStep} 
            className="w-full bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>

        {/* Step 2 */}
        <div className={`${step === 2 ? 'space-y-3.5' : 'hidden'} animate-fade-in`}>
          <div className="bg-[#FF6467]/5 dark:bg-[#FF6467]/10 border border-[#FF6467]/20 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Estimated Fare</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {loadingFare ? '...' : formData.estimatedFare || '₹0'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Distance</span>
              <span className="text-xs font-black text-[#FF6467]">{formData.distance || '--- km'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Vehicle</span>
            <span className="text-[8px] font-bold text-[#FF6467] animate-pulse uppercase tracking-tighter">↓ Scroll for more</span>
          </div>

          <div className="relative group">
            <div className="space-y-1.5 max-h-[240px] sm:max-h-[280px] overflow-y-auto pr-1 app-scroll">
            {VEHICLE_CONFIG.map((v) => {
              const distanceVal = parseFloat(formData.distance || '0') || 0;
              const priceDisplay = distanceVal > 0 ? getFare(distanceVal, v.type) : '---';

              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, vehicleType: v.type }));
                  }}
                  className={`
                    w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all text-left
                    ${formData.vehicleType === v.type 
                      ? 'border-[#FF6467] bg-[#FF6467]/5 dark:bg-[#FF6467]/10' 
                      : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950'}
                  `}
                >
      {/* Vehicle Image */}
                  {v.image ? (
                    <img
                      src={v.image}
                      alt={v.label}
                      className="w-24 h-24 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Car size={32} className="text-slate-400" />
                    </div>
                  )}

  {/* Vehicle Info */}
  <div className="flex-1 flex flex-col justify-between">
    {/* Top row: Label & Price */}
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
        {v.label}
      </span>
      <span className="text-sm font-bold text-slate-900 dark:text-white">
        {priceDisplay}
      </span>
    </div>

    {/* Bottom row: Capacity & Description */}
    <div className="flex items-center gap-3 mt-1">
      <span className="text-xs text-slate-400 flex items-center gap-1">
        <User size={10} /> {v.capacity}
      </span>
      <span className="text-xs text-slate-400 font-medium truncate">
        • {v.description}
      </span>
    </div>
  </div>
</button>
              );
            })}
            </div>
            {/* Bottom fade to indicate more content */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none opacity-60 rounded-b-2xl" />
          </div>

        <div className="flex gap-3">
  <button
    type="button"
    onClick={() => {
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // scroll to top smoothly
    }}
    className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
  >
    <ArrowLeft size={20} />
  </button>
        <button
  type="submit"
  disabled={loading}
  className="flex-1 bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-xs active:scale-95 transition-all"
  onClick={() => {
    // Scroll to top when clicked (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
>
  {loading ? 'Processing...' : 'Confirm Booking'}
</button>
          </div>
        </div>
      </form>
    </div>
  );
};

