import React from 'react';
import { ArrowRight, BriefcaseBusiness, Check, Luggage, MapPin, Phone, Snowflake, UsersRound } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { SEO_PAGE_CANDIDATES, SeoPageCandidate } from '../data/seoPageCandidates';
import { getSeoRelatedLinks } from '../data/seoInternalLinks';

const serviceDetails: Record<string, { overview: string; planning: string }> = {
  '/call-taxi-coimbatore': {
    overview: 'FastPointCab provides a clear online way to start a taxi request in Coimbatore. Enter the pickup and destination, then review the available booking choices before confirming.',
    planning: 'Keep the pickup landmark, destination, travel date, and phone number ready so the booking team can follow up accurately.',
  },
  '/cab-booking-coimbatore': {
    overview: 'The FastPointCab booking flow is designed for customers who want to submit a Coimbatore cab request online and review trip details before sending it.',
    planning: 'Use the booking form to select the trip type, add locations, provide a mobile number, and choose an available vehicle option shown in the flow.',
  },
  '/local-taxi-coimbatore': {
    overview: 'FastPointCab lists local taxi booking for Coimbatore city travel, with pickup and destination details collected through the existing booking interface.',
    planning: 'For a local ride, provide a precise pickup point and destination so the route and estimated fare can be prepared from the submitted trip details.',
  },
  '/airport-taxi-coimbatore': {
    overview: 'FastPointCab includes airport transfer requests in its Coimbatore taxi services. Customers can submit airport pickup or drop details through the booking form.',
    planning: 'Include the airport terminal or nearby landmark, pickup time, and flight-related timing in the trip details when making an airport request.',
  },
  '/outstation-taxi-coimbatore': {
    overview: 'FastPointCab supports outstation trip requests from Coimbatore through one-way and round-trip booking options in the existing trip flow.',
    planning: 'Add the complete origin and destination, select one-way or round-trip, and review the vehicle and trip details before confirmation.',
  },
  '/one-way-taxi-coimbatore': {
    overview: 'The one-way booking option helps customers submit a point-to-point taxi request from Coimbatore with a pickup, destination, date, and vehicle selection.',
    planning: 'Check that both locations are complete and use the estimated trip details shown by the booking form before submitting the request.',
  },
  '/round-trip-taxi-coimbatore': {
    overview: 'FastPointCab provides a round-trip option for customers planning travel from Coimbatore and a return journey, subject to confirmation through the booking process.',
    planning: 'Enter the route and required travel dates carefully, then review the selected vehicle and trip summary before confirming.',
  },
  '/hourly-taxi-rental-coimbatore': {
    overview: 'FastPointCab offers local rental packages in the booking flow, where customers can choose a duration and included kilometres before selecting a vehicle.',
    planning: 'Select the package that matches the planned use, then confirm the pickup details, passenger mobile number, and vehicle choice.',
  },
  '/24-hours-taxi-service-coimbatore': {
    overview: 'FastPointCab publishes support information for taxi requests in Coimbatore and provides a direct phone and WhatsApp contact for booking enquiries.',
    planning: 'For a time-sensitive request, call +91 94888 34020 or submit the online booking details so the trip can be reviewed.',
  },
  '/corporate-taxi-coimbatore': {
    overview: 'FastPointCab includes corporate travel among its Coimbatore services, with business travel enquiries handled through the normal booking and contact channels.',
    planning: 'Share the business pickup, destination, date, passenger contact, and any vehicle requirements when making the request.',
  },
  '/railway-station-taxi-coimbatore': {
    overview: 'Customers arriving in or leaving Coimbatore by train can use the FastPointCab booking flow to submit a pickup or drop request with the station and destination details.',
    planning: 'Mention the railway station entrance or a nearby landmark, along with the train timing and destination, when submitting the request.',
  },
  '/family-taxi-coimbatore': {
    overview: 'FastPointCab vehicle options include choices for family travel in Coimbatore. The booking flow lets customers review passenger and vehicle details before confirmation.',
    planning: 'Add the passenger count, luggage needs, pickup point, and destination so the appropriate available vehicle option can be reviewed.',
  },
  '/seven-seater-taxi-coimbatore': {
    overview: 'Customers looking for a larger taxi option can review the available SUV and Innova choices in the FastPointCab vehicle selection step.',
    planning: 'Enter the number of passengers and luggage information accurately, then review the vehicle category displayed for the trip.',
  },
  '/tempo-traveller-coimbatore': {
    overview: 'FastPointCab lists Traveller vehicles in its booking flow for customers planning group travel from Coimbatore, subject to trip confirmation.',
    planning: 'Provide the group size, luggage requirements, pickup, destination, and travel date before reviewing the Traveller option.',
  },
  '/taxi-near-me-coimbatore': {
    overview: 'FastPointCab gives customers in Coimbatore a direct way to begin a taxi request using pickup and destination search in the online booking form.',
    planning: 'Use the current location option or enter a clear pickup address, then add the destination and a reachable mobile number.',
  },
  '/city-to-city-taxi-coimbatore': {
    overview: 'The FastPointCab booking flow can be used to submit a point-to-point trip request from Coimbatore to another destination, with the route reviewed before confirmation.',
    planning: 'Use the one-way or round-trip option as appropriate and check the estimated trip summary before submitting.',
  },
  '/business-travel-taxi-coimbatore': {
    overview: 'FastPointCab includes corporate travel in its listed services for customers arranging business journeys in or from Coimbatore.',
    planning: 'Add accurate pickup, destination, date, time, passenger mobile, and vehicle details so the business travel request is clear.',
  },
  '/night-taxi-coimbatore': {
    overview: 'Customers planning a time-sensitive or late-hour journey can use the FastPointCab contact and booking channels to submit a Coimbatore taxi enquiry.',
    planning: 'Include the requested pickup time and exact location, then call +91 94888 34020 if the trip needs direct confirmation.',
  },
  '/wedding-car-rental-coimbatore': {
    overview: 'FastPointCab can receive enquiries for planned event travel through its existing vehicle and rental booking channels without publishing fixed prices or availability claims.',
    planning: 'Share the event date, pickup points, destinations, passenger needs, and preferred vehicle category when making an enquiry.',
  },
  '/group-taxi-coimbatore': {
    overview: 'FastPointCab provides larger vehicle categories in its booking flow for customers planning group travel from Coimbatore.',
    planning: 'State the group size and luggage requirements before reviewing Traveller, Innova, SUV, or bus options shown for the request.',
  },
  '/coimbatore-to-ooty-taxi': {
    overview: 'FastPointCab supports outstation taxi requests from Coimbatore to Ooty through the existing one-way and round-trip booking flow.',
    planning: 'Enter the Coimbatore pickup and Ooty destination, choose one-way or round-trip, and review the date, vehicle, and trip summary before confirmation.',
  },
  '/coimbatore-to-munnar-taxi': {
    overview: 'Customers planning a Coimbatore to Munnar journey can submit an outstation taxi request through FastPointCab with the route and travel details.',
    planning: 'Add the complete pickup and Munnar destination, select the appropriate trip type, and provide the travel date before reviewing vehicle options.',
  },
  '/coimbatore-to-kodaikanal-taxi': {
    overview: 'FastPointCab provides a booking path for outstation enquiries from Coimbatore to Kodaikanal, with trip details reviewed before submission.',
    planning: 'Use precise pickup and destination locations, choose one-way or round-trip, and check the displayed trip summary for the Kodaikanal request.',
  },
  '/coimbatore-to-pollachi-taxi': {
    overview: 'A Coimbatore to Pollachi taxi request can be started in the FastPointCab outstation booking flow using the existing route and vehicle selection steps.',
    planning: 'Enter the exact Coimbatore pickup and Pollachi destination, then add the date, passenger mobile number, and preferred trip type.',
  },
  '/coimbatore-to-valparai-taxi': {
    overview: 'FastPointCab accepts outstation booking enquiries for travel from Coimbatore towards Valparai through its normal trip request process.',
    planning: 'Provide complete pickup and Valparai destination details, select one-way or round-trip, and review the available vehicle choice before confirming.',
  },
  '/coimbatore-to-palakkad-taxi': {
    overview: 'Customers travelling from Coimbatore to Palakkad can submit an outstation taxi request with FastPointCab using the route details in the booking form.',
    planning: 'Enter a clear Coimbatore pickup landmark and Palakkad destination, then complete the date, mobile, and vehicle steps for review.',
  },
  '/coimbatore-to-kochi-taxi': {
    overview: 'FastPointCab provides an outstation request flow for customers planning travel from Coimbatore to Kochi, subject to confirmation through the normal process.',
    planning: 'Add the full origin and Kochi destination, select the requested trip type, and review the trip summary before sending the booking request.',
  },
  '/coimbatore-to-bangalore-taxi': {
    overview: 'A Coimbatore to Bangalore journey can be submitted as an outstation taxi enquiry through FastPointCab’s existing booking interface.',
    planning: 'Use complete pickup and Bangalore destination information, add the travel date and passenger contact, and review the selected vehicle.',
  },
  '/coimbatore-to-chennai-taxi': {
    overview: 'FastPointCab lets customers begin an outstation taxi request from Coimbatore to Chennai with location, date, and vehicle details collected in sequence.',
    planning: 'Enter a precise Coimbatore pickup and Chennai destination, then choose one-way or round-trip and verify the final trip summary.',
  },
  '/coimbatore-to-madurai-taxi': {
    overview: 'Customers can use FastPointCab to submit an outstation taxi request from Coimbatore to Madurai and review the journey details before confirmation.',
    planning: 'Include exact pickup and Madurai destination landmarks, the required travel date, passenger mobile number, and preferred trip type.',
  },
  '/coimbatore-to-salem-taxi': {
    overview: 'FastPointCab supports outstation trip enquiries from Coimbatore to Salem through the existing location and vehicle booking flow.',
    planning: 'Provide complete route details and select one-way or round-trip, then review the date, vehicle category, and trip summary.',
  },
  '/coimbatore-to-erode-taxi': {
    overview: 'A Coimbatore to Erode taxi request can be submitted through FastPointCab’s outstation booking steps with the route entered clearly.',
    planning: 'Add the exact Coimbatore pickup and Erode destination, then complete the mobile and travel-date fields before confirming the request.',
  },
  '/coimbatore-to-tiruppur-taxi': {
    overview: 'FastPointCab provides a route-based booking flow for customers enquiring about outstation travel from Coimbatore to Tiruppur.',
    planning: 'Enter the pickup landmark and Tiruppur destination, choose the trip type, and check the vehicle and estimated trip details before submission.',
  },
  '/coimbatore-to-mysore-taxi': {
    overview: 'Customers planning a Coimbatore to Mysore journey can submit an outstation taxi request through the FastPointCab booking interface.',
    planning: 'Use complete origin and Mysore destination details, add the travel date and phone number, and review the selected vehicle before confirmation.',
  },
  '/coimbatore-to-coonoor-taxi': {
    overview: 'FastPointCab includes an outstation request path for customers travelling from Coimbatore to Coonoor, with final details reviewed in the booking flow.',
    planning: 'Specify the Coimbatore pickup and Coonoor destination accurately, then select one-way or round-trip and review the trip summary.',
  },
  '/coimbatore-to-trichy-taxi': {
    overview: 'A Coimbatore to Trichy outstation taxi enquiry can be started in FastPointCab’s existing booking flow using the route and vehicle details.',
    planning: 'Enter complete pickup and Trichy destination information, provide the date and mobile number, and confirm the trip summary details.',
  },
  '/coimbatore-to-rameswaram-taxi': {
    overview: 'FastPointCab allows customers to submit an outstation travel request from Coimbatore to Rameswaram through the normal booking process.',
    planning: 'Add the full origin and Rameswaram destination, select the trip type, and review the travel date, vehicle, and summary before sending the request.',
  },
  '/coimbatore-to-thanjavur-taxi': {
    overview: 'Customers planning travel from Coimbatore to Thanjavur can use the FastPointCab outstation request flow to enter and review their trip details.',
    planning: 'Provide precise pickup and Thanjavur destination details, then complete the date, mobile, and vehicle selection steps.',
  },
  '/coimbatore-to-yercaud-taxi': {
    overview: 'FastPointCab provides an outstation booking path for customers enquiring about a Coimbatore to Yercaud taxi journey.',
    planning: 'Enter the exact pickup and Yercaud destination, choose one-way or round-trip, and review the vehicle and trip summary before confirmation.',
  },
  '/coimbatore-to-kumbakonam-taxi': {
    overview: 'A Coimbatore to Kumbakonam journey can be submitted as an outstation taxi enquiry through FastPointCab’s existing booking interface.',
    planning: 'Add complete route locations and travel timing, then provide a reachable mobile number and review the selected vehicle before submitting.',
  },
};

