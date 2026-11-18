import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookingDetails, VehicleType, TripType, FareBreakdown, PlaceData } from '../types';
import { MapPin, User, Phone, Smartphone, Car, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Map as MapIcon, AlertTriangle, Repeat, Navigation, Package, X, ChevronUp, ChevronDown, Locate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendBookingEmail } from '../services/emailService';
import { appendBookingToSheet } from '../services/googleSheets';
import { motion } from 'framer-motion';

declare const google: any;

const getGeolocationErrorMessage = (error: GeolocationPositionError | any) => {
  switch (error?.code) {
    case 1:
      return 'Location access is blocked. In Chrome, open the site permissions, set Location to Allow, then try again.';
    case 2:
      return 'Location is unavailable. Turn on Android Location/GPS and try again.';
    case 3:
      return 'Location request timed out. Check your GPS signal and try again.';
    default:
      return 'Unable to get your location. Check browser and device location settings, then try again.';
  }
};

const TripTypeRental = (TripType as any).RENTAL || 'Rental' as TripType;

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const IST_TIME_ZONE = 'Asia/Kolkata';

type IstDateTime = { date: string; time: string };

const getIntlPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
  parts.find(part => part.type === type)?.value || '';

const formatIstDateTime = (timestamp: number): IstDateTime => {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));

  return {
    date: `${getIntlPart(parts, 'year')}-${getIntlPart(parts, 'month')}-${getIntlPart(parts, 'day')}`,
    time: `${getIntlPart(parts, 'hour')}:${getIntlPart(parts, 'minute')}`,
  };
};


const ONE_WAY_PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 35,
  [VehicleType.SUV_PLUS]: 35,
  [VehicleType.INNOVA]: 40,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const ROUND_TRIP_PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 14,
  [VehicleType.SEDAN]: 15,
  [VehicleType.SUV]: 19.5,
  [VehicleType.SUV_PLUS]: 22,
  [VehicleType.INNOVA]: 22.5,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const LOCAL_PRICING: Record<VehicleType, number> = {
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

const ONE_WAY_SHORT_RATES: Record<string, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
};

const LOCAL_SHORT_RATES: Record<string, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
};

const HILL_STATIONS = [
  'ooty', 'udhaga', 'kodai', 'munnar', 'yercaud', 'coorg', 'kodagu', 
  'wayanad', 'valparai', 'yelagiri', 'kolli', 'velliangiri', 'topslip',
  'vagamon', 'thekkady', 'idukki', 'pykara', 'masinagudi', 'coonoor', 
  'palamathi', 'javadi', 'megamalai', 'nilgiri', 'dindigul', 'madikeri',
  'kodagiri', 'kotagiri', 'kothagiri', 'gudalur', 'mudumalai', 'bandipur',
  'chikmagalur', 'sakleshpur', 'agumbe', 'kudremukh', 'sringeri', 'horanadu',
  'vythiri', 'lakkidi', 'peermade', 'kumily', 'ponmudi', 'muthanga',
  'meppadi', 'thusharagiri', 'vattavada', 'marayoor', 'nelliyampathy',
  'parambikulam', 'athirapally', 'theni', 'bodinayakkanur', 'cumbum', 
  'shringeri', 'kalpetta', 'bathery', 'mananthavady'
];

// Major Hill Station Zones (Lat, Lng, Radius in KM)
const HILL_STATION_ZONES = [
  { name: 'Ooty/Nilgiris', lat: 11.4102, lng: 76.6950, radius: 40 },
  { name: 'Kodaikanal', lat: 10.2381, lng: 77.4891, radius: 30 },
  { name: 'Munnar', lat: 10.0889, lng: 77.0595, radius: 35 },
  { name: 'Yercaud', lat: 11.7753, lng: 78.2093, radius: 15 },
  { name: 'Coorg/Madikeri', lat: 12.4244, lng: 75.7382, radius: 40 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.1320, radius: 40 },
  { name: 'Valparai', lat: 10.3271, lng: 76.9554, radius: 25 },
  { name: 'Yelagiri', lat: 12.5785, lng: 78.6385, radius: 15 },
  { name: 'Kolli Hills', lat: 11.2721, lng: 78.3396, radius: 20 },
  { name: 'Thekkady', lat: 9.6031, lng: 77.1615, radius: 25 },
  { name: 'Chikmagalur', lat: 13.3161, lng: 75.7720, radius: 30 },
];

const HILL_EXCLUSION_KEYWORDS = [
  // Base towns near Nilgiris (MOST IMPORTANT)
  'mettupalayam',
  'karamadai',
  'coimbatore',
  'sirumugai',
  'annur',
  'periyanaickenpalayam',
  'sathyamangalam',

  // Entry/low altitude routes
  'gobichettipalayam',
  'tiruppur',
  'pollachi',
  'udumalaipettai',
  'dharapuram',

  // Kerala plains (avoid false hill triggers)
  'palakkad',
  'thrissur',
  'ernakulam',
  'cochin',
  'alappuzha',

  // Border buffer towns
  'bhavani',
  'salem city',
  'erode city'
];

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const checkIsHillStation = async (address: string, coords?: { lat: number; lng: number }): Promise<boolean> => {
  if (!address && !coords) return false;

  const lower = address ? address.toLowerCase() : '';

  // ❌ 1. EXCLUSION CHECK FIRST (VERY IMPORTANT)
  if (lower && HILL_EXCLUSION_KEYWORDS.some(word => lower.includes(word))) {
    return false;
  }

  // ✅ 2. FAST KEYWORD CHECK
  if (lower && HILL_STATIONS.some(hs => lower.includes(hs))) {
    return true;
  }

  // 3. COORDINATES CHECK (ACCURATE)
  try {
    let lat = coords?.lat;
    let lng = coords?.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      if (!(window as any).google?.maps?.Geocoder) return false;

      const geocoder = new (window as any).google.maps.Geocoder();

      const result = await new Promise<any[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results: any, status: string) => {
          if (status === 'OK' && results) resolve(results);
          else reject(status);
        });
      });

      if (result && result[0]) {
        const loc = result[0].geometry.location;
        lat = loc.lat();
        lng = loc.lng();
      }
    }

    if (typeof lat === 'number' && typeof lng === 'number') {
      return HILL_STATION_ZONES.some(zone => {
        const dist = calculateHaversineDistance(lat!, lng!, zone.lat, zone.lng);
        return dist <= zone.radius;
      });
    }
  } catch (e) {
    console.error('Hill station detection geocode/coords check failed:', e);
  }

  return false;
};

const NO_FARE_VEHICLES = [
  VehicleType.LUXURY,
  VehicleType.TEMPO_TRAVELLER,
  VehicleType.TOURIST_BUS,
  VehicleType.CUSTOM
];

interface FareDetails {
  total: number;
  breakdown: {
    distanceFare: number;
    driverBeta: number;
    extraDaysFare: number;
    waitingCharge: number;
    hillCharge: number;
    baseFare: number;
    ratePerKm?: number;
    billableDistance?: number;
    extraCharges?: number;
  };
  displayTotal: string;
}

const calculateFareDetails = (distance: number, vehicle: VehicleType, tripType: TripType = TripType.ONE_WAY, localPackage?: string, days: number = 1, waitingHours: number = 0, isHillStation: boolean = false): FareDetails => {
  const result: FareDetails = {
    total: 0,
    breakdown: { distanceFare: 0, driverBeta: 0, extraDaysFare: 0, waitingCharge: 0, hillCharge: 0, baseFare: 0, ratePerKm: 0, billableDistance: 0, extraCharges: 0 },
    displayTotal: 'Call for Quote'
  };

  if (NO_FARE_VEHICLES.includes(vehicle)) return result;
  
  let pricingList = ONE_WAY_PRICING;
  if (tripType === TripType.ROUND_TRIP) {
    pricingList = ROUND_TRIP_PRICING;
  } else if (tripType === TripType.LOCAL) {
    pricingList = LOCAL_PRICING;
  }
  const perKmRate = pricingList[vehicle] || 0;

  let hillCharge = 0;
  result.breakdown.hillCharge = hillCharge;

  if (tripType === TripTypeRental) {
    const pkg = LOCAL_PACKAGES.find(p => p.id === localPackage);
    if (!pkg) return result;
    
    // Parse hours from id (e.g. '4hr40km' -> 4)
    const matches = pkg.id.match(/^(\d+)hr/);
    const hours = matches ? parseInt(matches[1]) : 0;
    
    let total = 0;
    if (vehicle === VehicleType.MINI) {
      total = hours * 350;
    } else if (vehicle === VehicleType.SEDAN) {
      total = hours * 375;
    } else {
      // SUV, Innova and others - Call on Quote
      return result;
    }

    result.total = total;
    result.breakdown.baseFare = total;
    result.displayTotal = `₹${total}`;
    
    // For rental, we don't want extra charges or driver beta shown separately as they are included
    result.breakdown.driverBeta = 0;
    result.breakdown.extraCharges = 0;
    result.breakdown.distanceFare = 0;
    return result;
  }

  if (tripType === TripType.ONE_WAY || tripType === TripType.LOCAL) {
    if (distance >= 130) {
      const billableDistance = Math.max(distance, 130);
      const distanceFare = Math.round(billableDistance * perKmRate);
      result.breakdown.distanceFare = distanceFare;
      result.breakdown.billableDistance = billableDistance;
      result.breakdown.ratePerKm = perKmRate;
      
      let driverBeta = 0;
      if (vehicle === VehicleType.MINI || vehicle === VehicleType.SEDAN) driverBeta = 300;
      else if (vehicle === VehicleType.SUV || vehicle === VehicleType.SUV_PLUS || vehicle === VehicleType.INNOVA) driverBeta = 400;
      
      result.breakdown.driverBeta = driverBeta;
      result.total = distanceFare + driverBeta + hillCharge;
    } else {
      const shortRates = tripType === TripType.LOCAL ? LOCAL_SHORT_RATES : ONE_WAY_SHORT_RATES;
      const rate = shortRates[vehicle] || perKmRate;
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
        if (distance > 5 && distance <= 65) baseFare = 203;
        else if (distance > 65) baseFare = 399;
        else return result;
      } else {
        baseFare = 80;
      }
      
      const distanceFare = Math.round(distance * rate);
      result.breakdown.distanceFare = distanceFare;
      result.breakdown.baseFare = baseFare;
      result.breakdown.billableDistance = distance;
      result.breakdown.ratePerKm = rate;
      result.total = distanceFare + baseFare + hillCharge;
    }
  } else if (tripType === TripType.ROUND_TRIP) {
    const effectiveDistance = distance * 2;
    const distanceFare = Math.round(effectiveDistance * perKmRate);
    result.breakdown.distanceFare = distanceFare;
    result.breakdown.billableDistance = effectiveDistance;
    result.breakdown.ratePerKm = perKmRate;
    
    result.breakdown.extraDaysFare = 0;

   let driverBetaPerDay = 0;

if (distance > 38) {
  if (vehicle === VehicleType.MINI || vehicle === VehicleType.SEDAN)
    driverBetaPerDay = 300;
  else if (
    vehicle === VehicleType.SUV ||
    vehicle === VehicleType.SUV_PLUS ||
    vehicle === VehicleType.INNOVA
  )
    driverBetaPerDay = 400;
}

result.breakdown.driverBeta = days * driverBetaPerDay;

    // Waiting charge (Only for One Way if days=1, user requested to remove for round trip)
    result.breakdown.waitingCharge = 0;
    
    result.total = distanceFare + result.breakdown.extraDaysFare + result.breakdown.driverBeta + result.breakdown.waitingCharge + hillCharge;
  }

  result.breakdown.extraCharges = (result.breakdown.baseFare || 0) + (result.breakdown.extraDaysFare || 0) + (result.breakdown.waitingCharge || 0) + (result.breakdown.hillCharge || 0);

  if (result.total > 0) {
    result.displayTotal = `₹${result.total}`;
  }

  return result;
};

