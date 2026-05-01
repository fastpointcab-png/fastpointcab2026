
export enum VehicleType {
  MINI = 'Mini',
  SEDAN = 'Sedan',
  SUV = 'SUV',
  SUV_PLUS = 'SUV+',
  INNOVA = 'Innova',
  LUXURY = 'Luxury',
  TEMPO_TRAVELLER = 'Tempo Traveller',
  TOURIST_BUS = 'Tourist Bus',
  CUSTOM = 'Custom'
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  capacity: number;
  luggage: number;
  pricePerHour: number;
  image: string;
  features: string[];
  available: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface BookingDetails {
  email?: string;
  phone: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  vehicleType: VehicleType;
  distance?: string;
  estimatedFare?: string;
}

export interface BillRequestDetails {
  name: string;
  phone: string;
  date: string;
  pickup: string;
  drop: string;
  amount: string;
  vehicleNumber?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  comment: string;
  rating: number;
}


export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  image?: string; // ✅ Add this line
}