const finalServiceDetails: Record<string, { overview: string; planning: string }> = {
  '/coimbatore-to-dindigul-taxi': { overview: 'FastPointCab provides an existing outstation booking flow for customers travelling from Coimbatore to Dindigul.', planning: 'Enter the complete Coimbatore pickup and Dindigul destination, choose the trip type, and review the date, vehicle, and summary details.' },
  '/coimbatore-to-wayanad-taxi': { overview: 'Customers planning a Coimbatore to Wayanad journey can submit an outstation taxi request through FastPointCab with the route entered in the booking form.', planning: 'Add precise origin and Wayanad destination details, include the travel date, and review the hill-route trip information before confirmation.' },
  '/coimbatore-to-kozhikode-taxi': { overview: 'FastPointCab supports route enquiries from Coimbatore to Kozhikode through its normal one-way and round-trip outstation booking options.', planning: 'Provide clear pickup and Kozhikode destination details, then complete the mobile and vehicle selection steps before submitting the request.' },
  '/coimbatore-to-thrissur-taxi': { overview: 'A Coimbatore to Thrissur taxi request can be started through FastPointCab’s existing outstation trip flow and reviewed before confirmation.', planning: 'Enter the full route, select one-way or round-trip, and verify the travel date, passenger contact, and selected vehicle.' },
  '/coimbatore-to-tiruchengode-taxi': { overview: 'FastPointCab lets customers submit an outstation travel enquiry from Coimbatore to Tiruchengode using the existing location-based booking interface.', planning: 'Use exact pickup and destination locations, add the requested date and mobile number, and review the final trip details.' },
  '/mini-taxi-coimbatore': { overview: 'The FastPointCab fleet includes a Mini Hatchback option for compact Coimbatore city rides and booking requests.', planning: 'Select the MINI / ANY SEDAN option in the vehicle step after entering the pickup, destination, and passenger details.' },
  '/sedan-taxi-coimbatore': { overview: 'FastPointCab lists a Sedan Prime option for customers seeking a comfortable sedan for city, airport, rental, or outstation travel.', planning: 'Enter the trip locations first, then review the Sedan option and its available details before confirming the booking.' },
  '/suv-taxi-coimbatore': { overview: 'The FastPointCab booking flow includes SUV options for customers who need a larger cabin for Coimbatore travel and longer journeys.', planning: 'Add the passenger and luggage requirements through the booking details, then select the SUV category shown for the trip.' },
  '/innova-taxi-coimbatore': { overview: 'FastPointCab offers an Innova / Crysta category in its vehicle selection for family, airport, local, and outstation requests.', planning: 'Use accurate passenger and luggage details, then review the Innova option alongside the trip summary before confirmation.' },
  '/tempo-traveller-rental-coimbatore': { overview: 'FastPointCab lists a Force Urbania / Traveller category for group travel requests and planned rentals from Coimbatore.', planning: 'Share the group size, luggage needs, locations, and travel date before selecting the Traveller category in the booking flow.' },
  '/tourist-bus-rental-coimbatore': { overview: 'The FastPointCab vehicle selection includes a Tourist Luxury Coach category for larger group travel enquiries.', planning: 'Provide the group size, pickup, destination, date, and timing so the Tourist Bus option can be reviewed in the request.' },
  '/custom-vehicle-booking-coimbatore': { overview: 'FastPointCab includes a Custom vehicle option for customers whose travel requirements do not fit a standard listed category.', planning: 'Describe the passenger, luggage, route, and vehicle requirements in the booking request so the appropriate option can be reviewed.' },
  '/mini-bus-rental-coimbatore': { overview: 'FastPointCab’s larger vehicle choices include a coach-style option for group travel and planned rental enquiries in Coimbatore.', planning: 'Enter the group size and complete route details, then review the Tourist Bus category and confirmation information.' },
  '/force-urbania-rental-coimbatore': { overview: 'The FastPointCab fleet identifies its larger Traveller option as Force Urbania / Traveller for group journeys and rental enquiries.', planning: 'Provide the group count, luggage requirements, pickup, destination, and date before reviewing the Traveller selection.' },
  '/local-cab-rental-coimbatore': { overview: 'FastPointCab provides local rental packages for customers planning flexible city travel in Coimbatore through the existing booking flow.', planning: 'Choose the Rental trip type, select a package, enter the pickup details, and review the available vehicle before confirmation.' },
  '/full-day-cab-rental-coimbatore': { overview: 'Customers planning a full-day city itinerary can use FastPointCab’s local rental package flow to submit their travel requirements.', planning: 'Choose a package that matches the planned duration and kilometres, then complete the pickup, mobile, and vehicle steps.' },
  '/half-day-cab-rental-coimbatore': { overview: 'FastPointCab offers shorter local rental package choices in its booking interface for customers planning part-day Coimbatore travel.', planning: 'Review the available package duration and included kilometres, then provide pickup, passenger, and vehicle details.' },
  '/corporate-car-rental-coimbatore': { overview: 'FastPointCab lists Corporate Travel among its services for business journeys and planned vehicle enquiries in Coimbatore.', planning: 'Include the business pickup, destination, date, passenger contact, and required vehicle category in the booking request.' },
  '/airport-car-rental-coimbatore': { overview: 'FastPointCab’s Airport Transfers service can be used for airport vehicle enquiries involving pickup or drop details in Coimbatore.', planning: 'Enter the terminal, flight-related timing if available, destination, passenger contact, and vehicle preference before confirmation.' },
  '/one-way-cab-rental-coimbatore': { overview: 'FastPointCab supports one-way point-to-point requests from Coimbatore through its existing trip and vehicle selection flow.', planning: 'Select One Way, enter both locations, provide the travel date and mobile number, and review the vehicle and trip summary.' },
  '/round-trip-cab-rental-coimbatore': { overview: 'Customers planning a return journey can use FastPointCab’s Round Trip option to submit a Coimbatore rental or travel request.', planning: 'Choose Round Trip, enter the route and required dates, then review the vehicle selection and summary before confirmation.' },
  '/group-vehicle-rental-coimbatore': { overview: 'FastPointCab provides larger vehicle categories for group travel enquiries, including Traveller, SUV, Innova, and Tourist Bus options.', planning: 'State the number of passengers and luggage needs, then review the available vehicle category for the requested route.' },
  '/family-car-rental-coimbatore': { overview: 'Families can review FastPointCab Mini, Sedan, SUV, and Innova categories when submitting a local, airport, rental, or outstation request.', planning: 'Add passenger and luggage details with the pickup and destination so the vehicle choice can be reviewed before confirmation.' },
  '/hourly-cab-rental-coimbatore': { overview: 'FastPointCab’s Hourly Rental service includes selectable local packages for customers who need a cab for planned city travel.', planning: 'Choose Rental, select the required hours and kilometres package, then complete the pickup and vehicle selection steps.' },
};