const getFare = (distance: number, vehicle: VehicleType, tripType: TripType = TripType.ONE_WAY, localPackage?: string, days: number = 1): string => {
  return calculateFareDetails(distance, vehicle, tripType, localPackage, days).displayTotal;
};

const LOCAL_PACKAGES = [
  { id: '1hr10km', label: '1 Hr / 10 Km' },
  { id: '2hr20km', label: '2 Hrs / 20 Km' },
  { id: '3hr30km', label: '3 Hrs / 30 Km' },
  { id: '4hr40km', label: '4 Hrs / 40 Km' },
  { id: '5hr50km', label: '5 Hrs / 50 Km' },
  { id: '6hr60km', label: '6 Hrs / 60 Km' },
  { id: '7hr70km', label: '7 Hrs / 70 Km' },
  { id: '8hr80km', label: '8 Hrs / 80 Km' },
  { id: '9hr90km', label: '9 Hrs / 90 Km' },
  { id: '10hr100km', label: '10 Hrs / 100 Km' },
  { id: '11hr110km', label: '11 Hrs / 110 Km' },
  { id: '12hr120km', label: '12 Hrs / 120 Km' },
];

const VEHICLE_CONFIG = [
  { 
    type: VehicleType.MINI, 
    label: 'MINI / ANY SEDAN', 
    image: '/images/car_etios.svg', 
    capacity: 4,
    description: 'ANY SEDAN'
  },
  { 
    type: VehicleType.SEDAN, 
    label: 'Sedan', 
    image: '/images/sedan.webp',
    capacity: 4,
    description: 'SEDAN'
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
    description: 'INNOVA'
  },
  { 
    type: VehicleType.TEMPO_TRAVELLER, 
    label: 'Traveller', 
    image: '/images/tempo travaller.webp',
    capacity: 12,
    description: '(12-18 seats)'
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

const vehicleImageUrls = VEHICLE_CONFIG
  .map((vehicle) => vehicle.image)
  .filter((image): image is string => Boolean(image));
const preloadedVehicleImages = new Set<string>();

const preloadVehicleImages = () => {
  vehicleImageUrls.forEach((src) => {
    if (preloadedVehicleImages.has(src)) return;
    preloadedVehicleImages.add(src);
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
  });
};

const InputWrapper = memo(({ children, icon: Icon, label }: { children: React.ReactNode; icon: any; label?: string }) => (
  <div className="relative group w-full">
    {label && <label className="block text-[9px] font-bold text-slate-400  uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6467] transition-colors duration-300 pointer-events-none z-10">
        <Icon size={16} />
      </div>
      {children}
    </div>
  </div>
));

const LocationSearchOverlay = ({ type, onSelect, onClose, googleLoaded, initialValue }: { 
  type: 'pickup' | 'drop', 
  onSelect: (address: string, placeData?: PlaceData) => void, 
  onClose: () => void,
  googleLoaded: boolean,
  initialValue: string
}) => {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<any[]>([]);
  const service = useRef<any>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [clickedToType, setClickedToType] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS is not supported by your browser.");
      return;
    }

    setLocating(true);
    setGpsError(null);

    const onSuccess = (position: any) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      if (googleLoaded && (window as any).google?.maps?.Geocoder) {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          setLocating(false);
          if (status === 'OK' && results && results[0]) {
            const formattedAddress = results[0].formatted_address;
            onSelect(formattedAddress, {
              address: formattedAddress,
              placeId: results[0].place_id,
              lat,
              lng
            });
          } else {
            setGpsError("Failed to resolve address. Using coordinates.");
            onSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, {
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat,
              lng
            });
          }
        });
      } else {
        setLocating(false);
        onSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, {
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng
        });
      }
    };

    const onError = (error: any) => {
      setLocating(false);
      setGpsError(getGeolocationErrorMessage(error));
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const fetchPlaceDetails = (placeId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const dummyNode = document.createElement('div');
        const s = new (window as any).google.maps.places.PlacesService(dummyNode);
        s.getDetails({
          placeId,
          fields: ['formatted_address', 'geometry', 'place_id']
        }, (place: any, status: string) => {
          if (status === 'OK' && place) {
            resolve(place);
          } else {
            reject(status);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  useEffect(() => {
    if (googleLoaded && (window as any).google?.maps?.places) {
      service.current = new (window as any).google.maps.places.AutocompleteService();
    }
  }, [googleLoaded]);

  // Handle body scroll lock and hiding other layout components on mobile
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mobile-search-active');
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('mobile-search-active');
    };
  }, []);

  useEffect(() => {
    if (query.length > 0 && service.current) {
      const COIMBATORE_CENTER = new (window as any).google.maps.LatLng(11.0168, 76.9558);
      
      // 1. Search with Coimbatore bias
      service.current.getPlacePredictions({ 
        input: query, 
        componentRestrictions: { country: 'in' },
        location: COIMBATORE_CENTER,
        radius: 50000 
      }, (cbeResults: any) => {
        // 2. Search without location bias
        service.current.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'in' }
        }, (allResults: any) => {
          const map = new Map();

          // Coimbatore results first
          (cbeResults || []).forEach((item: any) => {
            if (item && item.place_id) {
              map.set(item.place_id, item);
            }
          });

          // Then all other results
          (allResults || []).forEach((item: any) => {
            if (item && item.place_id && !map.has(item.place_id)) {
              map.set(item.place_id, item);
            }
          });

          setPredictions(Array.from(map.values()));
        });
      });
    } else {
      setPredictions([]);
    }
  }, [query]);

  return (
    <div className="fixed inset-0 bg-white  z-[9999] flex flex-col animate-in slide-in-from-bottom-5 duration-300 h-[100dvh] overflow-hidden">
      <style>{`
        .mobile-search-active nav {
          display: none !important;
        }
        .mobile-search-active footer {
          display: none !important;
        }
        .mobile-search-active [aria-label="Call for Booking"] {
          display: none !important;
        }
        .mobile-search-active .fixed.bottom-0 {
          display: none !important;
        }
        .mobile-search-active [aria-label="Chat Support"] {
          display: none !important;
        }
      `}</style>
      <div className="flex flex-col px-4 pb-4 pt-[calc(env(safe-area-inset-top,1rem)+16px)] bg-white  border-b border-slate-100 ">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 text-[#FF6467] hover:bg-slate-50  p-2 -ml-2 rounded-xl transition-all min-h-[44px]"
          >
            <ArrowLeft size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
          </button>
          <h2 className="text-[12px] font-black uppercase tracking-tight text-slate-400 ">
            {type === 'pickup' ? 'Select Pickup Point' : 'Select Destination'}
          </h2>
          <button 
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200   text-slate-700  text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-250  shadow-sm min-h-[44px]"
          >
            Cancel
          </button>
        </div>
        
        <div className="relative">
          <input 
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setClickedToType(true);
            }}
            onClick={() => setClickedToType(true)}
            onFocus={() => setClickedToType(true)}
            placeholder={type === 'pickup' ? "Enter pickup location..." : "Enter destination..."}
            className={`w-full bg-slate-100  border-2 border-transparent focus:border-[#FF6467]/20 rounded-2xl pl-12 ${type === 'pickup' ? 'pr-24' : 'pr-12'} py-4 min-h-[48px] text-[13px] font-bold outline-none  transition-all shadow-inner`}
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6467]" size={18} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {type === 'pickup' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseGPS();
                }}
                disabled={locating}
                className="w-9 h-9 bg-[#FF6467] hover:bg-[#e55a5d] text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                title="Use current GPS location"
              >
                <Locate size={16} className={`stroke-[3px] ${locating ? 'animate-spin' : ''}`} />
              </button>
            )}
            {query && (
              <button 
                onClick={() => {
                  setQuery('');
                  setClickedToType(true);
                }}
                className="w-8 h-8 bg-slate-200  rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 hover:text-rose-500 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {gpsError && (
          <div className="mt-2 p-2.5 bg-rose-50  border border-rose-200  rounded-xl flex items-center gap-2 text-rose-800  text-[11px] font-semibold">
            <AlertTriangle size={14} className="shrink-0 text-[#FF6467]" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 pb-[calc(env(safe-area-inset-bottom,16px)+32px)] overscroll-contain">
        {predictions.length > 0 ? (
          predictions.map((p) => (
            <button 
              key={p.place_id}
              disabled={loadingItem}
              onClick={async () => {
                setLoadingItem(true);
                try {
                  const placeDetails = await fetchPlaceDetails(p.place_id);
                  const lat = typeof placeDetails.geometry?.location?.lat === 'function' ? placeDetails.geometry.location.lat() : placeDetails.geometry?.location?.lat;
                  const lng = typeof placeDetails.geometry?.location?.lng === 'function' ? placeDetails.geometry.location.lng() : placeDetails.geometry?.location?.lng;
                  
                  if (!placeDetails.geometry || !placeDetails.place_id || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
                    alert("Selected location details are incomplete or invalid. Please select a specific address.");
                    setLoadingItem(false);
                    return;
                  }

                  const pData = {
                    address: placeDetails.formatted_address || p.description,
                    placeId: placeDetails.place_id,
                    lat,
                    lng
                  };
                  setLoadingItem(false);
                  onSelect(pData.address, pData);
                } catch (err) {
                  console.error("Failed to fetch place details:", err);
                  setLoadingItem(false);
                  onSelect(p.description);
                }
              }}
              className="w-full flex items-start gap-4 p-4 hover:bg-slate-50  rounded-2xl transition-colors text-left group border-b border-slate-50  last:border-none"
            >
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
                <MapPin size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[#FF6467]  leading-5">
                  {p.structured_formatting?.main_text || p.description}
                </div>

                <div className="text-[12px] text-slate-900  mt-1 leading-5 break-words font-medium">
                  {p.structured_formatting?.secondary_text || p.description}
                </div>
              </div>
            </button>
          ))
        ) : query ? (
          <div className="p-6 text-center text-slate-400  text-xs font-semibold">
            No matching locations found for "{query}"
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400  text-xs font-semibold">
            Type a location to search...
          </div>
        )}
      </div>
    </div>
  );
};

export const BookingForm: React.FC<{ forceMapActive?: boolean; onMapBack?: () => void; onMapActiveChange?: (active: boolean) => void }> = ({ forceMapActive = false, onMapBack, onMapActiveChange }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const stepRef = useRef(1);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Load vehicle art during the mobile step so Select Vehicle can paint from cache.
  useEffect(() => {
    if (step === 2) preloadVehicleImages();
  }, [step]);

  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const isAndroidBrowser = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  type SheetPosition = 'collapsed' | 'half' | 'expanded';
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>('half');
  const isSheetExpanded = sheetPosition !== 'collapsed';
  const suppressSheetClick = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetPointerId = useRef<number | null>(null);
  const sheetPointerStartY = useRef<number | null>(null);
  const sheetPointerStartTime = useRef(0);
  const sheetPointerStartPosition = useRef<SheetPosition>('half');
  const sheetPointerScrollContainer = useRef<HTMLElement | null>(null);
  const sheetPointerActive = useRef(false);
  const sheetPointerIsAndroid = useRef(false);
  const sheetPointerStartOffset = useRef(0);
  const sheetDragOffsetRef = useRef(0);
  const sheetPendingOffsetRef = useRef<number | null>(null);
  const sheetDragFrameRef = useRef<number | null>(null);
  const sheetSnapFrameRef = useRef<number | null>(null);
  const sheetCleanupTimerRef = useRef<number | null>(null);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const getSheetHeights = () => {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const collapsedHeight = 76;
    const halfHeight = Math.max(240, viewportHeight * 0.62);
    const expandedHeight = Math.max(halfHeight, viewportHeight * 0.85);
    return { collapsedHeight, halfHeight, expandedHeight };
  };

  const getSheetHeight = (position: SheetPosition) => {
    const { collapsedHeight, halfHeight, expandedHeight } = getSheetHeights();
    return position === 'collapsed' ? collapsedHeight : position === 'expanded' ? expandedHeight : halfHeight;
  };

  const getSheetOffsetBounds = (position: SheetPosition) => {
    const { collapsedHeight, halfHeight, expandedHeight } = getSheetHeights();
    const height = position === 'collapsed' ? collapsedHeight : position === 'expanded' ? expandedHeight : halfHeight;
    return {
      min: -(expandedHeight - height),
      max: height - collapsedHeight,
    };
  };

  const getNearestSheetPosition = (height: number): SheetPosition => {
    const positions: SheetPosition[] = ['collapsed', 'half', 'expanded'];
    return positions.reduce((nearest, position) =>
      Math.abs(getSheetHeight(position) - height) < Math.abs(getSheetHeight(nearest) - height)
        ? position
        : nearest
    , 'half' as SheetPosition);
  };

  const clearSheetCleanupTimer = () => {
    if (sheetCleanupTimerRef.current !== null) {
      window.clearTimeout(sheetCleanupTimerRef.current);
      sheetCleanupTimerRef.current = null;
    }
  };

  const cancelSheetFrames = () => {
    if (sheetDragFrameRef.current !== null) {
      window.cancelAnimationFrame(sheetDragFrameRef.current);
      sheetDragFrameRef.current = null;
    }
    if (sheetSnapFrameRef.current !== null) {
      window.cancelAnimationFrame(sheetSnapFrameRef.current);
      sheetSnapFrameRef.current = null;
    }
  };

  const getSheetVisualOffset = () => {
    if (!sheetRef.current) return 0;
    const transform = window.getComputedStyle(sheetRef.current).transform;
    if (!transform || transform === 'none') return 0;
    return new DOMMatrixReadOnly(transform).m42;
  };

  const flushAndroidSheetTransform = () => {
    if (sheetDragFrameRef.current !== null) {
      window.cancelAnimationFrame(sheetDragFrameRef.current);
      sheetDragFrameRef.current = null;
    }
    const pendingOffset = sheetPendingOffsetRef.current;
    if (pendingOffset !== null && sheetRef.current && sheetPointerIsAndroid.current) {
      sheetRef.current.style.transform = `translate3d(0, ${pendingOffset}px, 0)`;
    }
    sheetPendingOffsetRef.current = null;
  };

  const scheduleAndroidSheetTransform = (offset: number) => {
    sheetPendingOffsetRef.current = offset;
    if (sheetDragFrameRef.current !== null) return;

    sheetDragFrameRef.current = window.requestAnimationFrame(() => {
      sheetDragFrameRef.current = null;
      const pendingOffset = sheetPendingOffsetRef.current;
      if (pendingOffset === null || !sheetRef.current || !sheetPointerActive.current) return;
      sheetRef.current.style.transform = `translate3d(0, ${pendingOffset}px, 0)`;
      sheetPendingOffsetRef.current = null;
    });
  };

  const resetSheetPointer = (animateBack = false) => {
    const wasActive = sheetPointerActive.current;
    const wasAndroid = sheetPointerIsAndroid.current;
    if (wasAndroid) flushAndroidSheetTransform();
    else cancelSheetFrames();
    clearSheetCleanupTimer();

    sheetPointerId.current = null;
    sheetPointerStartY.current = null;
    sheetPointerScrollContainer.current = null;
    sheetPointerActive.current = false;
    sheetPointerIsAndroid.current = false;
    sheetPointerStartOffset.current = 0;
    sheetDragOffsetRef.current = 0;
    if (sheetRef.current) {
      const restingTransform = wasAndroid ? 'translate3d(0, 0, 0)' : 'translateY(0px)';
      if (animateBack && wasActive) {
        sheetRef.current.style.transition = 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)';
        sheetSnapFrameRef.current = window.requestAnimationFrame(() => {
          sheetSnapFrameRef.current = null;
          if (sheetRef.current) sheetRef.current.style.transform = restingTransform;
        });
        sheetCleanupTimerRef.current = window.setTimeout(() => {
          sheetCleanupTimerRef.current = null;
          if (sheetRef.current) {
            sheetRef.current.style.touchAction = '';
            sheetRef.current.style.transition = '';
          }
        }, 200);
      } else {
        sheetRef.current.style.transform = restingTransform;
        sheetRef.current.style.touchAction = '';
        sheetRef.current.style.transition = '';
      }
    }
    setIsSheetDragging(false);
  };

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileScreen || !isMapActive || !e.isPrimary) return;

    const target = e.target as HTMLElement;
    const scrollContainer = target.closest<HTMLElement>('.app-scroll');
    const dragSurface = target.closest<HTMLElement>('[data-sheet-drag-surface]');
    const androidDragSurface = isAndroidBrowser
      ? target.closest<HTMLElement>('[data-sheet-android-drag-surface]')
      : null;
    if (target.closest('input, textarea, select, button, a')) return;

    // Claim the primary pointer immediately on the sheet's blank surface.
    // Form content remains available for native scrolling and text input.
    const canDragSheet = Boolean(dragSurface || androidDragSurface) || !isSheetExpanded || !scrollContainer || target === scrollContainer;
    if (isSheetExpanded && scrollContainer && !canDragSheet) return;

    // If the form is already scrolled, let Android consume this gesture to
    // return the form to its top before a later downward gesture collapses it.
    if (isSheetExpanded && scrollContainer && scrollContainer.scrollTop > 0) return;

    clearSheetCleanupTimer();
    cancelSheetFrames();
    const startOffset = getSheetVisualOffset();
    sheetPointerIsAndroid.current = isAndroidBrowser && e.pointerType === 'touch';
    sheetPointerId.current = e.pointerId;
    sheetPointerStartY.current = e.clientY;
    sheetPointerStartTime.current = Date.now();
    sheetPointerStartPosition.current = sheetPosition;
    sheetPointerScrollContainer.current = scrollContainer;
    sheetPointerActive.current = canDragSheet;
    sheetPointerStartOffset.current = startOffset;

    if (canDragSheet) {
      if (sheetRef.current) {
        sheetRef.current.style.touchAction = 'none';
        sheetRef.current.style.transition = 'none';
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // The browser may cancel a touch before capture is established.
      }
      setIsSheetDragging(true);
    }
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sheetPointerId.current !== e.pointerId || sheetPointerStartY.current === null) return;

    const diff = e.clientY - sheetPointerStartY.current;
    if (!sheetPointerActive.current) {
      if (Math.abs(diff) < 1) return;
      sheetPointerActive.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // The browser may cancel a touch before capture is established.
      }
      setIsSheetDragging(true);
    }

    // Prevent page movement only after a deliberate sheet drag has started.
    e.preventDefault();
    const bounds = getSheetOffsetBounds(sheetPointerStartPosition.current);
    const offset = Math.min(bounds.max, Math.max(bounds.min, sheetPointerStartOffset.current + diff));
    sheetDragOffsetRef.current = offset;
    if (sheetRef.current) {
      if (sheetPointerIsAndroid.current) {
        scheduleAndroidSheetTransform(offset);
      } else {
        sheetRef.current.style.transform = `translateY(${offset}px)`;
      }
    }
  };

  const finishSheetGesture = (position: SheetPosition, e: React.PointerEvent<HTMLDivElement>) => {
    const wasAndroid = sheetPointerIsAndroid.current;
    if (wasAndroid) flushAndroidSheetTransform();
    else cancelSheetFrames();
    clearSheetCleanupTimer();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture may already have been released by Android.
    }

    sheetPointerId.current = null;
    sheetPointerStartY.current = null;
    sheetPointerScrollContainer.current = null;
    sheetPointerActive.current = false;
    sheetPointerIsAndroid.current = false;
    sheetPointerStartOffset.current = 0;
    setSheetPosition(position);
    setIsSheetDragging(false);

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
      sheetSnapFrameRef.current = requestAnimationFrame(() => {
        sheetSnapFrameRef.current = null;
        if (sheetRef.current) {
          sheetRef.current.style.transform = wasAndroid ? 'translate3d(0, 0, 0)' : 'translateY(0px)';
        }
      });
    }

    sheetCleanupTimerRef.current = window.setTimeout(() => {
      sheetCleanupTimerRef.current = null;
      sheetDragOffsetRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.touchAction = '';
        sheetRef.current.style.transition = '';
      }
    }, 320);
  };

  const handleSheetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sheetPointerId.current !== e.pointerId || sheetPointerStartY.current === null) return;

    const diff = e.clientY - sheetPointerStartY.current;
    const duration = Date.now() - sheetPointerStartTime.current;
    if (Math.abs(diff) > 10) suppressSheetClick.current = true;

    if (sheetPointerActive.current) {
      const startPosition = sheetPointerStartPosition.current;
      const startHeight = getSheetHeight(startPosition);
      const currentHeight = startHeight - sheetDragOffsetRef.current;
      const velocity = duration > 0 ? diff / duration : 0;
      const projectedHeight = currentHeight - velocity * 160;
      let nextPosition = getNearestSheetPosition(projectedHeight);

      // A decisive flick advances one snap point in its travel direction.
      if (Math.abs(velocity) > 0.45) {
        const positions: SheetPosition[] = ['collapsed', 'half', 'expanded'];
        const startIndex = positions.indexOf(startPosition);
        const nextIndex = velocity < 0 ? Math.min(positions.length - 1, startIndex + 1) : Math.max(0, startIndex - 1);
        nextPosition = positions[nextIndex];
      }

      finishSheetGesture(nextPosition, e);
      return;
    }

    resetSheetPointer();
  };

  const handleSheetPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    resetSheetPointer(true);
  };

  const [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);
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
  const [serverTimeStatus, setServerTimeStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [serverTimeError, setServerTimeError] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const loadGoogleMaps = useCallback(() => {
    if ((window as any).google?.maps) {
      setGoogleLoaded(true);
      return Promise.resolve();
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src*="maps.googleapis.com/maps/api/js"]`);
    if (existingScript) {
      return new Promise<void>((resolve) => {
        existingScript.addEventListener('load', () => {
          setGoogleLoaded(true);
          resolve();
        }, { once: true });
      });
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleLoaded(true);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  const getTomorrowDate = () => {
    if (!indiaToday) return '';
    const parts = indiaToday.split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    dt.setDate(dt.getDate() + 1);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const tomorrowStr = getTomorrowDate();

  const [formData, setFormData] = useState<BookingDetails>({
    phone: '',
    pickup: '',
    drop: '',
    date: indiaToday,
    time: '',
    numberOfDays: '1',
    waitingHours: '0',
    vehicleType: VehicleType.MINI,
    tripType: TripType.LOCAL,
    localPackage: '',
    isHillStation: false,
    distance: '',
    rawDistance: 0,
    estimatedFare: '',
  });

  const authoritativeClockRef = useRef<{ timestamp: number; receivedAt: number } | null>(null);
  const manualDateRef = useRef(false);
  const manualTimeRef = useRef(false);

  const [mobileSearchType, setMobileSearchType] = useState<null | 'pickup' | 'drop'>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const phoneFocusScrollTimerRef = useRef<number | null>(null);
  const phoneKeyboardResizeHandlerRef = useRef<(() => void) | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [locatingPickup, setLocatingPickup] = useState(false);
  const [gpsErrorPickup, setGpsErrorPickup] = useState<string | null>(null);

  const handleDesktopUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsErrorPickup("GPS is not supported by your browser.");
      return;
    }

    setLocatingPickup(true);
    setGpsErrorPickup(null);

    const onSuccess = (position: any) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      if (googleLoaded && (window as any).google?.maps?.Geocoder) {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          setLocatingPickup(false);
          if (status === 'OK' && results && results[0]) {
            const formattedAddress = results[0].formatted_address;
            const pData = {
              address: formattedAddress,
              placeId: results[0].place_id,
              lat,
              lng
            };
            setFormData(prev => ({ ...prev, pickup: formattedAddress, pickupData: pData }));
            if (pickupRef.current) pickupRef.current.value = formattedAddress;
          } else {
            const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            const pData = {
              address: coords,
              lat,
              lng
            };
            setFormData(prev => ({ ...prev, pickup: coords, pickupData: pData }));
            if (pickupRef.current) pickupRef.current.value = coords;
            setGpsErrorPickup("Failed to resolve address. Using coordinates.");
          }
        });
      } else {
        setLocatingPickup(false);
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const pData = {
          address: coords,
          lat,
          lng
        };
        setFormData(prev => ({ ...prev, pickup: coords, pickupData: pData }));
        if (pickupRef.current) pickupRef.current.value = coords;
      }
    };

    const onError = (error: any) => {
      setLocatingPickup(false);
      setGpsErrorPickup(getGeolocationErrorMessage(error));
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const sessionLeadId = useRef(`lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, leadId: sessionLeadId.current }));
  }, []);

  const syncAuthoritativeTime = useCallback(async () => {
    setServerTimeStatus('loading');
    setServerTimeError('');

    const requestStartedAt = performance.now();
    try {
      const response = await fetch('/api/current-time', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Time service returned ${response.status}`);

      const payload = await response.json() as { timestamp?: number };
      const serverTimestamp = Number(payload.timestamp);
      const receivedAt = performance.now();
      if (!Number.isFinite(serverTimestamp)) throw new Error('Time service returned an invalid timestamp');

      // Approximate the timestamp at the midpoint of the request so validation
      // remains independent of the device wall clock after the response arrives.
      const midpointTimestamp = serverTimestamp + (receivedAt - requestStartedAt) / 2;
      authoritativeClockRef.current = { timestamp: midpointTimestamp, receivedAt };
      const { date, time } = formatIstDateTime(midpointTimestamp);

      setIndiaToday(date);
      setFormData(prev => ({
        ...prev,
        date: manualDateRef.current ? prev.date : date,
        time: manualTimeRef.current ? prev.time : time,
      }));
      setServerTimeStatus('ready');
    } catch (error) {
      authoritativeClockRef.current = null;
      setServerTimeStatus('error');
      setServerTimeError('Official IST time could not be loaded. Please retry before continuing.');
      console.error('Authoritative time sync failed:', error);
    }
  }, []);

  useEffect(() => {
    void syncAuthoritativeTime();
  }, [syncAuthoritativeTime]);

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
    z-index: 10000 !important;
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
  .app-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; touch-action: pan-y; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; }
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

    try {
      const COIMBATORE_BOUNDS = new google.maps.LatLngBounds(
        new google.maps.LatLng(10.60, 76.65),
        new google.maps.LatLng(11.35, 77.10)
      );

      const options = {
        bounds: COIMBATORE_BOUNDS,
        strictBounds: false,
        componentRestrictions: { country: "in" },
        locationBias: COIMBATORE_BOUNDS,
        fields: ["formatted_address", "geometry", "place_id"],
      };

      if (pickupRef.current && !(pickupRef.current as any).__autocompleteInitialized) {
        (pickupRef.current as any).__autocompleteInitialized = true;
        pickupAutocomplete.current = new google.maps.places.Autocomplete(pickupRef.current, options);
        pickupAutocomplete.current.addListener('place_changed', () => {
          const place = pickupAutocomplete.current.getPlace();
          if (place) {
            const lat = typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat;
            const lng = typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng;

            if (!place.geometry || !place.place_id || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
              alert("Selected location details are incomplete or invalid. Please select a specific address.");
              if (pickupRef.current) pickupRef.current.value = '';
              setFormData(prev => ({ ...prev, pickup: '', pickupData: undefined }));
              return;
            }

            const pData = {
              address: place.formatted_address || place.name || '',
              placeId: place.place_id,
              lat,
              lng
            };
            setFormData(prev => ({ ...prev, pickup: pData.address, pickupData: pData }));
          }
        });
      }

      if (dropRef.current && !(dropRef.current as any).__autocompleteInitialized) {
        (dropRef.current as any).__autocompleteInitialized = true;
        dropAutocomplete.current = new google.maps.places.Autocomplete(dropRef.current, options);
        dropAutocomplete.current.addListener('place_changed', () => {
          const place = dropAutocomplete.current.getPlace();
          if (place) {
            const lat = typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat;
            const lng = typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng;

            if (!place.geometry || !place.place_id || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
              alert("Selected location details are incomplete or invalid. Please select a specific address.");
              if (dropRef.current) dropRef.current.value = '';
              setFormData(prev => ({ ...prev, drop: '', dropData: undefined }));
              return;
            }

            const pData = {
              address: place.formatted_address || place.name || '',
              placeId: place.place_id,
              lat,
              lng
            };
            setFormData(prev => ({ ...prev, drop: pData.address, dropData: pData }));
          }
        });
      }
    } catch (e) {
      console.error("Autocomplete Initialization Error:", e);
    }
  }, [googleLoaded, step, formData.tripType]);

  // Initialize Map (Only when visible)
  useEffect(() => {
    if (!googleLoaded || !mapNode) {
      // Reset instances if container is gone
      mapInstance.current = null;
      directionsRenderer.current = null;
      setMapReady(false);
      return;
    }
    if (mapInstance.current) return;

    try {
      mapInstance.current = new google.maps.Map(mapNode, {
        center: { lat: 11.0168, lng: 76.9558 },
        zoom: 12,
        disableDefaultUI: true,
        styles:[{ featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] }]
      });

      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: mapInstance.current,
        polylineOptions: { strokeColor: "#FF6467", strokeWeight: 6, strokeOpacity: 0.95 },
        suppressMarkers: false,
        preserveViewport: true
      });
      setMapReady(true);
    } catch (e) {
      console.error("Map Initialization Error:", e);
      setMapReady(false);
    }

    return () => {
      mapInstance.current = null;
      directionsRenderer.current = null;
      setMapReady(false);
    };
  }, [googleLoaded, mapNode]);

  const pickupMarker = useRef<any>(null);

  const updateMapRoute = useCallback((originStr: string, destinationStr: string, pickupData?: PlaceData, dropData?: PlaceData) => {
    if (!googleLoaded || !originStr || !directionsRenderer.current) return;

    // Clear previous marker if any
    if (pickupMarker.current) {
      pickupMarker.current.setMap(null);
      pickupMarker.current = null;
    }

    const hasPickupCoords = typeof pickupData?.lat === 'number' && typeof pickupData?.lng === 'number';
    const hasDropCoords = typeof dropData?.lat === 'number' && typeof dropData?.lng === 'number';

    if (formData.tripType === TripTypeRental || !destinationStr) {
      // For local or single point, just center and mark
      const renderPickupMarker = (position: any | { lat: number; lng: number }) => {
        if (mapInstance.current) {
          mapInstance.current.setCenter(position);
          mapInstance.current.setZoom(15);
          
          if (pickupMarker.current) {
            pickupMarker.current.setMap(null);
          }
          pickupMarker.current = new google.maps.Marker({
            position,
            map: mapInstance.current,
            title: 'Pickup Location',
            animation: (window as any).google.maps.Animation.DROP
          });
          
          // Clear any existing route
          if (directionsRenderer.current) {
            directionsRenderer.current.setDirections({ routes: [] });
          }

          // Shift center up on mobile so it is not hidden below the bottom sheet
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            setTimeout(() => {
              if (mapInstance.current) {
                mapInstance.current.panBy(0, Math.floor(window.innerHeight * 0.18));
              }
            }, 150);
          }
        }
      };

      if (hasPickupCoords) {
        renderPickupMarker({ lat: pickupData!.lat, lng: pickupData!.lng });
      } else {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: originStr }, (results: any, status: string) => {
          if (status === 'OK' && results[0] && mapInstance.current) {
            renderPickupMarker(results[0].geometry.location);
          }
        });
      }
      return;
    }

    // Normal routing
    if (pickupMarker.current) {
      pickupMarker.current.setMap(null);
      pickupMarker.current = null;
    }

    const origin = hasPickupCoords ? { lat: pickupData!.lat, lng: pickupData!.lng } : originStr;
    const destination = hasDropCoords ? { lat: dropData!.lat, lng: dropData!.lng } : destinationStr;

    directionsService.current.route(
      { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
          setMapError(null);

          if (mapInstance.current && result.routes && result.routes[0]) {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
              const bottomPadding = Math.floor(window.innerHeight * 0.58);
              mapInstance.current.fitBounds(result.routes[0].bounds, {
                top: 80,
                bottom: bottomPadding,
                left: 30,
                right: 30
              });
            } else {
              mapInstance.current.fitBounds(result.routes[0].bounds, 40);
            }
          }
        } else {
          setMapError("Route update failed.");
        }
      }
    );
  }, [googleLoaded, formData.tripType]);

  useEffect(() => {
    if (!googleLoaded) return;

    // Clear any previous route error when input changes so the map remains clear and visible
    setMapError(null);

    const timer = setTimeout(() => {
      if (mapInstance.current) {
        // Handle map container size updates gracefully
        google.maps.event.trigger(mapInstance.current, 'resize');

        if (formData.pickup && (formData.tripType === TripTypeRental || formData.drop)) {
          updateMapRoute(formData.pickup, formData.drop, formData.pickupData, formData.dropData);
        } else {
          mapInstance.current.setCenter({ lat: 11.0168, lng: 76.9558 });
          mapInstance.current.setZoom(12);
          if (directionsRenderer.current) {
            directionsRenderer.current.setDirections({ routes: [] });
          }
          if (pickupMarker.current) {
            pickupMarker.current.setMap(null);
            pickupMarker.current = null;
          }
        }
      }
    }, 800); // 800ms debounce to prevent constant routing updates while typing

    return () => clearTimeout(timer);
  }, [step, formData.pickup, formData.drop, formData.tripType, googleLoaded, updateMapRoute, mapReady]);

  const calculateFare = useCallback(async (originStr: string, destinationStr: string, vehicle: VehicleType, tripType: TripType, pickupData?: PlaceData, dropData?: PlaceData) => {
    // Step 4: check hill station using coordinates when available to avoid geocoding
    const isHill = await checkIsHillStation(
      originStr,
      (pickupData && typeof pickupData.lat === 'number' && typeof pickupData.lng === 'number')
        ? { lat: pickupData.lat, lng: pickupData.lng }
        : undefined
    );
    
    if (tripType === TripTypeRental) {
      if (!formData.localPackage) {
        setFormData(prev => ({
          ...prev,
          isHillStation: isHill,
          distance: '',
          rawDistance: 0,
          estimatedFare: '',
          fareBreakdown: undefined
        }));
        return;
      }
      const pkg = LOCAL_PACKAGES.find(p => p.id === formData.localPackage);
      if (!pkg) return;
      const fareInfo = calculateFareDetails(0, vehicle, TripTypeRental, formData.localPackage, 1, 0, isHill);
      
      // Format distance as "1Hr/10kms"
      const pkgDisplay = pkg.label.replace(/\s/g, '').replace('/', '/').replace('Km', 'kms');
      
      setFormData(prev => ({
        ...prev,
        isHillStation: isHill,
        distance: pkgDisplay,
        rawDistance: 0,
        estimatedFare: fareInfo.displayTotal,
        fareBreakdown: { ...fareInfo.breakdown, total: fareInfo.total }
      }));
      return;
    }

    if (!originStr || !destinationStr || !(window as any).google?.maps) return;

    setLoadingFare(true);

    const hasPickupCoords = typeof pickupData?.lat === 'number' && typeof pickupData?.lng === 'number';
    const hasDropCoords = typeof dropData?.lat === 'number' && typeof dropData?.lng === 'number';

    const origin = hasPickupCoords ? { lat: pickupData!.lat, lng: pickupData!.lng } : originStr;
    const destination = hasDropCoords ? { lat: dropData!.lat, lng: dropData!.lng } : destinationStr;

    try {
      // Step 8: Use Google Directions Route distance as primary source
      const directionsServiceInstance = new google.maps.DirectionsService();
      const result = await new Promise<any>((resolve, reject) => {
        directionsServiceInstance.route(
          { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
          (res: any, status: string) => {
            if (status === 'OK' && res) resolve(res);
            else reject(status);
          }
        );
      }).catch(() => null);

      if (result && result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
        const leg = result.routes[0].legs[0];
        const distanceText = leg.distance.text;
        const distanceValue = leg.distance.value / 1000;
        
        const dayCount = parseInt(formData.numberOfDays || '1', 10) || 1;
        const waitHrs = parseInt(formData.waitingHours || '0', 10) || 0;
        const fareInfo = calculateFareDetails(distanceValue, vehicle, tripType, undefined, dayCount, waitHrs, isHill);

        setFormData(prev => ({
          ...prev,
          isHillStation: isHill,
          distance: tripType === TripType.ROUND_TRIP ? `${(distanceValue * 2).toFixed(1)} km` : distanceText,
          rawDistance: distanceValue,
          estimatedFare: fareInfo.displayTotal,
          fareBreakdown: { ...fareInfo.breakdown, total: fareInfo.total }
        }));
        setLoadingFare(false);
        return;
      }
    } catch (err) {
      console.warn("Directions Route distance lookup failed, falling back to Distance Matrix:", err);
    }

    // Step 3: Coordinate-Based Distance Matrix fallback
    const matrixService = new google.maps.DistanceMatrixService();
    matrixService.getDistanceMatrix(
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
          const dayCount = parseInt(formData.numberOfDays || '1', 10) || 1;
          const waitHrs = parseInt(formData.waitingHours || '0', 10) || 0;
          const fareInfo = calculateFareDetails(distanceValue, vehicle, tripType, undefined, dayCount, waitHrs, isHill);

          setFormData(prev => ({
            ...prev,
            isHillStation: isHill,
            distance: tripType === TripType.ROUND_TRIP ? `${(distanceValue * 2).toFixed(1)} km` : distanceText,
            rawDistance: distanceValue,
            estimatedFare: fareInfo.displayTotal,
            fareBreakdown: { ...fareInfo.breakdown, total: fareInfo.total }
          }));
        }
      }
    );
  }, [formData.localPackage, formData.vehicleType, formData.numberOfDays, formData.waitingHours, formData.pickupData, formData.dropData]); 

  useEffect(() => {
    const runCalculation = async () => {
      if (formData.tripType === TripTypeRental) {
        await calculateFare('', '', formData.vehicleType, formData.tripType);
      } else if (formData.pickup && formData.drop) {
        await calculateFare(formData.pickup, formData.drop, formData.vehicleType, formData.tripType, formData.pickupData, formData.dropData);
      }
    };
    runCalculation();
  }, [formData.pickup, formData.drop, formData.pickupData, formData.dropData, formData.vehicleType, formData.tripType, formData.localPackage, formData.numberOfDays, formData.waitingHours, formData.isHillStation, calculateFare]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'date') manualDateRef.current = true;
    if (name === 'time') manualTimeRef.current = true;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getDateTimeRequiredValidationError = () => {
    if (serverTimeStatus === 'loading') return 'Official IST time is still loading. Please wait and try again.';
    if (serverTimeStatus !== 'ready' || !authoritativeClockRef.current) {
      return serverTimeError || 'Official IST time is unavailable. Please retry before continuing.';
    }
    if (!formData.date || !formData.time) return 'Please select a pickup date and time.';
    return '';
  };

  const handleNextStep = async () => {
    const p = pickupRef.current?.value || formData.pickup;
    const d = dropRef.current?.value || formData.drop;

    const isRental = formData.tripType === TripTypeRental;
    if (isRental && !formData.localPackage) {
      alert("Please select a local package.");
      return;
    }
    if (!p || (!d && !isRental)) {
      alert(isRental ? "Please enter pickup location." : "Please enter pickup and destination.");
      return;
    }

    setLoadingFare(true);

    // Geocoding manual input if coordinates are missing:
    let pickupData = formData.pickupData;
    let dropData = formData.dropData;

    try {
      if (!pickupData || pickupData.address !== p) {
        // Geocode pickup address
        const geocoder = new google.maps.Geocoder();
        const results = await new Promise<any[]>((resolve, reject) => {
          geocoder.geocode({ address: p }, (results: any, status: string) => {
            if (status === 'OK' && results) resolve(results);
            else reject(status);
          });
        }).catch(() => null);

        if (results && results[0]) {
          const res = results[0];
          const lat = res.geometry.location.lat();
          const lng = res.geometry.location.lng();
          pickupData = {
            address: res.formatted_address || p,
            placeId: res.place_id,
            lat,
            lng
          };
        }
      }

      if (!isRental && (!dropData || dropData.address !== d)) {
        // Geocode drop address
        const geocoder = new google.maps.Geocoder();
        const results = await new Promise<any[]>((resolve, reject) => {
          geocoder.geocode({ address: d }, (results: any, status: string) => {
            if (status === 'OK' && results) resolve(results);
            else reject(status);
          });
        }).catch(() => null);

        if (results && results[0]) {
          const res = results[0];
          const lat = res.geometry.location.lat();
          const lng = res.geometry.location.lng();
          dropData = {
            address: res.formatted_address || d,
            placeId: res.place_id,
            lat,
            lng
          };
        }
      }
    } catch (err) {
      console.error("Geocoding manual input failed:", err);
    }

    const updatedData = { 
      ...formData, 
      pickup: p, 
      drop: isRental ? '' : d,
      pickupData,
      dropData
    };
    setFormData(updatedData);
    await calculateFare(p, isRental ? '' : d, formData.vehicleType, formData.tripType, pickupData, dropData);
    
    setLoadingFare(false);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Abandoned Lead Capture Logic
  const leadSentRef = useRef(false);
  const submittedRef = useRef(false);
  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  const handleAbandonment = useCallback(async () => {
    const currentFormData = formDataRef.current;
    const currentSubmitted = submittedRef.current;
    const currentStep = stepRef.current;

    // Only send if we have basic info, not submitted, not currently submitting, and haven't sent yet
    if (
      !currentSubmitted && 
      !isSubmittingRef.current && 
      !leadSentRef.current && 
      currentFormData.phone && 
      currentFormData.phone.length === 10 && 
      (currentFormData.pickup || currentFormData.drop)
    ) {
      const bookingData = {
        ...currentFormData,
        isLead: true,
        estimatedFare: currentFormData.estimatedFare || (currentStep >= 2 ? 'Abandoned at Vehicle/Summary Select' : 'Abandoned Lead (Step 1)')
      };
      
      // ⚠️ Mark as sent synchronously BEFORE async calls to prevent duplicate triggers
      leadSentRef.current = true;
      
    console.log('Capturing abandoned lead...');
      
      // Send Email
      sendBookingEmail(bookingData);
      
      // Save to Google Sheets
      try {
        await appendBookingToSheet(bookingData);
      } catch (err) {
        console.error('Abandonment sheet sync error:', err);
      }
    }
  }, []);

  useEffect(() => {
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
      handleAbandonment();
    };
  }, [handleAbandonment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    const phone = formData.phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    const dateTimeError = getDateTimeRequiredValidationError();
    if (dateTimeError) {
      alert(dateTimeError);
      return;
    }

    setLoading(true);
    isSubmittingRef.current = true;
    leadSentRef.current = true; // Prevent abandonment lead during/after this process

    try {
      // The email API is the booking confirmation gate. Start the Sheets
      // integration at the same time so it does not add another full network
      // round trip before the user sees the confirmed page.
      const sheetPromise = appendBookingToSheet(formData).catch((err) => {
        console.error('Sheet sync error:', err);
      });
      const success = await sendBookingEmail(formData);
      
      if (success) {
        submittedRef.current = true;
        navigate('/booking-confirmed', { replace: true, state: { booking: formData } });
      } else {
        isSubmittingRef.current = false;
        leadSentRef.current = false; // Allow retry or abandonment capture on failure
        alert("Booking failed. Please try again.");
      }

      // Keep the promise observed without making the successful email request
      // wait on the secondary integration.
      void sheetPromise;
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
  const tripDetails = formData.tripType === TripTypeRental
    ? `*Package:* ${LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label}`
    : `*Drop:* ${formData.drop}${formData.tripType === TripType.ROUND_TRIP ? `%0A*Days:* ${formData.numberOfDays}` : ''}`;

  const dateTimeStr = (formData.date || formData.time)
    ? `*Date/Time:* ${formData.date || 'Not specified'} at ${formData.time || 'Not specified'}`
    : '*Date/Time:* Not specified';

  const message =
    `*NEW BOOKING CONFIRMATION*` +
    `%0A*Trip Type:* ${formData.tripType}` +
    `%0A*Phone:* ${formData.phone}` +
    `%0A*Pickup:* ${formData.pickup}` +
    `%0A${tripDetails}` +
    `%0A${dateTimeStr}` +
    `%0A*Vehicle:* ${formData.vehicleType}` +
    `%0A*Estimated Fare:* ${formData.estimatedFare}`;

  window.open(`https://wa.me/919488834020?text=${message}`, '_blank');
};

  const isMapActive = forceMapActive || !!(
    !submitted &&
    formData.pickup && (
      formData.tripType === TripTypeRental ||
      formData.tripType === TripType.ONE_WAY ||
      formData.tripType === TripType.ROUND_TRIP ||
      formData.drop
    )
  );
  const isMobileSummary = isMapActive && isMobileScreen;

  useEffect(() => {
    if (isMapActive) {
      loadGoogleMaps().catch(() => setMapError('Map could not be loaded.'));
    }
  }, [isMapActive, loadGoogleMaps]);

  const openLocationSearch = useCallback((type: 'pickup' | 'drop') => {
    loadGoogleMaps().catch(() => setMapError('Location search could not be loaded.'));
    setMobileSearchType(type);
  }, [loadGoogleMaps]);

  useEffect(() => {
    onMapActiveChange?.(isMapActive);

    const checkAndToggleClass = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && isMapActive) {
        document.documentElement.classList.add('map-is-active');
      } else {
        document.documentElement.classList.remove('map-is-active');
      }
    };

    checkAndToggleClass();
    window.addEventListener('resize', checkAndToggleClass);

    return () => {
      document.documentElement.classList.remove('map-is-active');
      window.removeEventListener('resize', checkAndToggleClass);
    };
  }, [isMapActive, onMapActiveChange]);

  useEffect(() => {
    setSheetPosition('half');
  }, [step, isMapActive]);

  if (submitted) {
    return (
      <div className="text-center max-w-sm mx-auto animate-fade-in">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 relative">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900  mb-2 uppercase tracking-tight">Booking Sent!</h2>
        <p className="text-[11px] text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">driver will call you shortly.</p>

        {/* WhatsApp Confirm Button */}
        <button 
          onClick={handleWhatsAppConfirm} 
          className="w-full bg-[#25D366] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg text-[10px] uppercase tracking-widest active:scale-95 transition-all mb-3 cursor-pointer"
        >
          <MessageCircle size={20} /> WhatsApp support
        </button>

        {/* Book Another Ride Button */}
        <button 
          type="button"   // important to prevent accidental form submission
          onClick={() => {
            const verifiedPhone = formData.phone;
            setSubmitted(false);      // go back to the form
            setStep(1);               // start from step 1
            setFormData({             // reset all fields
              phone: verifiedPhone,
              pickup: '',
              drop: '',
              date: indiaToday,
              time: '',
              numberOfDays: '1',
              waitingHours: '0',
              vehicleType: VehicleType.MINI,
              tripType: TripType.LOCAL,
              localPackage: '8hr80km',
              distance: '',
              rawDistance: 0,
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
          className="w-full text-[10px] font-bold text-slate-900  uppercase border border-slate-300  rounded-2xl py-4 hover:bg-slate-100  transition-all cursor-pointer"
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  return (
    <div className={`booking-form-root
      transition-all duration-500 relative
      ${isMapActive 
        ? 'fixed inset-0 w-full max-w-full overflow-hidden md:relative md:w-full md:max-w-3xl md:min-h-[500px] pointer-events-auto bg-slate-50  md:bg-white  md:p-5 md:rounded-[2.5rem] shadow-none md:shadow-2xl md:border md:border-slate-100  mx-auto flex flex-col md:flex-row gap-5 z-[80]' 
        : 'w-full max-w-lg md:max-w-sm bg-transparent md:bg-white  border-none md:border md:border-slate-105  shadow-none md:shadow-2xl p-0 md:p-5 pb-0 md:pb-6 rounded-none md:rounded-3xl mx-auto'
      }
    `}>
      {isMapActive && (
        <div className="booking-form-map fixed inset-0 md:relative md:w-[45%] md:h-[460px] md:rounded-[2rem] overflow-hidden border-none md:border md:border-slate-100  shadow-none md:shadow-inner z-0 pointer-events-auto">
          <div ref={setMapNode} className="w-full h-full" />
          {mapError && (
            <div className="absolute top-[calc(env(safe-area-inset-top,16px)+190px)] md:top-auto md:bottom-2 left-4 right-4 md:left-2 md:right-2 bg-rose-50/95  border border-rose-200  p-1.5 px-2.5 rounded-xl flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-bottom-1 z-10">
              <AlertTriangle size={12} className="text-[#FF6467] shrink-0" />
              <span className="text-[9px] text-rose-800  font-bold uppercase tracking-wider">{mapError}</span>
            </div>
          )}
        </div>
      )}

      {isMapActive && (
        <button
          type="button"
          onClick={() => {
            // Capture lead immediately before we clear or reset anything!
            handleAbandonment();
            leadSentRef.current = false; // Reset tracker for future attempts

            if (onMapBack) {
              onMapBack();
              return;
            }
            
            // Fall back to home screen by resetting locations and step
            setFormData(prev => ({ 
              ...prev, 
              pickup: '', 
              drop: '', 
              distance: '', 
              estimatedFare: '' 
            }));
            setStep(1);
          }}
          className="booking-form-back md:hidden fixed top-[calc(env(safe-area-inset-top,16px)+16px)] left-4 z-50 bg-white/95  p-3 rounded-full shadow-xl border border-slate-200  flex items-center justify-center active:scale-95 transition-all pointer-events-auto"
          title="Back"
        >
          <ArrowLeft size={18} className="text-slate-700  stroke-[3px]" />
        </button>
      )}

      <div 
        ref={sheetRef}
        onPointerDown={handleSheetPointerDown}
        onPointerMove={handleSheetPointerMove}
        onPointerUp={handleSheetPointerUp}
        onPointerCancel={handleSheetPointerCancel}
        className={`booking-form-sheet
          ${isSheetDragging ? 'transition-none touch-none' : !isSheetExpanded ? 'transition-all duration-300 ease-in-out touch-none' : 'transition-all duration-300 ease-in-out [touch-action:pan-y]'}
          ${isMapActive 
            ? `fixed bottom-0 left-0 right-0 z-30 box-border w-full max-w-none bg-white/95  backdrop-blur-md border-t border-slate-100  flex flex-col gap-2.5 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:bg-transparent  md:backdrop-blur-none md:p-0 md:rounded-none md:shadow-none md:border-t-0 md:h-[460px] md:max-h-[460px] md:flex md:flex-col md:flex-1 md:pr-1 pointer-events-auto
               ${isSheetExpanded 
                 ? `shadow-[0_-15px_30px_rgba(0,0,0,0.15)] p-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] rounded-t-[2rem] box-border ${sheetPosition === 'expanded' || isKeyboardVisible ? 'h-[85dvh] max-h-[calc(100dvh-env(safe-area-inset-top,0px))] md:h-[460px] md:max-h-[460px]' : 'h-[62dvh] max-h-[calc(100dvh-env(safe-area-inset-top,0px))] md:h-[460px] md:max-h-[460px]'} md:shadow-none md:p-0 md:rounded-none`
                 : 'shadow-[0_-5px_15px_rgba(0,0,0,0.08)] min-h-[calc(76px+env(safe-area-inset-bottom,0px))] max-h-none p-3 pt-3 pb-[calc(env(safe-area-inset-bottom,16px)+12px)] rounded-t-2xl md:h-[460px] md:max-h-[460px] md:shadow-none md:p-0 md:rounded-none overflow-visible cursor-pointer'
               }` 
            : 'w-full flex flex-col gap-3.5'
          }
        `}
        onClick={(e) => {
          if (suppressSheetClick.current) {
            suppressSheetClick.current = false;
            return;
          }
          if (isMapActive && !isSheetExpanded) {
            setSheetPosition('half');
          }
        }}
      >
        {isMapActive && (
          <div 
            data-sheet-drag-surface="handle"
            className="w-full flex flex-col items-center py-0.5 cursor-pointer md:hidden group touch-none"
          >
            <div className="w-12 h-1 bg-slate-300  rounded-full group-hover:bg-slate-400  transition-colors" />
          </div>
        )}

        {step === 1 && !isMapActive && (
          <div className="flex flex-col text-left space-y-2 mb-3 select-none animate-fade-in px-1 lg:hidden">
            {/* Display Headings */}
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900  leading-[1.1] tracking-tight">
                Need a Ride? Book a Taxi Nearby
              </h1>
            </div>
          </div>
        )}

        {isMapActive && !isSheetExpanded ? (
          <div data-sheet-android-drag-surface="collapsed" className="flex items-center justify-between mt-1 md:hidden animate-fade-in w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-900  uppercase tracking-tight truncate">
                  Booking in Progress...
                </p>
                <p className="text-[8.5px] font-medium text-slate-500 uppercase tracking-wider truncate">
                  {formData.pickup ? `From: ${formData.pickup.split(',')[0]}` : 'Set locations'}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                if (suppressSheetClick.current) {
                  suppressSheetClick.current = false;
                  return;
                }
                e.stopPropagation();
                setSheetPosition('half');
              }}
              className="bg-[#FF6467] text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 hover:bg-[#FF7075] active:scale-95 transition-all"
            >
              <span>Book</span>
              <ChevronUp size={15} className="stroke-[4px]" />
            </button>
          </div>
        ) : (
          <div
            data-sheet-android-drag-surface="header"
            className={`justify-between items-center mb-1 ${isMapActive && !isSheetExpanded ? 'hidden md:flex' : 'flex'} ${step === 1 && !isMapActive ? 'hidden lg:flex' : 'flex'} ${isMapActive && isAndroidBrowser ? 'touch-none' : ''}`}
          >
            <h3 className={`${step === 2 && isMapActive && isMobileScreen ? 'text-[13px] tracking-wider' : 'text-md tracking-tight'} font-black text-slate-900 uppercase`}>
              {step === 1 ? 'Enter Locations' : step === 2 ? 'Enter Mobile' : step === 3 ? 'Select Vehicle' : 'Trip Summary'}
            </h3>
            <div className="flex gap-1.5">
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 '}`} />
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 '}`} />
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 '}`} />
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 4 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 '}`} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`
          ${isMapActive ? 'flex-1 flex flex-col min-h-0 justify-between gap-2.5 md:flex md:flex-col md:h-full md:space-y-0' : 'space-y-3.5'}
          ${isMapActive && !isSheetExpanded ? 'hidden md:flex' : ''}
        `}>
        {/* Step 2: Phone Number Verification / App Access */}
        {step === 2 && (
          <div className={`${isMapActive ? 'flex-1 flex flex-col min-h-0 justify-between' : 'space-y-4 py-3'} animate-fade-in flex flex-col items-stretch`}>
            {/* Scrollable Body */}
            <div className={`${isMapActive ? 'flex-1 overflow-y-auto pr-1 space-y-4 app-scroll pb-2' : 'space-y-4'}`}>
              <button 
                type="button"
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`${isMapActive && isMobileScreen
                  ? 'px-3.5 py-2 bg-white text-slate-700 text-[10px] border border-slate-200 shadow-none rounded-xl mb-1 mt-1'
                  : 'px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] border border-slate-200 shadow-sm rounded-xl mb-2 mt-2'
                } font-black uppercase tracking-widest transition-all flex items-center gap-1.5 self-start`}
              >
                <ArrowLeft size={14} className="stroke-[3px]" />
                <span>Change Locations</span>
              </button>

              {/* Show Date, Time, Duration card here on mobile & desktop */}
              <div className={`${isMapActive && isMobileScreen
                ? 'bg-white border border-slate-200 rounded-2xl p-2.5 grid grid-cols-2 gap-2.5 shadow-none my-2'
                : 'bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 px-3.5 flex items-center divide-x divide-slate-200/80 shadow-sm gap-0.5 my-2'
              } animate-fade-in text-left`}>
                  {/* Date Column */}
                  <div className={`${isMapActive && isMobileScreen ? 'p-2 rounded-xl bg-slate-50 border border-slate-100' : 'flex-1 pr-3'} flex items-center gap-1.5 min-w-0`}>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[8px] font-black text-slate-400  uppercase tracking-widest mb-0.5 truncate">Date</span>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none  cursor-pointer min-w-0"
                      />
                    </div>
                  </div>

                  {/* Time Column */}
                  <div className={`${isMapActive && isMobileScreen ? 'p-2 rounded-xl bg-slate-50 border border-slate-100' : 'flex-1 px-3'} flex items-center gap-1.5 min-w-0 ${formData.tripType === TripType.ROUND_TRIP ? 'pr-3' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[8px] font-black text-slate-400  uppercase tracking-widest mb-0.5 truncate">Time</span>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none  cursor-pointer min-w-0"
                      />
                    </div>
                  </div>

                  {/* Duration (Round Trip only) */}
                  {formData.tripType === TripType.ROUND_TRIP && (
                    <div className={`${isMapActive && isMobileScreen ? 'col-span-2 p-2 rounded-xl bg-slate-50 border border-slate-100' : 'flex-1 pl-3'} flex items-center gap-1.5 min-w-0`}>
                      <Clock size={13} className="text-[#FF6467] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block text-[8px] font-black text-slate-400  uppercase tracking-widest mb-0.5 truncate">Duration</span>
                        <select
                          name="numberOfDays"
                          value={formData.numberOfDays}
                          onChange={handleChange}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none  appearance-none cursor-pointer min-w-0"
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                            <option key={n} value={n.toString()}>
                              {n === 1 ? 'Same Day' : `${n} Days`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {serverTimeStatus === 'error' && (
                  <div role="alert" className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-800">
                    <span>{serverTimeError}</span>
                    <button
                      type="button"
                      onClick={() => void syncAuthoritativeTime()}
                      className="shrink-0 font-black uppercase tracking-wider text-[#FF6467]"
                    >
                      Retry
                    </button>
                  </div>
                )}

              <div className={`${isMapActive && isMobileScreen
                ? 'w-full bg-white border border-slate-200 focus-within:border-[#FF6269] focus-within:ring-4 focus-within:ring-[#FF6269]/10 rounded-2xl p-3.5 flex items-center gap-3 transition-all shadow-none'
                : 'w-full bg-[#FF6467]/5 border-2 border-[#FF6467] focus-within:ring-4 focus-within:ring-[#FF6467]/20 rounded-xl p-2.5 px-3.5 flex items-center gap-3 transition-all shadow-md shadow-[#FF6467]/5'
              } relative overflow-hidden text-left mt-2`}>
                <span className={`text-[13px] font-semibold leading-none select-none border-r pr-2 ${isMapActive && isMobileScreen ? 'text-slate-700 border-slate-200' : 'text-[#FF6467] border-[#FF6467]/20'}`}>
                  +91
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`block text-[8px] font-black uppercase tracking-widest mb-0.5 ${isMapActive && isMobileScreen ? 'text-slate-500' : 'text-[#FF6467]'}`}>Mobile Number</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onFocus={(e) => {
                      if (!isMobileScreen || !isMapActive) return;
                      setIsKeyboardVisible(true);
                      const input = e.currentTarget;

                      phoneKeyboardResizeHandlerRef.current?.();
                      const viewport = window.visualViewport;
                      if (viewport) {
                        const handleViewportResize = () => {
                          if (viewport.height >= window.innerHeight - 80) {
                            setIsKeyboardVisible(false);
                          }
                        };
                        viewport.addEventListener('resize', handleViewportResize);
                        phoneKeyboardResizeHandlerRef.current = () => {
                          viewport.removeEventListener('resize', handleViewportResize);
                          phoneKeyboardResizeHandlerRef.current = null;
                        };
                      }

                      if (phoneFocusScrollTimerRef.current !== null) {
                        window.clearTimeout(phoneFocusScrollTimerRef.current);
                      }

                      const focusViewportHeight = window.visualViewport?.height ?? window.innerHeight;
                      phoneFocusScrollTimerRef.current = window.setTimeout(() => {
                        phoneFocusScrollTimerRef.current = null;
                        const viewport = window.visualViewport;
                        const keyboardIsOpen = viewport
                          ? focusViewportHeight - viewport.height > 80
                          : false;
                        if (!viewport || !keyboardIsOpen) return;

                        const viewportBottom = viewport.offsetTop + viewport.height;
                        const inputRect = input.getBoundingClientRect();
                        const overlap = inputRect.bottom - (viewportBottom - 16);
                        if (overlap <= 0) return;

                        const scrollContainer = input.closest<HTMLElement>('.app-scroll');
                        if (scrollContainer) {
                          scrollContainer.scrollBy({ top: overlap + 12, behavior: 'auto' });
                        } else {
                          input.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                        }
                      }, 250);
                    }}
                    onBlur={() => {
                      phoneKeyboardResizeHandlerRef.current?.();
                      if (phoneFocusScrollTimerRef.current !== null) {
                        window.clearTimeout(phoneFocusScrollTimerRef.current);
                        phoneFocusScrollTimerRef.current = null;
                      }
                      setIsKeyboardVisible(false);
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      const sliced = cleaned.slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: sliced }));
                      if (sliced.length === 10) {
                        e.target.blur();
                      }
                    }}
                    className={`w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-black outline-none text-slate-900 ${isMapActive && isMobileScreen ? 'placeholder-slate-400' : 'placeholder-[#FF6467]/40'}`}
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div data-sheet-android-drag-surface="footer" className={`${isMapActive ? 'pt-3 border-t border-slate-100  bg-white/95  md:bg-transparent' : ''} ${isMapActive && isAndroidBrowser ? 'touch-none' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  const phone = formData.phone.trim();
                  const phoneRegex = /^[6-9]\d{9}$/;
                  if (!phoneRegex.test(phone)) {
                    alert("Please enter a valid 10-digit Indian mobile number.");
                    return;
                  }
                  const dateTimeError = getDateTimeRequiredValidationError();
                  if (dateTimeError) {
                    alert(dateTimeError);
                    return;
                  }
                  setStep(3);
                }}
                className="w-full bg-[#FF7075] hover:bg-[#FF6467] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF7075]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Let’s Choose a Vehicle <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className={`${isMapActive ? 'flex-1 flex flex-col min-h-0 justify-between' : 'space-y-3.5'} animate-fade-in`}>
            {/* Scrollable Body */}
            <div className={`${isMapActive ? 'flex-1 overflow-y-auto pr-1 space-y-3.5 app-scroll pb-2' : 'space-y-3.5'}`}>
          {/* Trip Type Category Selector */}
          <div className="flex gap-2.5 flex-wrap pb-1 animate-fade-in select-none">
            {[
              { id: 'local', label: 'Book Ride' },
              { id: 'rental', label: 'Rental' },
              { id: 'outstation', label: 'Outstation' }
            ].map((cat) => {
              const isActive = 
                (cat.id === 'local' && formData.tripType === TripType.LOCAL) ||
                (cat.id === 'outstation' && (formData.tripType === TripType.ONE_WAY || formData.tripType === TripType.ROUND_TRIP)) ||
                (cat.id === 'rental' && formData.tripType === TripTypeRental);
              
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    let newTripType = TripType.LOCAL;
                    if (cat.id === 'outstation') {
                      newTripType = TripType.ONE_WAY;
                    } else if (cat.id === 'rental') {
                      newTripType = TripTypeRental;
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      tripType: newTripType, 
                      estimatedFare: '', 
                      distance: '',
                      localPackage: ''
                    }));
                  }}
                  className={`
                    px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm border
                    ${isActive 
                      ? 'bg-brand-yellow text-white border-transparent shadow-brand-yellow/10' 
                      : 'bg-white  text-slate-700  border-slate-200/80 '}
                  `}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

  
          {/* Outstation Type Sub-selector (One Way vs Round Trip Toggle Switch) */}
          {(formData.tripType === TripType.ONE_WAY || formData.tripType === TripType.ROUND_TRIP) && (
            <div className="relative flex bg-slate-100  p-1.5 rounded-xl border border-slate-200/40  gap-1 select-none">
              {[
                { id: TripType.ONE_WAY, label: 'One Way (Drop)' },
                { id: TripType.ROUND_TRIP, label: 'Round Trip' }
              ].map((subType) => {
                const isSelected = formData.tripType === subType.id;
                return (
                  <button
                    key={subType.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tripType: subType.id, estimatedFare: '', distance: '' }))}
                    className={`
                      relative flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 z-10
                      ${isSelected 
                        ? 'text-slate-800  font-black' 
                        : 'text-slate-400 hover:text-slate-600 '}
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeOutstationSubtype"
                        className="absolute inset-0 bg-white  rounded-lg shadow-sm border border-slate-200/20 "
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{subType.label}</span>
                  </button>
                );
              })}
            </div>
          )}



          {/* Unified App-Style Route Selector Card */}
          <div className="space-y-3 animate-fade-in select-none">
            {/* Pickup Location Card */}
            <div 
              onClick={() => openLocationSearch('pickup')}
              className="relative bg-white  border border-slate-200/50  rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-slate-300  transition-all cursor-pointer min-h-[48px]"
            >
              <MapPin className="text-brand-yellow shrink-0" size={18} />
              <div className="flex-1 min-w-0 text-left">
                <span className="block text-[8px] font-black text-slate-400  uppercase tracking-widest mb-0.5">Pickup Location</span>
                <div className={`text-xs font-bold line-clamp-2 break-words whitespace-normal text-left leading-snug ${formData.pickup ? 'text-slate-800 ' : 'text-slate-400 '}`}>
                  {formData.pickup || "Enter Pickup Location"}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {locatingPickup && (
                  <div className="w-5 h-5 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                )}
                {!locatingPickup && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDesktopUseGPS();
                    }}
                    className="w-7 h-7 bg-brand-yellow text-white hover:bg-[#FF6467] rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                    title="Use current GPS location"
                  >
                    <Locate size={13} className="stroke-[3px]" />
                  </button>
                )}
                {formData.pickup && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, pickup: '', pickupData: undefined }));
                      if (pickupRef.current) pickupRef.current.value = '';
                    }}
                    className="w-7 h-7 bg-slate-200/60  text-slate-500 rounded-full flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={12} className="stroke-[3px]" />
                  </button>
                )}
              </div>
            </div>

            {gpsErrorPickup && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-[11px] font-semibold">
                <AlertTriangle size={14} className="shrink-0 text-[#FF6467]" />
                <span>{gpsErrorPickup}</span>
              </div>
            )}

            {formData.tripType !== TripTypeRental && (
              /* Destination Card */
              <div 
                onClick={() => openLocationSearch('drop')}
                className="relative bg-white  border border-slate-200/50  rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-slate-300  transition-all cursor-pointer min-h-[48px]"
              >
                <div className="w-4.5 h-4.5 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="block text-[8px] font-black text-slate-400  uppercase tracking-widest mb-0.5">Destination</span>
                  <div className={`text-xs font-bold line-clamp-2 break-words whitespace-normal text-left leading-snug ${formData.drop ? 'text-slate-800 ' : 'text-slate-400 '}`}>
                    {formData.drop || "Enter Destination"}
                  </div>
                </div>
                {formData.drop && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, drop: '' }));
                      if (dropRef.current) dropRef.current.value = '';
                    }}
                    className="w-7 h-7 bg-slate-200/60  text-slate-500 rounded-full flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={12} className="stroke-[3px]" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Local Package Select */}
          {formData.tripType === TripTypeRental && (
            <div className="bg-slate-50  border border-slate-200/60  rounded-xl p-2 px-3 flex items-center gap-3 shadow-sm">
              <Package size={14} className="text-[#FF6467]" />
              <div className="flex-1">
                <span className="block text-[8px] font-black text-slate-400  uppercase tracking-widest mb-0.5">Local Package</span>
                <select
                  name="localPackage"
                  value={formData.localPackage}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none  appearance-none cursor-pointer"
                >
                  <option value="">Select Package</option>
                  {LOCAL_PACKAGES.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Compact Unified Date, Time & Duration Card */}
          <style>{`
            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
              background: transparent;
              display: none !important;
              -webkit-appearance: none;
            }
          `}</style>

          <div
            data-sheet-drag-surface="blank"
            aria-hidden="true"
            className="md:hidden h-24 shrink-0 touch-none"
          />

            </div>

            {/* Sticky Footer */}
            <div data-sheet-android-drag-surface="footer" className={`${isMapActive ? 'pt-3 border-t border-slate-100  bg-white/95  md:bg-transparent' : ''} ${isMapActive && isAndroidBrowser ? 'touch-none' : ''}`}>
              <button 
                type="button" 
                id="btn-next-step"
                onClick={handleNextStep} 
                className="w-full bg-[#FF7075] hover:bg-[#FF6467] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF7075]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className={`${isMapActive ? 'flex-1 flex flex-col min-h-0 justify-between gap-1' : 'space-y-3.5'} animate-fade-in`}>
          <div className="flex justify-between items-center px-1">
            <button 
              type="button"
              onClick={() => {
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-[#FF6467] hover:bg-slate-50  p-1.5 -ml-1 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <span className="text-[9px] font-black text-slate-400  uppercase tracking-widest">Scroll to Select Vehicle</span>
          </div>

          <div className={`${isMapActive ? 'flex-1 overflow-y-auto pr-1 app-scroll pb-2 min-h-0' : 'relative group'}`}>
            <div className={`${isMapActive ? 'space-y-1.5' : 'space-y-1.5 max-h-[350px] overflow-y-auto pr-1 app-scroll'}`}>
            {VEHICLE_CONFIG.map((v) => {
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => {
                    const distanceVal = formData.rawDistance || 0;
                    const isTripValid = formData.tripType === TripType.LOCAL || distanceVal > 0;
                    const dayCount = parseInt(formData.numberOfDays || '1', 10) || 1;
                    const waitHrs = parseInt(formData.waitingHours || '0', 10) || 0;
                    const fareInfo = calculateFareDetails(distanceVal, v.type, formData.tripType, formData.localPackage, dayCount, waitHrs, formData.isHillStation);
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      vehicleType: v.type,
                      estimatedFare: isTripValid ? fareInfo.displayTotal : '',
                      fareBreakdown: isTripValid ? { ...fareInfo.breakdown, total: fareInfo.total } : undefined
                    }));
                  }}
                  style={isMapActive && isMobileScreen && v.type !== VehicleType.CUSTOM ? { minHeight: '112px', height: '112px', maxHeight: '112px' } : undefined}
                  className={`
                    w-full flex items-center gap-3 rounded-2xl border-2 transition-all text-left overflow-hidden
                    ${isMapActive && isMobileScreen
                      ? v.type === VehicleType.CUSTOM ? 'p-3.5' : 'min-h-[112px] h-[112px] max-h-[112px] p-3.5'
                      : 'p-6'}
                    ${formData.vehicleType === v.type 
                      ? 'border-[#FF6467] bg-[#FF6467]/5 ' 
                      : 'border-slate-50  bg-white '}
                  `}
                >
                  {v.type === VehicleType.CUSTOM ? (
                    <div className="flex-1 min-w-0 text-left overflow-hidden">
                      <span className="text-xs font-bold text-slate-900  uppercase block truncate leading-tight">
                        {v.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-tight">
                        {v.description}
                      </span>
                    </div>
                  ) : (
                    <>
                  {/* Vehicle Image */}
                  {v.image ? (
                    <div
                      className={`${isMapActive && isMobileScreen ? 'w-[150px] h-20' : 'w-30 h-14'} flex items-center justify-center shrink-0`}
                      style={isMapActive && isMobileScreen ? { width: '150px', height: '80px' } : undefined}
                    >
                      <img
                        src={v.image}
                        alt={v.label}
                        width="160"
                        height="80"
                        loading="eager"
                        decoding="async"
                        className="w-full h-auto object-contain rounded-lg"
                        style={isMapActive && isMobileScreen ? { width: '100%', height: 'auto', maxWidth: 'none', maxHeight: 'none' } : undefined}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className={`${isMapActive && isMobileScreen ? 'w-[150px] h-20' : 'w-30 h-14'} flex items-center justify-center bg-slate-100  rounded-lg shrink-0`}
                      style={isMapActive && isMobileScreen ? { width: '150px', height: '80px' } : undefined}
                    >
                      <Car size={24} className="text-slate-400" />
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="flex-1 min-w-0 text-left overflow-hidden">
                    <span className="text-xs font-bold text-slate-900  uppercase block truncate leading-tight">
                      {v.label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-slate-400  flex items-center gap-0.5 shrink-0">
                        <User size={10} /> {v.capacity} 
                      </span>
                      <span className="min-w-0 text-slate-400  font-semibold truncate leading-tight">
                        • {v.description}
                      </span>
                    </div>
                  </div>
                    </>
                  )}
                </button>
              );
            })}
            </div>
          </div>

          {/* Sticky Footer */}
          <div data-sheet-android-drag-surface="footer" className={`${isMapActive ? 'pt-3 border-t border-slate-100  bg-white/95  md:bg-transparent' : ''} flex gap-3 ${isMapActive && isAndroidBrowser ? 'touch-none' : ''}`}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="p-4 bg-slate-50  text-slate-400 rounded-xl border border-slate-100  active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              disabled={loading}
              className="flex-1 bg-[#FF7075] hover:bg-[#FF6467] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF7075]/20 uppercase tracking-widest text-xs active:scale-95 transition-all"
              onClick={() => {
                if (!formData.vehicleType) {
                  alert("Please select a vehicle.");
                  return;
                }
                setStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}

           {/* Step 4: Summary */}
        {step === 4 && (
          <div className={`${isMapActive ? 'flex-1 flex flex-col min-h-0 justify-between' : 'space-y-4'} animate-fade-in`}>
            {/* Scrollable Body */}
            <div className={`${isMapActive
              ? `${isMobileScreen ? 'flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 app-scroll pb-14' : 'flex-1 overflow-y-auto pr-1 space-y-2.5 app-scroll pb-2'}`
              : 'space-y-4'
            }`}>
        <div className={`transition-all
          ${isMobileSummary
            ? 'bg-white border-0 rounded-none p-0 space-y-4'
            : 'bg-slate-50 border border-slate-100 shadow-sm rounded-[2rem] p-5 space-y-4'
          }
        `}>
          <div className={isMobileSummary ? 'space-y-0' : 'space-y-3'}>
            <div className="flex gap-3">
              <div className={`flex flex-col items-center shrink-0
                ${isMobileSummary 
                  ? 'w-4 h-[76px] gap-1 py-1' 
                  : 'w-10 h-10 gap-1.5 py-1'
                }
              `}>
                <div className={`rounded-full border-2 border-[#FF6467]
                  ${isMobileSummary ? 'w-2 h-2' : 'w-2 h-2'}
                `} />
                <div className={`w-px flex-1 ${isMobileSummary ? 'bg-[#FF6269]/30' : 'bg-slate-200'}`} />
                <div className={`rounded-full bg-[#FF6467]
                  ${isMobileSummary ? 'w-2 h-2' : 'w-2 h-2'}
                `} />
              </div>
              <div className={`flex-1 pt-0.5 min-w-0
                ${isMobileSummary ? 'space-y-0' : 'space-y-4'}
              `}>
                <div className={isMobileSummary ? 'pb-3 border-b border-slate-100' : ''}>
                  <span className="text-[8px] font-black text-slate-400  uppercase tracking-widest block mb-0.5">Pickup</span>
                  <p className={`text-[10px] font-bold text-slate-900 leading-snug ${isMobileSummary ? 'line-clamp-2' : ''}`}>{formData.pickup}</p>
                </div>
                <div className={isMobileSummary ? 'pt-3' : ''}>
                  <span className="text-[8px] font-black text-slate-400  uppercase tracking-widest block mb-0.5">Destination</span>
                  <p className={`text-[10px] font-bold text-slate-900 leading-snug ${isMobileSummary ? 'line-clamp-2' : ''}`}>
                    {formData.tripType === TripTypeRental
                      ? LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label
                      : formData.drop}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isMobileSummary ? (
            <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
              <div className="min-w-0">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Departure</span>
                <p className="text-[10px] font-bold text-slate-900 truncate">{formData.date}</p>
                <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{formData.time}</p>
              </div>
              <div className="min-w-0 border-l border-slate-100 pl-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vehicle</span>
                <p className="text-[10px] font-bold text-slate-900 uppercase truncate">{formData.vehicleType}</p>
              </div>
              <div className="min-w-0 border-l border-slate-100 pl-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mobile</span>
                <p className="text-[10px] font-bold text-slate-900 truncate">{formData.phone}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Departure</span>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900">{formData.date}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900">{formData.time}</p>
                </div>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Vehicle</span>
                <div className="flex items-center gap-1.5">
                  <Car size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900 uppercase truncate">{formData.vehicleType}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900">{formData.phone}</p>
                </div>
              </div>
            </div>
          )}

          <div className={`flex justify-between items-end
            ${isMobileSummary ? 'pt-1' : 'border-t border-slate-100 pt-4'}
          `}>
            <div>
              <span className="text-[8px] font-black text-slate-400  uppercase tracking-widest block mb-0.5">Estimated Distance</span>
              <span className="text-xs font-black text-[#FF6269]">{formData.distance}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400  uppercase tracking-widest block mb-0.5">Estimated Fare</span>
              <span className={`font-black text-slate-900 ${isMobileSummary ? 'text-lg' : 'text-2xl'}`}>{formData.estimatedFare}</span>
            </div>
          </div>

          <div className={`text-left
            ${isMobileSummary ? 'pt-1' : 'border-t border-slate-100 pt-2.5 text-center'}
          `}>
            <p className={`font-black text-slate-400  uppercase tracking-widest
              ${isMobileSummary ? 'text-[7px] leading-relaxed' : 'text-[9px]'}
            `}>
              * Tolls, permit, parking & other charges extra. T&C apply.
            </p>
          </div>
        </div>

            </div>
            {/* Sticky Footer */}
            <div data-sheet-android-drag-surface="footer" className={`${isMapActive ? 'pt-3 border-t border-slate-100  bg-white/95  md:bg-transparent shrink-0' : ''} flex gap-3 ${isMapActive && isAndroidBrowser ? 'touch-none' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 bg-slate-50  text-slate-400 rounded-xl border border-slate-100  active:scale-95 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#FF7075] hover:bg-[#FF6467] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF7075]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Booking...' : (
                  <>
                    Confirm & Book Now <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
      </div>
      
      {mobileSearchType && (
        <LocationSearchOverlay 
          type={mobileSearchType}
          googleLoaded={googleLoaded}
          initialValue={mobileSearchType === 'pickup' ? formData.pickup : formData.drop}
          onClose={() => {
            setMobileSearchType(null);
            setSheetPosition('half');
          }}
          onSelect={async (address, placeData) => {
            if (mobileSearchType === 'pickup') {
              setFormData(prev => ({ ...prev, pickup: address, pickupData: placeData }));
              if (pickupRef.current) pickupRef.current.value = address;
            } else {
              setFormData(prev => ({ ...prev, drop: address, dropData: placeData }));
              if (dropRef.current) dropRef.current.value = address;
            }
            setMobileSearchType(null);
            setSheetPosition('half');
          }}
        />
      )}
    </div>
  );
};

