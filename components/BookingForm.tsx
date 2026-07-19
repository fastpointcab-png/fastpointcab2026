import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookingDetails, VehicleType, TripType, FareBreakdown, PlaceData } from '../types';
import { MapPin, User, Phone, Smartphone, Car, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Map as MapIcon, AlertTriangle, Repeat, Navigation, Package, X, ChevronUp, ChevronDown, Locate } from 'lucide-react';
import { sendBookingEmail } from '../services/emailService';
import { appendBookingToSheet } from '../services/googleSheets';
import { motion } from 'framer-motion';

declare const google: any;

const TripTypeRental = (TripType as any).RENTAL || 'Rental' as TripType;

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
    label: 'MINI', 
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

const POPULAR_LOCATIONS = [
  "Coimbatore International Airport (CJB)",
  "Coimbatore Junction Railway Station (CBE)",
  "Gandhipuram Bus Stand, Coimbatore",
  "Ukkadam Bus Stand, Coimbatore",
  "Singanallur Bus Stand, Coimbatore",
  "RS Puram, Coimbatore",
  "Peelamedu, Coimbatore",
  "Saravanampatti, Coimbatore",
  "Vadavalli, Coimbatore",
  "Thudiyalur, Coimbatore",
  "Kuniamuthur, Coimbatore",
  "Koundampalayam, Coimbatore",
  "Hope College, Coimbatore",
  "L&T Bypass Road, Coimbatore",
  "Laxmi Mills Junction, Coimbatore",
  "PSG Tech, Peelamedu, Coimbatore",
  "Brookefields Mall, Coimbatore",
  "Prozone Mall, Sathy Road, Coimbatore",
  "Fun Republic Mall, Avinashi Road, Coimbatore",
  "Eachanari Vinayagar Temple, Coimbatore"
];

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
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [clickedToType, setClickedToType] = useState(false);

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

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS is not supported by your browser.");
      return;
    }

    setLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        console.log(`High Accuracy GPS: Lat=${lat}, Lng=${lng}, Accuracy=${accuracy}m`);

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
      },
      (error) => {
        setLocating(false);
        console.error("GPS Error Code:", error.code, "Message:", error.message);
        let errorMsg = "Unable to get your GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access was denied. Please allow location permissions in your browser/device settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location info is unavailable. Ensure GPS is enabled on your device.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "GPS location request timed out. Please try again.";
        }
        setGpsError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    if (googleLoaded && (window as any).google?.maps?.places) {
      service.current = new (window as any).google.maps.places.AutocompleteService();
    }
  }, [googleLoaded]);

  // Handle body scroll lock and hiding other layout components on mobile
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mobile-search-active');
    return () => {
      document.body.style.overflow = 'unset';
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
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] flex flex-col animate-in slide-in-from-bottom-5 duration-300 h-[100dvh] overflow-hidden">
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
      <div className="flex flex-col px-4 pb-4 pt-[calc(env(safe-area-inset-top,1rem)+16px)] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 text-[#FF6467] hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -ml-2 rounded-xl transition-all min-h-[44px]"
          >
            <ArrowLeft size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
          </button>
          <h2 className="text-[12px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
            {type === 'pickup' ? 'Select Pickup Point' : 'Select Destination'}
          </h2>
          <button 
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-250 dark:border-slate-700 shadow-sm min-h-[44px]"
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
            className={`w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-[#FF6467]/20 rounded-2xl pl-12 ${type === 'pickup' ? 'pr-24' : 'pr-12'} py-4 min-h-[48px] text-[13px] font-bold outline-none dark:text-white transition-all shadow-inner`}
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6467]" size={18} />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {type === 'pickup' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseGPS();
                }}
                disabled={locating}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 active:scale-95 cursor-pointer animate-fade-in"
                title="Use current GPS location (99% accuracy)"
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
                className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 hover:text-rose-500 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 pb-[calc(env(safe-area-inset-bottom,16px)+32px)] overscroll-contain">
        {type === 'pickup' && !query && (
          <div className="mb-4">
            {gpsError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-200 text-[11px] font-semibold">
                <AlertTriangle size={14} className="shrink-0 text-[#FF6467]" />
                <span>{gpsError}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={locating}
              className="w-full flex items-center gap-3.5 p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-2xl transition-all text-left border border-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="bg-emerald-500 text-white p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <Locate size={16} className={`stroke-[3px] ${locating ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">
                  {locating ? 'Acquiring GPS Location...' : 'Use Current GPS Location'}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {locating ? 'Pinging satellites for maximum accuracy (99%)...' : 'Detects your work, home or current location with high precision'}
                </span>
              </div>
            </button>
          </div>
        )}
        {predictions.length > 0 ? (
          predictions.map((p) => (
            <button 
              key={p.place_id}
              disabled={locating}
              onClick={async () => {
                setLocating(true);
                try {
                  const placeDetails = await fetchPlaceDetails(p.place_id);
                  const lat = typeof placeDetails.geometry?.location?.lat === 'function' ? placeDetails.geometry.location.lat() : placeDetails.geometry?.location?.lat;
                  const lng = typeof placeDetails.geometry?.location?.lng === 'function' ? placeDetails.geometry.location.lng() : placeDetails.geometry?.location?.lng;
                  
                  if (!placeDetails.geometry || !placeDetails.place_id || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
                    alert("Selected location details are incomplete or invalid. Please select a specific address.");
                    setLocating(false);
                    return;
                  }

                  const pData = {
                    address: placeDetails.formatted_address || p.description,
                    placeId: placeDetails.place_id,
                    lat,
                    lng
                  };
                  setLocating(false);
                  onSelect(pData.address, pData);
                } catch (err) {
                  console.error("Failed to fetch place details:", err);
                  setLocating(false);
                  onSelect(p.description);
                }
              }}
              className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-left group border-b border-slate-50 dark:border-slate-800 last:border-none"
            >
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
                <MapPin size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[#FF6467] dark:text-[#FF6467] leading-5">
                  {p.structured_formatting?.main_text || p.description}
                </div>

                <div className="text-[12px] text-slate-900 dark:text-white mt-1 leading-5 break-words font-medium">
                  {p.structured_formatting?.secondary_text || p.description}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="space-y-1 pt-2">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">
              {query ? 'Matching Locations' : 'Popular Locations Coimbatore'}
            </h3>
            {(query ? POPULAR_LOCATIONS.filter(l => l.toLowerCase().includes(query.toLowerCase())) : POPULAR_LOCATIONS).map((loc) => (
              <button
                key={loc}
                type="button"
                disabled={locating}
                onClick={async () => {
                  setLocating(true);
                  try {
                    const geocoder = new (window as any).google.maps.Geocoder();
                    const results = await new Promise<any[]>((resolve, reject) => {
                      geocoder.geocode({ address: loc }, (results: any, status: string) => {
                        if (status === 'OK' && results) resolve(results);
                        else reject(status);
                      });
                    });

                    if (results && results[0]) {
                      const res = results[0];
                      const lat = res.geometry.location.lat();
                      const lng = res.geometry.location.lng();
                      const pData = {
                        address: res.formatted_address || loc,
                        placeId: res.place_id,
                        lat,
                        lng
                      };
                      setLocating(false);
                      onSelect(pData.address, pData);
                    } else {
                      setLocating(false);
                      onSelect(loc);
                    }
                  } catch (err) {
                    console.error("Geocoding popular location failed:", err);
                    setLocating(false);
                    onSelect(loc);
                  }
                }}
                className="w-full flex items-center gap-3.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-left border-b border-slate-100 dark:border-slate-800/40 last:border-none"
              >
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl text-emerald-500">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {loc}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                    Coimbatore, Tamil Nadu
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const stepRef = useRef(1);
  useEffect(() => { stepRef.current = step; }, [step]);

  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    
    // Swipe down (diff > 40) means collapse the sheet
    if (diff > 40) {
      setIsSheetExpanded(false);
    }
    // Swipe up (diff < -40) means expand the sheet
    else if (diff < -40) {
      setIsSheetExpanded(true);
    }
    touchStartY.current = null;
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
    date: '',
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

  const [mobileSearchType, setMobileSearchType] = useState<null | 'pickup' | 'drop'>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        console.log(`High Accuracy Desktop GPS: Lat=${lat}, Lng=${lng}, Accuracy=${accuracy}m`);

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
      },
      (error) => {
        setLocatingPickup(false);
        console.error("GPS Error Code:", error.code, "Message:", error.message);
        let errorMsg = "Unable to get your GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access was denied. Please allow location permissions in your browser/device settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location info is unavailable. Ensure GPS is enabled on your device.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "GPS location request timed out. Please try again.";
        }
        setGpsErrorPickup(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

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
    setFormData(prev => ({ ...prev, date: dateStr }));

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
    setFormData(prev => ({ ...prev, [name]: value }));
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
      
      console.log('Capturing abandoned lead...', bookingData.phone);
      
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
        submittedRef.current = true;
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
  const tripDetails = formData.tripType === TripTypeRental 
    ? `*Package:* ${LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label}`
    : `*Drop:* ${formData.drop}${formData.tripType === TripType.ROUND_TRIP ? `%0A*Days:* ${formData.numberOfDays}` : ''}`;
  
  const dateTimeStr = (formData.date || formData.time) 
    ? `*Date/Time:* ${formData.date || 'Not specified'} at ${formData.time || 'Not specified'}`
    : '*Date/Time:* Not specified';

  const hillStr = formData.isHillStation ? '%0A*Hill Station Charge:* Applied (₹300)' : '';

  const message = `*NEW BOOKING CONFIRMATION*%0A*Trip Type:* ${formData.tripType}%0A*Phone:* ${formData.phone}%0A*Pickup:* ${formData.pickup}%0A${tripDetails}%0A${dateTimeStr}${hillStr}%0A*Vehicle:* ${formData.vehicleType}%0A*Fare:* ${formData.estimatedFare}`;
  window.open(`https://wa.me/918870088020?text=${message}`, '_blank');
};


  const isMapActive = !!(
    !submitted &&
    formData.pickup && (
      formData.tripType === TripTypeRental ||
      formData.tripType === TripType.ONE_WAY ||
      formData.tripType === TripType.ROUND_TRIP ||
      formData.drop
    )
  );

  useEffect(() => {
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
  }, [isMapActive]);

  useEffect(() => {
    setIsSheetExpanded(true);
  }, [step, isMapActive]);

  if (submitted) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-sm mx-auto animate-fade-in my-10">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 relative">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Booking Sent!</h2>
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
          className="w-full text-[10px] font-bold text-slate-900 dark:text-white uppercase border border-slate-300 dark:border-slate-700 rounded-2xl py-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  return (
    <div className={`
      transition-all duration-500 relative
      ${isMapActive 
        ? 'fixed inset-0 w-full max-w-full overflow-hidden md:relative md:w-full md:max-w-3xl md:min-h-[500px] pointer-events-auto bg-slate-50 dark:bg-slate-950 md:bg-white md:dark:bg-slate-900 md:p-5 md:rounded-[2.5rem] shadow-none md:shadow-2xl md:border md:border-slate-100 md:dark:border-slate-800 mx-auto flex flex-col md:flex-row gap-5 z-[80]' 
        : isMobileScreen
          ? 'w-full max-w-lg bg-transparent border-none shadow-none p-0 mx-auto'
          : 'w-full max-w-sm bg-white dark:bg-slate-900 p-4 pb-6 sm:p-5 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 mx-auto'
      }
    `}>
      {isMapActive && (
        <div className="fixed inset-0 md:relative md:w-[45%] md:h-[460px] md:rounded-[2rem] overflow-hidden border-none md:border md:border-slate-100 md:dark:border-slate-800 shadow-none md:shadow-inner z-0 pointer-events-auto">
          <div ref={setMapNode} className="w-full h-full" />
          {mapError && (
            <div className="absolute top-[calc(env(safe-area-inset-top,16px)+190px)] md:top-auto md:bottom-2 left-4 right-4 md:left-2 md:right-2 bg-rose-50/95 dark:bg-rose-950/95 border border-rose-200 dark:border-rose-900/50 p-1.5 px-2.5 rounded-xl flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-bottom-1 z-10">
              <AlertTriangle size={12} className="text-[#FF6467] shrink-0" />
              <span className="text-[9px] text-rose-800 dark:text-rose-200 font-bold uppercase tracking-wider">{mapError}</span>
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
          className="md:hidden fixed top-[calc(env(safe-area-inset-top,16px)+16px)] left-4 z-50 bg-white/95 dark:bg-slate-900/95 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center active:scale-95 transition-all pointer-events-auto"
          title="Back"
        >
          <ArrowLeft size={18} className="text-slate-700 dark:text-slate-300 stroke-[3px]" />
        </button>
      )}

      <div 
        onTouchStart={isMapActive && !isSheetExpanded ? handleTouchStart : undefined}
        onTouchEnd={isMapActive && !isSheetExpanded ? handleTouchEnd : undefined}
        className={`
          transition-all duration-300 ease-in-out
          ${isMapActive 
            ? `fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none md:p-0 md:rounded-none md:shadow-none md:border-t-0 md:h-auto md:max-h-[480px] md:flex-1 md:pr-1 pointer-events-auto
               ${isSheetExpanded 
                 ? `shadow-[0_-15px_30px_rgba(0,0,0,0.15)] p-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] rounded-t-[2rem] ${isKeyboardVisible ? 'h-[85vh] max-h-[85vh]' : 'h-[62vh] max-h-[62vh]'}` 
                 : 'shadow-[0_-5px_15px_rgba(0,0,0,0.08)] p-3 pt-2 pb-[calc(env(safe-area-inset-bottom,16px)+8px)] rounded-t-2xl h-[72px] max-h-[72px] overflow-hidden cursor-pointer'
               }` 
            : 'w-full flex flex-col gap-3.5'
          }
        `}
        onClick={(e) => {
          if (isMapActive && !isSheetExpanded) {
            setIsSheetExpanded(true);
          }
        }}
      >
        {isMapActive && (
          <div 
            onTouchStart={isMapActive && isSheetExpanded ? handleTouchStart : undefined}
            onTouchEnd={isMapActive && isSheetExpanded ? handleTouchEnd : undefined}
            onClick={(e) => {
              e.stopPropagation();
              setIsSheetExpanded(!isSheetExpanded);
            }}
            className="w-full flex flex-col items-center py-0.5 cursor-pointer md:hidden group"
          >
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-slate-400 dark:group-hover:bg-slate-500 transition-colors" />
            <span className="text-[7px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-1">
              {isSheetExpanded ? 'Swipe Down / Click to View Map' : 'Swipe Up / Click to Book'}
            </span>
          </div>
        )}

        {isMobileScreen && step === 1 && !isMapActive && (
          <div className="flex flex-col text-left space-y-2 mb-3 select-none animate-fade-in px-1">
            {/* Display Headings */}
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Need a Ride? Book a Taxi Nearby
              </h1>
            </div>
          </div>
        )}

        {isMapActive && !isSheetExpanded ? (
          <div className="flex items-center justify-between mt-1 md:hidden animate-fade-in w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-[#FF6467]/10 text-[#FF6467] rounded-xl shrink-0">
                <Car size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Booking in Progress...
                </p>
                <p className="text-[8.5px] font-medium text-slate-500 uppercase tracking-wider truncate">
                  {formData.pickup ? `From: ${formData.pickup.split(',')[0]}` : 'Set locations'}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSheetExpanded(true);
              }}
              className="bg-[#FF6467] text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 hover:bg-[#FF7075] active:scale-95 transition-all"
            >
              <span>Book</span>
              <ChevronUp size={15} className="stroke-[4px]" />
            </button>
          </div>
        ) : (
          !(isMobileScreen && step === 1 && !isMapActive) && (
            <div className={`flex justify-between items-center mb-1 ${isMapActive && !isSheetExpanded ? 'hidden md:flex' : ''}`}>
              <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {step === 1 ? 'Enter Locations' : step === 2 ? 'Enter Mobile' : step === 3 ? 'Select Vehicle' : 'Trip Summary'}
              </h3>
              <div className="flex gap-1.5">
                <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 4 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
              </div>
            </div>
          )
        )}

        <form onSubmit={handleSubmit} className={`
          ${isMapActive ? 'flex-1 flex flex-col min-h-0 justify-between gap-2.5 md:space-y-3.5 md:block' : 'space-y-3.5'}
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 self-start mb-2 mt-2"
              >
                <ArrowLeft size={14} className="stroke-[3px]" />
                <span>Change Locations</span>
              </button>

              {/* Show Date, Time, Duration card here on mobile */}
              {isMobileScreen && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-2.5 px-3.5 flex items-center divide-x divide-slate-200/80 dark:divide-slate-800/80 shadow-sm gap-0.5 my-2 animate-fade-in text-left">
                  {/* Date Column */}
                  <div className="flex-1 flex items-center gap-1.5 min-w-0 pr-3">
                    <Calendar size={13} className="text-[#FF6467] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Date</span>
                      <input
                        type="date"
                        name="date"
                        min={indiaToday}
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white cursor-pointer min-w-0"
                      />
                    </div>
                  </div>

                  {/* Time Column */}
                  <div className={`flex-1 flex items-center gap-1.5 min-w-0 px-3 ${formData.tripType === TripType.ROUND_TRIP ? 'pr-3' : ''}`}>
                    <Clock size={13} className="text-[#FF6467] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Time</span>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white cursor-pointer min-w-0"
                      />
                    </div>
                  </div>

                  {/* Duration (Round Trip only) */}
                  {formData.tripType === TripType.ROUND_TRIP && (
                    <div className="flex-1 flex items-center gap-1.5 min-w-0 pl-3">
                      <Clock size={13} className="text-[#FF6467] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Duration</span>
                        <select
                          name="numberOfDays"
                          value={formData.numberOfDays}
                          onChange={handleChange}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer min-w-0"
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
              )}

              <div className="w-full bg-[#FF6467]/5 dark:bg-[#FF6467]/10 border-2 border-[#FF6467] focus-within:ring-4 focus-within:ring-[#FF6467]/20 rounded-xl p-2.5 px-3.5 flex items-center gap-3 transition-all shadow-md shadow-[#FF6467]/5 relative overflow-hidden text-left mt-2">
                <span className="text-xs font-black text-[#FF6467] select-none border-r border-[#FF6467]/20 pr-2">
                  +91
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] font-black text-[#FF6467] uppercase tracking-widest mb-0.5">Mobile Number</span>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onFocus={(e) => {
                      setIsKeyboardVisible(true);
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 250);
                    }}
                    onBlur={() => {
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
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-black outline-none text-slate-900 dark:text-white placeholder-[#FF6467]/40"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className={`${isMapActive ? 'pt-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 md:bg-transparent' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  const phone = formData.phone.trim();
                  const phoneRegex = /^[6-9]\d{9}$/;
                  if (!phoneRegex.test(phone)) {
                    alert("Please enter a valid 10-digit Indian mobile number.");
                    return;
                  }
                  setStep(3);
                }}
                className={`
                  w-full font-black py-4 uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95
                  ${isMobileScreen 
                    ? 'bg-brand-yellow hover:bg-[#FF6467] text-white shadow-lg shadow-brand-yellow/20 text-sm rounded-full' 
                    : 'bg-[#FF7075] hover:bg-[#FF6467] text-white shadow-lg shadow-[#FF7075]/20 text-[10px] rounded-2xl'}
                `}
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
          {isMobileScreen ? (
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
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'}
                    `}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl gap-1 relative overflow-hidden border border-slate-200/10 dark:border-slate-700/20">
              {[
                { id: 'local', label: 'Local' },
                { id: 'outstation', label: 'Outstation' },
                { id: 'rental', label: 'Rental' }
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
                        newTripType = TripType.ONE_WAY; // Default to One Way
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
                      relative flex-1 flex items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors duration-200 z-10
                      ${isActive 
                        ? 'text-slate-950' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryType"
                        className="absolute inset-0 bg-[#FF7075] rounded-xl shadow-md"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

  
          {/* Outstation Type Sub-selector (One Way vs Round Trip Toggle Switch) */}
          {(formData.tripType === TripType.ONE_WAY || formData.tripType === TripType.ROUND_TRIP) && (
            <div className="relative flex bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80 gap-1 select-none">
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
                        ? 'text-slate-800 dark:text-white font-black' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeOutstationSubtype"
                        className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/20 dark:border-slate-700/20"
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
          {isMobileScreen ? (
            <div className="space-y-3 animate-fade-in select-none">
              {/* Pickup Location Card on Mobile */}
              <div 
                onClick={() => setMobileSearchType('pickup')}
                className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer min-h-[48px]"
              >
                <MapPin className="text-brand-yellow shrink-0" size={18} />
                <div className="flex-1 min-w-0 text-left">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Pickup Location</span>
                  <div className={`text-xs font-bold line-clamp-2 break-words whitespace-normal text-left leading-snug ${formData.pickup ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
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
                      className="w-7 h-7 bg-slate-200/60 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center transition-all cursor-pointer"
                    >
                      <X size={12} className="stroke-[3px]" />
                    </button>
                  )}
                </div>
              </div>

              {formData.tripType !== TripTypeRental && (
                /* Destination Card on Mobile */
                <div 
                  onClick={() => setMobileSearchType('drop')}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer min-h-[48px]"
                >
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Destination</span>
                    <div className={`text-xs font-bold line-clamp-2 break-words whitespace-normal text-left leading-snug ${formData.drop ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
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
                      className="w-7 h-7 bg-slate-200/60 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center transition-all cursor-pointer"
                    >
                      <X size={12} className="stroke-[3px]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-3 flex gap-3 shadow-sm">
              {/* Visual native-app line connector */}
              <div className="flex flex-col items-center justify-center py-1.5">
                {/* Pickup Dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 flex-shrink-0" />
                
                {formData.tripType !== TripTypeRental && (
                  <>
                    {/* Connecting line */}
                    <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 my-1.5 min-h-[14px] border-l border-dashed border-slate-300 dark:border-slate-700" />
                    
                    {/* Drop Dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/10 flex-shrink-0" />
                  </>
                )}
              </div>

              {/* Input fields */}
              <div className="flex-1 space-y-2">
                {/* Pickup input */}
                <div className="relative">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Pickup Location</span>
                  <input
                    ref={pickupRef}
                    type="text"
                    readOnly={window.innerWidth < 640}
                    onClick={() => {
                      if (window.innerWidth < 640) setMobileSearchType('pickup');
                    }}
                    onFocus={() => {
                      if (window.innerWidth < 640) setMobileSearchType('pickup');
                    }}
                    required
                    placeholder="Enter Pickup Location"
                    value={formData.pickup}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickup: e.target.value }))}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none dark:text-white placeholder-slate-400 pr-16"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                    {locatingPickup && (
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {!locatingPickup && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDesktopUseGPS();
                        }}
                        className="w-6 h-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 active:scale-95 cursor-pointer animate-fade-in"
                        title="Use current GPS location (99% accuracy)"
                      >
                        <Locate size={12} className="stroke-[3px]" />
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
                        className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-[#FF6467] rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Clear pickup"
                      >
                        <X size={12} className="stroke-[3px]" />
                      </button>
                    )}
                  </div>
                  {gpsErrorPickup && (
                    <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase tracking-wide leading-tight animate-fade-in">
                      {gpsErrorPickup}
                    </p>
                  )}
                </div>

                {formData.tripType !== TripTypeRental && (
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 relative">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Destination</span>
                    <input
                      ref={dropRef}
                      type="text"
                      readOnly={window.innerWidth < 640}
                      onClick={() => {
                        if (window.innerWidth < 640) setMobileSearchType('drop');
                      }}
                      onFocus={() => {
                        if (window.innerWidth < 640) setMobileSearchType('drop');
                      }}
                      required={formData.tripType !== TripTypeRental}
                      placeholder="Enter Destination"
                      value={formData.drop}
                      onChange={(e) => setFormData(prev => ({ ...prev, drop: e.target.value }))}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none dark:text-white placeholder-slate-400 pr-8"
                    />
                    {formData.drop && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, drop: '' }));
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-[#FF6467] rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                        title="Clear destination"
                      >
                        <X size={12} className="stroke-[3px]" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Local Package Select */}
          {formData.tripType === TripTypeRental && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl p-2 px-3 flex items-center gap-3 shadow-sm">
              <Package size={14} className="text-[#FF6467]" />
              <div className="flex-1">
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Local Package</span>
                <select
                  name="localPackage"
                  value={formData.localPackage}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer"
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
          {!isMobileScreen && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-2.5 px-3.5 flex items-center divide-x divide-slate-200/80 dark:divide-slate-800/80 shadow-sm gap-0.5">
              {/* Date Column */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0 pr-3">
                <Calendar size={13} className="text-[#FF6467] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Date</span>
                  <input
                    type="date"
                    name="date"
                    min={indiaToday}
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white cursor-pointer min-w-0"
                  />
                </div>
              </div>

              {/* Time Column */}
              <div className={`flex-1 flex items-center gap-1.5 min-w-0 px-3 ${formData.tripType === TripType.ROUND_TRIP ? 'pr-3' : ''}`}>
                <Clock size={13} className="text-[#FF6467] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Time</span>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white cursor-pointer min-w-0"
                  />
                </div>
              </div>

              {/* Duration (Round Trip only) */}
              {formData.tripType === TripType.ROUND_TRIP && (
                <div className="flex-1 flex items-center gap-1.5 min-w-0 pl-3">
                  <Clock size={13} className="text-[#FF6467] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Duration</span>
                    <select
                      name="numberOfDays"
                      value={formData.numberOfDays}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer min-w-0"
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
          )}

            </div>

            {/* Sticky Footer */}
            <div className={`${isMapActive ? 'pt-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 md:bg-transparent' : ''}`}>
              <button 
                type="button" 
                id="btn-next-step"
                onClick={handleNextStep} 
                className={`
                  w-full font-black py-4 rounded-full uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95
                  ${isMobileScreen 
                    ? 'bg-brand-yellow hover:bg-[#FF6467] text-white shadow-lg shadow-brand-yellow/20 text-sm' 
                    : 'bg-[#FF7075] hover:bg-[#FF6467] text-white shadow-lg shadow-[#FF7075]/20 text-xs rounded-2xl'}
                `}
              >
                {isMobileScreen ? 'Get a Ride in Minutes' : <>Continue <ArrowRight size={18} /></>}
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
              className="flex items-center gap-1.5 text-[#FF6467] hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 -ml-1 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scroll to Select Vehicle</span>
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
                  className={`
                    w-full flex items-center gap-3 p-6 rounded-2xl border-2 transition-all text-left
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
                      className="w-30 h-14 object-contain rounded-lg shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-30 h-14 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                      <Car size={24} className="text-slate-400" />
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block truncate">
                      {v.label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 shrink-0">
                        <User size={10} /> {v.capacity} 
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold truncate">
                        • {v.description}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className={`${isMapActive ? 'pt-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 md:bg-transparent' : ''} flex gap-3`}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              disabled={loading}
              className="flex-1 bg-[#FF7075] hover:bg-[#FF6467] text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-[#FF7075]/20 uppercase tracking-widest text-xs active:scale-95 transition-all"
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
            <div className={`${isMapActive ? 'flex-1 overflow-y-auto pr-1 space-y-2.5 app-scroll pb-2' : 'space-y-4'}`}>
        <div className={`bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm transition-all
          ${isMapActive 
            ? 'rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-4' 
            : 'rounded-[2rem] p-5 space-y-4'
          }
        `}>
          <div className={isMapActive ? 'space-y-2' : 'space-y-3'}>
            <div className="flex gap-3">
              <div className={`flex flex-col items-center shrink-0
                ${isMapActive 
                  ? 'w-5 h-8 gap-0.5 py-0.5' 
                  : 'w-10 h-10 gap-1.5 py-1'
                }
              `}>
                <div className={`rounded-full border-2 border-[#FF6467]
                  ${isMapActive ? 'w-1.5 h-1.5' : 'w-2 h-2'}
                `} />
                <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
                <div className={`rounded-full bg-[#FF6467]
                  ${isMapActive ? 'w-1.5 h-1.5' : 'w-2 h-2'}
                `} />
              </div>
              <div className={`flex-1 pt-0.5 min-w-0
                ${isMapActive ? 'space-y-2' : 'space-y-4'}
              `}>
                <div>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Pickup</span>
                  <p className={`text-[10px] font-bold text-slate-900 dark:text-white leading-tight ${isMapActive ? 'line-clamp-2' : ''}`}>{formData.pickup}</p>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Destination</span>
                  <p className={`text-[10px] font-bold text-slate-900 dark:text-white leading-tight ${isMapActive ? 'line-clamp-2' : ''}`}>
                    {formData.tripType === TripTypeRental
                      ? LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label
                      : formData.drop}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-2 border-t border-slate-100 dark:border-slate-800
            ${isMapActive ? 'gap-2 pt-2' : 'gap-4 pt-2'}
          `}>
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Departure</span>
              <div className="flex items-center gap-1.5">
                <Calendar size={isMapActive ? 10 : 12} className="text-[#FF6467]" />
                <p className="text-[10px] font-bold text-slate-900 dark:text-white">{formData.date}</p>
              </div>
              <div className={`flex items-center gap-1.5 ${isMapActive ? 'mt-0.5' : 'mt-1'}`}>
                <Clock size={isMapActive ? 10 : 12} className="text-[#FF6467]" />
                <p className="text-[10px] font-bold text-slate-900 dark:text-white">{formData.time}</p>
              </div>
            </div>
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Vehicle</span>
              <div className="flex items-center gap-1.5">
                <Car size={isMapActive ? 10 : 12} className="text-[#FF6467]" />
                <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase truncate">{formData.vehicleType}</p>
              </div>
              <div className={`flex items-center gap-1.5 ${isMapActive ? 'mt-0.5' : 'mt-1'}`}>
                <Phone size={isMapActive ? 10 : 12} className="text-[#FF6467]" />
                <p className="text-[10px] font-bold text-slate-900 dark:text-white">{formData.phone}</p>
              </div>
            </div>
          </div>

          <div className={`border-t border-slate-100 dark:border-slate-800 flex justify-between items-end
            ${isMapActive ? 'pt-2.5' : 'pt-4'}
          `}>
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Estimated Distance</span>
              <span className="text-xs font-black text-[#FF6467]">{formData.distance}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Total Fare</span>
              <span className={`font-black text-slate-900 dark:text-white ${isMapActive ? 'text-xl' : 'text-2xl'}`}>{formData.estimatedFare}</span>
            </div>
          </div>

          <div className={`border-t border-slate-100 dark:border-slate-800 text-center
            ${isMapActive ? 'pt-1.5' : 'pt-2.5'}
          `}>
            <p className={`font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest
              ${isMapActive ? 'text-[6px]' : 'text-[9px]'}
            `}>
              * Tolls, state permit & parking extra
            </p>
          </div>
        </div>

            </div>
            {/* Sticky Footer */}
            <div className={`${isMapActive ? 'pt-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 md:bg-transparent' : ''} flex gap-3`}>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#FF7075] hover:bg-[#FF6467] text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-[#FF7075]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
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
            setIsSheetExpanded(true);
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
            setIsSheetExpanded(true);
          }}
        />
      )}
    </div>
  );
};