const areaNotes: Record<string, string> = {
  '/taxi-town-hall': 'Town Hall is a useful landmark to include when describing a central Coimbatore pickup or destination. Add the exact street or building so the request can be reviewed accurately.',
  '/taxi-hope-college': 'For a Hope College pickup or drop, include the gate, nearby road, or building name rather than relying on the area name alone.',
  '/taxi-vilankurichi': 'A Vilankurichi taxi request should include the exact residential, commercial, or industrial landmark and the final destination.',
  '/taxi-thudiyalur': 'Customers planning a Thudiyalur trip can improve pickup accuracy by adding a landmark, address, and requested travel time in the booking form.',
  '/taxi-kovaipudur': 'For Kovaipudur travel, provide the neighbourhood landmark and destination details so the route can be checked before confirmation.',
  '/taxi-kuniyamuthur': 'A Kuniyamuthur request should identify the precise pickup road or landmark and include the destination selected in the booking flow.',
  '/taxi-sundarapuram': 'Customers using Sundarapuram as a pickup or destination should enter a complete address or landmark for a clear taxi request.',
  '/taxi-podanur': 'For a Podanur journey, add the exact pickup point and destination rather than only the neighbourhood name.',
  '/taxi-ondipudur': 'An Ondipudur trip request is easier to review when the customer includes a nearby landmark, travel date, and destination.',
  '/taxi-sulur': 'For Sulur travel planning, include the exact pickup or drop address and any timing details in the FastPointCab request.',
  '/taxi-veerakeralam': 'For a Veerakeralam pickup or drop, add the exact street, landmark, and destination so the Coimbatore trip request is clear.',
  '/taxi-koundampalayam': 'Customers travelling through Koundampalayam should include a complete pickup landmark or address and the final destination in the booking form.',
  '/taxi-selvapuram': 'A Selvapuram taxi request is easier to review when the customer supplies the precise road, landmark, pickup time, and destination.',
  '/taxi-perur': 'For Perur journeys, provide the temple, neighbourhood, or road landmark together with the destination rather than only the area name.',
  '/taxi-chinniyampalayam': 'Customers booking around Chinniyampalayam can add a nearby building or road landmark to help identify the pickup point accurately.',
  '/taxi-avaram-palayam': 'For Avarampalayam travel, enter the exact pickup address and destination so the requested city route can be checked before confirmation.',
  '/taxi-nanjundapuram': 'A Nanjundapuram request should include the local landmark or street and a complete destination in the normal FastPointCab booking flow.',
  '/taxi-sivanandha-colony': 'For Sivanandha Colony trips, include the exact pickup point, destination, date, and requested time when submitting the taxi enquiry.',
  '/taxi-puliakulam': 'Customers using Puliakulam as a pickup or drop can improve location accuracy by adding a nearby landmark and the complete destination.',
  '/taxi-sitra': 'For Sitra travel planning, specify the road or nearby landmark, pickup time, and destination so the request can be reviewed accurately.',
  '/taxi-saibaba-colony': 'For Saibaba Colony travel, add the exact street or nearby landmark and the final destination rather than only the neighbourhood name.',
  '/taxi-race-course': 'A Race Course taxi request is clearer when it includes the specific road, building, pickup timing, and complete destination.',
  '/taxi-vadavalli': 'Customers travelling around Vadavalli should include a precise landmark or address so the pickup and destination can be reviewed accurately.',
  '/taxi-marudamalai': 'For Marudamalai journeys, provide the exact temple, road, or nearby landmark together with the destination in the booking form.',
  '/taxi-sundakkamuthur': 'A Sundakkamuthur request should include the local street or landmark, requested travel time, and complete destination details.',
};

const airportNotes: Record<string, { overview: string; planning: string }> = {
  '/coimbatore-airport-to-gandhipuram-taxi': {
    overview: 'FastPointCab lets customers submit a Coimbatore International Airport pickup or drop request involving Gandhipuram through the existing taxi booking flow.',
    planning: 'Add the airport terminal, arrival or departure timing, Gandhipuram landmark, and final address so the route request is clear.',
  },
  '/coimbatore-airport-to-rs-puram-taxi': {
    overview: 'Customers travelling between Coimbatore International Airport and RS Puram can use FastPointCab to submit the pickup, destination, and travel timing details.',
    planning: 'Include the terminal or airport pickup point and the exact RS Puram street or landmark when entering the trip locations.',
  },
  '/coimbatore-airport-to-peelamedu-taxi': {
    overview: 'FastPointCab supports airport transfer enquiries between Coimbatore International Airport and Peelamedu through its normal location-based booking process.',
    planning: 'Specify the terminal, flight-related timing if relevant, and the precise Peelamedu destination before reviewing the trip summary.',
  },
  '/coimbatore-airport-to-singanallur-taxi': {
    overview: 'A Coimbatore Airport to Singanallur taxi request can be started in the FastPointCab booking interface with the airport and local destination entered clearly.',
    planning: 'Use the terminal or a nearby airport landmark for pickup and add the Singanallur road, building, or landmark as the destination.',
  },
  '/coimbatore-airport-to-saravanampatti-taxi': {
    overview: 'FastPointCab provides a way to submit airport transfer details for journeys between Coimbatore International Airport and Saravanampatti.',
    planning: 'Enter the airport terminal, requested pickup time, and complete Saravanampatti address so the transfer can be reviewed accurately.',
  },
  '/coimbatore-airport-to-ganapathy-taxi': {
    overview: 'Customers planning travel between Coimbatore International Airport and Ganapathy can submit their route through the FastPointCab taxi booking flow.',
    planning: 'Include the terminal or airport meeting point and a clear Ganapathy landmark or street in the two location fields.',
  },
  '/coimbatore-airport-to-saibaba-colony-taxi': {
    overview: 'FastPointCab accepts airport transfer requests involving Saibaba Colony using the same pickup, destination, date, and vehicle review steps.',
    planning: 'Provide the airport terminal and the exact Saibaba Colony destination, then review the available trip details before confirmation.',
  },
  '/coimbatore-airport-to-race-course-taxi': {
    overview: 'The FastPointCab booking flow can be used to request a transfer between Coimbatore International Airport and the Race Course area.',
    planning: 'Add the airport terminal or pickup landmark and the Race Course street, building, or destination details for a precise request.',
  },
  '/coimbatore-airport-to-ukkadam-taxi': {
    overview: 'Customers travelling between Coimbatore International Airport and Ukkadam can enter both locations in the FastPointCab airport transfer request.',
    planning: 'Mention the airport terminal and a specific Ukkadam landmark or address, along with the preferred travel date and time.',
  },
  '/coimbatore-airport-to-pollachi-taxi': {
    overview: 'FastPointCab provides an existing booking flow for customers enquiring about an airport transfer from Coimbatore International Airport towards Pollachi.',
    planning: 'Enter the airport terminal and complete Pollachi destination details, then choose the relevant trip type and review the summary before submitting.',
  },
  '/coimbatore-airport-to-mettupalayam-taxi': {
    overview: 'Customers travelling between Coimbatore International Airport and Mettupalayam can submit an airport transfer request through FastPointCab.',
    planning: 'Enter the terminal or airport meeting point and a precise Mettupalayam landmark, then add the requested date and time.',
  },
  '/coimbatore-airport-to-tiruppur-taxi': {
    overview: 'FastPointCab supports airport transfer enquiries between Coimbatore International Airport and Tiruppur through its standard trip request flow.',
    planning: 'Provide the terminal, pickup timing, and complete Tiruppur destination so the route can be reviewed before confirmation.',
  },
  '/coimbatore-airport-to-ooty-taxi': {
    overview: 'A Coimbatore International Airport to Ooty journey can be submitted as an outstation airport transfer enquiry through FastPointCab.',
    planning: 'Include the airport terminal, travel timing, and Ooty destination details, then review the appropriate trip type and vehicle.',
  },
  '/coimbatore-airport-to-palakkad-taxi': {
    overview: 'FastPointCab provides a route-based booking path for customers enquiring about travel between Coimbatore International Airport and Palakkad.',
    planning: 'Add the terminal and complete Palakkad destination, then provide the date, mobile number, and selected vehicle details.',
  },
  '/coimbatore-airport-drop-taxi-service': {
    overview: 'Customers needing a Coimbatore airport drop can use FastPointCab to submit the pickup, terminal, timing, and vehicle details in the booking flow.',
    planning: 'Enter the pickup address, choose the airport terminal as the destination, and review the requested time and trip summary before confirmation.',
  },
};

const areaName = (page: SeoPageCandidate) => page.label.replace(' Taxi Service', '');

const getPageCopy = (page: SeoPageCandidate) => {
  if (page.category === 'area') {
    const area = areaName(page);
    return {
      overview: `Customers planning a taxi pickup or drop involving ${area}, Coimbatore can use the FastPointCab booking flow to submit their locations and trip requirements. Final trip confirmation is handled through the normal booking process.`,
      planning: areaNotes[page.path] || `Use a clear landmark or exact address for ${area} and add the destination before reviewing the available trip and vehicle details.`,
    };
  }
  if (page.category === 'airport-route' && airportNotes[page.path]) {
    return airportNotes[page.path];
  }
  return finalServiceDetails[page.path] || serviceDetails[page.path] || {
    overview: `FastPointCab provides information about ${page.label.toLowerCase()} using the existing Coimbatore taxi booking flow and verified contact channels.`,
    planning: 'Enter accurate pickup and destination details, provide a reachable mobile number, and review the trip summary before confirming.',
  };
};

const getSectionCopy = (page: SeoPageCandidate, area: string) => {
  switch (page.category) {
    case 'area': return { heading: `Travel from ${area}`, description: `Use this page to prepare a pickup or drop involving ${area}, Coimbatore. Add an exact landmark, destination, and reachable mobile number so the request can be reviewed clearly.`, question: `What pickup details should I provide for ${area}?`, answer: `Include the area landmark or complete address, destination, requested date, and a phone number that can be reached for trip confirmation.` };
    case 'airport-route': return { heading: 'Plan this airport transfer', description: 'Airport requests are easier to review when the terminal, pickup or drop location, timing, and complete destination are included in the booking details.', question: 'What airport information should I include?', answer: 'Provide the terminal or airport pickup point, timing, destination, and passenger contact details before reviewing the trip summary.' };
    case 'outstation-route': return { heading: 'Prepare for this outstation journey', description: 'Enter the full route and travel date, then review the one-way or round-trip choice and vehicle option shown by the FastPointCab booking flow.', question: 'Can I request one-way or round-trip travel?', answer: 'The booking flow presents the available trip type options after the pickup and destination are entered. Review the selected route before confirmation.' };
    case 'vehicle-rental': return { heading: 'Choose a vehicle or rental option', description: 'Vehicle and rental requests depend on the route, passenger details, package choice, and category shown in the existing FastPointCab booking flow.', question: 'Which vehicle details should I review?', answer: 'Check the displayed category, passenger capacity, package or trip type, and final trip summary before submitting the request.' };
    default: return { heading: `How this FastPointCab service works`, description: `This ${page.label.toLowerCase()} page explains the relevant booking path without publishing fixed fares or unsupported availability claims. Enter accurate trip details and review the options shown.`, question: 'How do I use this FastPointCab service?', answer: 'Start the booking flow, add the route and mobile details, choose the available trip and vehicle options, and review the summary before confirmation.' };
  }
};

const tempoQuoteUrl = 'https://wa.me/919488834020?text=Hi%20FastPointCab%2C%20I%20would%20like%20a%20quote%20for%20Tempo%20Traveller%20rental.';

const TempoTravellerRentalPage: React.FC<{
  copy: { overview: string; planning: string };
  relatedLinks: ReturnType<typeof getSeoRelatedLinks>;
}> = ({ copy, relatedLinks }) => {
  const features = [
    { value: '12–18', label: 'Seater', icon: UsersRound },
    { value: 'AC', label: 'Comfort', icon: Snowflake },
    { value: 'Luggage', label: 'Space', icon: Luggage },
  ];
  const categories = [
    { label: 'Group Travel', icon: UsersRound },
    { label: 'Corporate Trips', icon: BriefcaseBusiness },
    { label: 'Tour & Holiday', icon: Snowflake },
    { label: 'Family Events', icon: UsersRound },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-white pb-10 text-[#0B1733] sm:pb-14 lg:pb-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pt-7 text-sm font-semibold text-slate-500 sm:pt-9">
          <Link to="/" className="transition-colors hover:text-[#FF5F68]">Home</Link>
          <span aria-hidden="true" className="text-slate-300">›</span>
          <Link to="/fleet" className="transition-colors hover:text-[#FF5F68]">Fleet</Link>
          <span aria-hidden="true" className="text-slate-300">›</span>
          <span className="text-[#FF5F68]">Tempo Traveller Rental</span>
        </nav>

        <main>
          <section className="grid items-center gap-8 pb-10 pt-10 md:grid-cols-[0.85fr_1.15fr] md:gap-10 md:pb-14 md:pt-14 lg:grid-cols-2 lg:gap-8 lg:pb-16 lg:pt-16">
            <div className="max-w-xl lg:order-2">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#FF5F68]">Premium Group Travel</p>
              <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
                Tempo Traveller <span className="text-[#FF5F68]">Rental</span>
              </h1>
              <p className="mt-6 max-w-md text-lg font-semibold leading-8 text-slate-600 sm:text-xl">
                Spacious and comfortable group travel for every journey.
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

            <div className="flex min-h-[230px] items-center justify-center md:min-h-[330px] lg:order-1 lg:min-h-[390px]">
              <img
                src="/images/tempo travaller.webp"
                alt="Tempo Traveller rental vehicle"
                width="900"
                height="500"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-auto max-h-[390px] w-full object-contain"
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr] lg:items-center lg:gap-10" aria-labelledby="tempo-rental-information">
            <div className="rounded-2xl border border-[#FFE1E4] bg-[#FFF8F8] p-6 sm:p-8">
              <h2 id="tempo-rental-information" className="text-2xl font-extrabold sm:text-3xl">Rental Information</h2>
              <p className="mt-4 text-3xl font-extrabold text-[#159447] sm:text-4xl">Contact for Pricing</p>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{copy.planning}</p>
              <div className="mt-5 space-y-3 border-t border-[#F5D7DA] pt-5 text-sm font-semibold text-slate-700">
                {['Group-friendly seating', 'Driver included', 'Clean & well-maintained'].map((item) => (
                  <p key={item} className="flex items-center gap-3"><Check size={18} className="shrink-0 rounded-full bg-[#FF5F68] p-0.5 text-white" aria-hidden="true" />{item}</p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-0">
              {categories.map(({ label, icon: Icon }, index) => (
                <div key={label} className={`flex flex-col items-center justify-center px-3 text-center ${index > 0 ? 'sm:border-l sm:border-slate-200' : ''}`}>
                  <Icon size={38} strokeWidth={1.8} className="text-[#FF5F68]" aria-hidden="true" />
                  <span className="mt-3 text-sm font-extrabold sm:text-base">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:mt-14 sm:p-7 md:flex-row md:items-center md:justify-between md:px-8 lg:mt-16" aria-labelledby="tempo-rental-cta">
            <div>
              <h2 id="tempo-rental-cta" className="text-2xl font-extrabold sm:text-3xl">Book Tempo Traveller Rental Today</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600 sm:text-base">Ideal for family trips, corporate travel, tours and special events.</p>
            </div>
            <div className="flex w-full justify-start md:w-auto md:justify-end">
              <a href={tempoQuoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-[#0B1733] px-8 text-sm font-extrabold uppercase tracking-wide text-[#0B1733] transition-colors hover:bg-slate-50">
                Get a Quote
              </a>
            </div>
          </section>

          <section className="border-t border-slate-200 py-10 md:py-14" aria-labelledby="tempo-related-pages">
            <h2 id="tempo-related-pages" className="text-2xl font-extrabold tracking-tight text-[#0B1733] md:text-3xl">Related FastPointCab pages</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedLinks.map((link) => <li key={link.path}><Link to={link.path} className="block rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-[#0B1733] transition-colors hover:border-[#FF5F68] hover:text-[#FF5F68]">{link.label}</Link></li>)}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export const SeoLandingPage: React.FC = () => {
  const { pathname } = useLocation();
  const page = SEO_PAGE_CANDIDATES.find((candidate) => candidate.path === pathname && candidate.status === 'published');

  if (!page) return <Navigate to="/" replace />;

  const copy = getPageCopy(page);
  const area = page.category === 'area' ? areaName(page) : 'Coimbatore';
  const sectionCopy = getSectionCopy(page, area);
  const relatedLinks = getSeoRelatedLinks(page);

  if (pathname === '/tempo-traveller-rental-coimbatore') {
    return <TempoTravellerRentalPage copy={copy} relatedLinks={relatedLinks} />;
  }

  return (
    <div className="min-h-screen bg-white pb-14 sm:pb-16 lg:pb-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="pt-6 text-xs font-semibold text-slate-500 md:pt-8">
          <Link to="/" className="transition-colors hover:text-[#FF5F68]">Home</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-[#0B1733]">{page.heading}</span>
        </nav>
        <header className="max-w-4xl pb-10 pt-10 md:pb-14 md:pt-16">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FF5F68]">
            {page.category === 'area' ? `${area} travel planning` : 'Coimbatore taxi booking'}
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-[-0.035em] text-[#0B1733] md:text-6xl">{page.heading}</h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600 md:text-lg">{copy.overview}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/" state={{ scrollToBook: true }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF5F68] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#F04F59]">
              Start a Booking <ArrowRight size={16} />
            </Link>
            <a href="tel:+919488834020" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0B1733] transition-colors hover:bg-slate-50">
              <Phone size={16} /> Call FastPointCab
            </a>
          </div>
        </header>

        <section className="border-y border-slate-200 py-10 md:py-14" aria-labelledby="booking-details">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF5F68]">Plan your trip</p>
              <h2 id="booking-details" className="text-2xl font-extrabold tracking-tight text-[#0B1733] md:text-3xl">Useful details for {area} taxi booking</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{copy.planning}</p>
            </div>
            <ul className="space-y-4 text-sm font-medium leading-6 text-slate-600">
              <li className="flex items-start gap-3"><Check className="mt-1 shrink-0 text-[#FF5F68]" size={16} />Enter pickup and destination details accurately.</li>
              <li className="flex items-start gap-3"><Check className="mt-1 shrink-0 text-[#FF5F68]" size={16} />Choose the trip type and vehicle options shown in the booking flow.</li>
              <li className="flex items-start gap-3"><Check className="mt-1 shrink-0 text-[#FF5F68]" size={16} />Use the trip summary and confirmation steps before submitting.</li>
            </ul>
          </div>
        </section>

        <section className="py-10 md:py-14" aria-labelledby="service-area">
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 shrink-0 text-[#FF5F68]" size={20} />
            <div>
              <h2 id="service-area" className="text-2xl font-extrabold tracking-tight text-[#0B1733] md:text-3xl">{sectionCopy.heading}</h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">{sectionCopy.description}</p>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">FastPointCab’s published services include local taxi requests, airport transfers, hourly rentals, outstation trips, and corporate travel. Availability for a particular route or pickup point is confirmed through the booking process.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 py-10 md:py-14" aria-labelledby="related-pages">
          <h2 id="related-pages" className="text-2xl font-extrabold tracking-tight text-[#0B1733] md:text-3xl">Related FastPointCab pages</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedLinks.map((link) => <li key={link.path}><Link to={link.path} className="block rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-[#0B1733] transition-colors hover:border-[#FF5F68] hover:text-[#FF5F68]">{link.label}</Link></li>)}
          </ul>
        </section>

        <section className="border-t border-slate-200 py-10 md:py-14" aria-labelledby="common-questions">
          <h2 id="common-questions" className="text-2xl font-extrabold tracking-tight text-[#0B1733] md:text-3xl">Questions about this taxi service</h2>
          <div className="mt-6 divide-y divide-slate-200">
            <details className="py-5"><summary className="cursor-pointer font-bold text-[#0B1733]">{sectionCopy.question}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{sectionCopy.answer}</p></details>
            <details className="py-5"><summary className="cursor-pointer font-bold text-[#0B1733]">Can I confirm availability before booking?</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Yes. Submit accurate trip details or contact FastPointCab at +91 94888 34020 so the request can be reviewed before confirmation.</p></details>
          </div>
        </section>
      </div>
    </div>
  );
};
