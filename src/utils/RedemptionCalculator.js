// src/utils/RedemptionCalculator.js

/**
 * RedemptionCalculator.js
 *
 * This module orchestrates the calculation of all possible redemption options
 * for a given trip and user's loyalty programs. It combines direct redemption
 * logic with transfer partner options and identifies known sweet spots.
 */

// Import utility functions and data
import {
  calculateValuePerPoint as calculateBaseValuePerPointUtil,
  formatValueWithRating,
  formatCurrency,
  formatPoints,
  formatDate,
  formatCPP,
  formatCentsPerPoint,
  BASE_VALUE_PER_POINT, // Base value data might still be useful for base estimates
  PROGRAM_VALUE_MULTIPLIERS // Program average value multipliers
} from './redemptionValueUtils'; // Import formatting utilities and base data heuristics

import TransferPartnersService from './TransferPartnersService'; // Import TransferPartnersService for transfer and sweet spot data

// --- Mock/Example Award Data ---
// In a real application, this data would come from a database or specific
// award chart APIs, and would be far more extensive and dynamic.
// This static data is sufficient to demonstrate the calculation logic.

// Simplified Award Chart Data (Points per passenger, one-way)
const MOCK_AWARD_CHARTS = {
'Virgin Atlantic Flying Club': {
  'LHR-HND': { economy: 30000, premium: 55000, business: 45000, first: 60000 }, // ANA partner rates (one-way)
  'HND-LHR': { economy: 30000, premium: 55000, business: 45000, first: 60000 },
  'JFK-LHR': { economy: 15000, premium: 27500, business: 47500, first: 85000 }, // VS own metal (example)
  'LHR-JFK': { economy: 20000, premium: 35000, business: 57500, first: 95000 }, // VS own metal (example, higher fees ex-LHR)
  'JFK-HND': { economy: null, premium: null, business: 45000, first: 60000 }, // ANA partner (West US rate)
  'HND-JFK': { economy: null, premium: null, business: 45000, first: 60000 }, // ANA partner
   'ORD-HND': { economy: null, premium: null, business: 47500, first: 62500 }, // ANA partner (East US rate)
   'HND-ORD': { economy: null, premium: null, business: 47500, first: 62500 },
   'LAX-HND': { economy: null, premium: null, business: 45000, first: 60000 }, // ANA partner (West US rate)
   'HND-LAX': { economy: null, premium: null, business: 45000, first: 60000 },
   'SFO-NRT': { economy: null, premium: null, business: 45000, first: 60000 }, // ANA partner (West US rate)
   'NRT-SFO': { economy: null, premium: null, business: 45000, first: 60000 },
   // Add more routes/partners for VS
},
'American Airlines AAdvantage': {
  'JFK-LHR': { economy: 30000, premium: 50000, business: 57500, first: 85000 }, // Partner BA (example)
  'LHR-JFK': { economy: 30000, premium: 50000, business: 57500, first: 85000 },
   'DFW-HND': { economy: 35000, premium: null, business: 60000, first: 80000}, // Partner JAL
   'HND-DFW': { economy: 35000, premium: null, business: 60000, first: 80000},
   'LAX-HKG': { economy: 35000, premium: null, business: 70000, first: 110000}, // Partner CX
   'HKG-LAX': { economy: 35000, premium: null, business: 70000, first: 110000},
  // Add more routes/partners for AA
},
'United MileagePlus': {
  'JFK-FRA': { economy: 30000, premium: 55000, business: 70000, first: 110000 } // Partner LH (example)
  // Add more routes/partners for UA
},
'Delta SkyMiles': {
  'JFK-CDG': { economy: 30000, premium: 55000, business: 85000, first: null } // Partner AF (example)
  // Add more routes/partners for DL
},
 'Alaska Airlines Mileage Plan': {
      'LAX-HKG': { economy: 30000, premium: null, business: 50000, first: 70000}, // Partner CX (one-way)
      'HKG-LAX': { economy: 30000, premium: null, business: 50000, first: 70000},
      'SFO-HKG': { economy: 30000, premium: null, business: 50000, first: 70000}, // Partner CX (one-way)
      'HKG-SFO': { economy: 30000, premium: null, business: 50000, first: 70000},
      'JFK-HKG': { economy: 30000, premium: null, business: 50000, first: 70000}, // Partner CX (one-way)
      'HKG-JFK': { economy: 30000, premium: null, business: 50000, first: 70000},
      'ORD-HKG': { economy: 30000, premium: null, business: 50000, first: 70000}, // Partner CX (one-way)
      'HKG-ORD': { economy: 30000, premium: null, business: 50000, first: 70000},
      // Add more routes/partners for AS (JAL, Qantas etc)
  },
 'World of Hyatt': {
      'Category 1': 5000, 'Category 2': 8000, 'Category 3': 12000, 'Category 4': 15000, // Standard points per night
      'Category 5': 20000, 'Category 6': 25000, 'Category 7': 30000, 'Category 8': 40000
      // Add peak/off-peak if needed
 },
 'Marriott Bonvoy': {
      // Marriott uses dynamic pricing, so fixed award charts are hard.
      // Use heuristic based on average CPP or category estimates.
      'Average': 80000 // Placeholder: Avg points for a decent aspirational stay
 }
// Add more airline/hotel programs and their award data
};

// Simplified Taxes and Fees (per passenger, per direction)
// These vary significantly based on airline, route, cabin, and fuel surcharges.
const MOCK_TAXES_FEES = {
'Virgin Atlantic Flying Club': {
  'LHR-HND': { economy: 200, premium: 250, business: 300, first: 350 }, // ANA partner (lower fees)
  'HND-LHR': { economy: 200, premium: 250, business: 300, first: 350 },
  'JFK-LHR': { economy: 150, premium: 200, business: 250, first: 300 }, // VS own metal (higher fees possible)
  'LHR-JFK': { economy: 350, premium: 450, business: 550, first: 650 }, // VS own metal (high UK departure tax)
   'JFK-HND': { economy: 50, premium: 50, business: 50, first: 50 }, // ANA partner US->JP (low fees)
   'HND-JFK': { economy: 50, premium: 50, business: 50, first: 50 }, // ANA partner JP->US (low fees)
   // Add more routes/partners for VS
},
'American Airlines AAdvantage': { // Generally low fees on partners, except ex-UK/EU
  'JFK-LHR': { economy: 100, premium: 150, business: 200, first: 250 }, // Partner BA (much lower than booking with BA Avios)
  'LHR-JFK': { economy: 300, premium: 400, business: 500, first: 600 }, // Partner BA (UK taxes still apply)
    'LAX-HKG': { economy: 50, premium: 50, business: 50, first: 50}, // Partner CX (low fees)
    'HKG-LAX': { economy: 50, premium: 50, business: 50, first: 50},
  // Add more routes/partners for AA
},
'United MileagePlus': { // Generally low fees on partners, except LH First
  'JFK-FRA': { economy: 50, premium: 100, business: 150, first: 800 } // Partner LH First has high fees
  // Add more routes/partners for UA
},
 'Alaska Airlines Mileage Plan': { // Generally low fees on partners
     'LAX-HKG': { economy: 50, premium: 50, business: 50, first: 50}, // Partner CX
     'HKG-LAX': { economy: 50, premium: 50, business: 50, first: 50},
     // Add more routes/partners for AS
 },
 'World of Hyatt': 0, // Generally $0 fees on points stays
 'Marriott Bonvoy': 0 // Generally $0 fees on points stays (resort fees might still apply)
};

// Simplified Retail Values (per passenger, round trip total for flight estimates)
// These are very rough estimates. Real prices vary dynamically.
const MOCK_RETAIL_VALUES = {
'LHR-HND': {
  economy: 1500,
  premium: 3000,
  business: 6200,
  first: 12000
},
'JFK-LHR': {
  economy: 800,
  premium: 1500,
  business: 3500,
  first: 7000
},
'LHR-JFK': {
  economy: 800,
  premium: 1500,
  business: 3500,
  first: 7000
},
'JFK-CDG': {
  economy: 700,
  premium: 1400,
  business: 3000,
  first: null
},
'JFK-HND': {
   economy: 1000,
   premium: 2500,
   business: 5000,
   first: 10000
},
 'LAX-HKG': {
    economy: 1200,
    premium: 2800,
    business: 6000,
    first: 10000
 },
  'ORD-HND': {
      economy: 1100,
      premium: 2600,
      business: 5500,
      first: 11000
  },
   'Category 1': 100, // Per night
   'Category 2': 150,
   'Category 3': 200,
   'Category 4': 250,
   'Category 5': 350,
   'Category 6': 500,
   'Category 7': 700,
   'Category 8': 1000,
   'Marriott Average': 400 // Per night

// Add more routes/categories...
};


// --- Helper Functions ---

/**
* Gets the points and fees from mock data based on program, route, and cabin/category.
* Adjusts for one-way/round-trip and passengers.
* @param {string} programName - The name of the program used for booking.
* @param {Object} tripDetails - The original trip details.
* @returns {{points: number | null, fees: number | null}}
*/
function getMockAwardData(programName, tripDetails) {
  const { origin, destination, departDate, returnDate, cabin, passengers, searchType } = tripDetails;
  const isRoundTrip = returnDate && new Date(returnDate).getTime() > new Date(departDate).getTime();

  let pointsPerPassengerPerSegment = null;
  let feesPerPassengerPerSegment = 0;

  // Handle Hotel Redemptions (Simplified)
  if (searchType === 'hotel') {
      // For hotels, look up points/fees by category or average
      const categoryOrAvg = 'Average'; // Simplified: Assume 'Average' category
      pointsPerPassengerPerSegment = MOCK_AWARD_CHARTS[programName]?.[categoryOrAvg] || null;
      feesPerPassengerPerSegment = MOCK_TAXES_FEES[programName] || 0; // Assume flat fee for hotel program, usually zero
      let numNights = (new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24);
       if (numNights <= 0) numNights = 1; // Assume at least 1 night if dates are same

      let totalPoints = pointsPerPassengerPerSegment !== null ? pointsPerPassengerPerSegment * passengers * numNights : null;
      const totalFees = feesPerPassengerPerSegment * passengers * numNights; // Apply fee per night/person
       // Apply potential '5th night free' logic for some programs (simplified)
       if (programName === 'Marriott Bonvoy' || programName === 'Hilton Honors' || programName === 'IHG One Rewards') {
           const freeNights = Math.floor(numNights / 5);
           const payableNights = numNights - freeNights;
           if (totalPoints !== null) {
               totalPoints = (pointsPerPassengerPerSegment * passengers * payableNights) + (pointsPerPassengerPerSegment * passengers * (numNights - payableNights)); // Points for all nights, but special rules apply
                // A real implementation would adjust points calculation based on stay length for these programs
                // For simplicity here, let's just use the nightly rate * nights for now
                // Revisit: A simple flat multiplier for the total points might be better for mocking.
                // Let's use a heuristic based on average CPP * total cash value for hotels in the main estimation function.
           }
       }

      return {
           points: totalPoints,
           fees: totalFees
      };

  }


  // Handle Airline Redemptions
  const routeKey = `${origin}-${destination}`;
  const returnRouteKey = `${destination}-${origin}`;
  const cabinKey = cabin?.toLowerCase();

  // Try to find one-way points and fees for the outbound leg
  pointsPerPassengerPerSegment = MOCK_AWARD_CHARTS[programName]?.[routeKey]?.[cabinKey] || null;
  feesPerPassengerPerSegment = MOCK_TAXES_FEES[programName]?.[routeKey]?.[cabinKey] || 0;

  // If one-way data not available for the direct route, check return route (might be reciprocal)
  if (pointsPerPassengerPerSegment === null) {
       pointsPerPassengerPerSegment = MOCK_AWARD_CHARTS[programName]?.[returnRouteKey]?.[cabinKey] || null;
       feesPerPassengerPerSegment = MOCK_TAXES_FEES[programName]?.[returnRouteKey]?.[cabinKey] || 0;
  }

   // If data is still not found for the specific route/cabin, fall back to estimation heuristic
   if (pointsPerPassengerPerSegment === null) {
        const estimatedCashValue = getMockRetailValue(tripDetails);
        const estimatedPointsPerPassengerTotal = estimateProgramPointsRequiredHeuristic(programName, tripDetails, estimatedCashValue);
        const estimatedFeesPerPassengerTotal = estimateProgramFeesHeuristic(programName, tripDetails);
        const fallbackTotalPoints = estimatedPointsPerPassengerTotal * passengers;
        const fallbackTotalFees = estimatedFeesPerPassengerTotal * passengers;
        return {
           points: fallbackTotalPoints, // Return heuristic points
           fees: fallbackTotalFees
        };
   }

  // Ensure pointsPerPassengerPerSegment is a number before calculation
  const segmentPoints = typeof pointsPerPassengerPerSegment === 'number' ? pointsPerPassengerPerSegment : 0;

  // Calculate total points based on one-way or round-trip
  const oneWayPoints = segmentPoints * passengers;
  const roundTripPoints = oneWayPoints * 2;
  const totalPoints = isRoundTrip ? roundTripPoints : oneWayPoints;

  // Fees calculation (adjusting slightly for clarity)
  let totalFees = (typeof feesPerPassengerPerSegment === 'number' ? feesPerPassengerPerSegment : 0) * passengers;
  if (isRoundTrip) {
      const returnFeesKey = MOCK_TAXES_FEES[programName]?.[returnRouteKey]?.[cabinKey];
      const returnFeesPerSegment = typeof returnFeesKey === 'number' ? returnFeesKey : 0;
      totalFees += returnFeesPerSegment * passengers;
  }
  // Fee fallback logic remains the same...
  if (totalFees === 0) {
       totalFees = estimateProgramFeesHeuristic(programName, tripDetails) * passengers * (isRoundTrip ? 2 : 1); // Simplified distribution
       if (totalFees === 0 && getMockRetailValue(tripDetails) > 0) {
           totalFees = (isRoundTrip ? 50 : 25) * passengers;
       }
       totalFees = Math.round(totalFees);
   }

  return {
    points: totalPoints,
    fees: totalFees
  };
}

/**
* Gets the retail value from mock data based on trip details.
* Handles flights (by route+cabin+trip type) and hotels (by category+nights).
* @param {Object} tripDetails - The original trip details.
* @returns {number | null} Estimated retail value in USD.
*/
export function getMockRetailValue(tripDetails) {
  const { origin, destination, departDate, returnDate, cabin, passengers, searchType } = tripDetails;

   // Handle Hotel Retail Value (Simplified)
   if (searchType === 'hotel') {
       const numNights = (new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24);
       if (numNights <= 0) return 0; // Cannot calculate for zero or negative nights

       // Use a heuristic or category if available
       const categoryOrAvg = 'Marriott Average'; // Simplified: Assume 'Marriott Average' category retail value
       const valuePerNight = MOCK_RETAIL_VALUES[categoryOrAvg] || 400; // Default to $400/night if not found

       return valuePerNight * passengers * numNights;
   }


  // Handle Airline Retail Value
  const routeKey = `${origin}-${destination}`;
  const reverseRouteKey = `${destination}-${origin}`;
  const cabinKey = cabin?.toLowerCase();
  const isRoundTrip = returnDate && new Date(returnDate) > new Date(departDate);

  // Try specific route first, then reverse route, then fallback heuristic
  let value = MOCK_RETAIL_VALUES[routeKey]?.[cabinKey] || MOCK_RETAIL_VALUES[reverseRouteKey]?.[cabinKey] || null;

  // If not found in mock data, use a heuristic estimation
  if (value === null) {
      console.warn(`Mock retail value not found for ${routeKey} ${cabinKey}. Using estimation heuristic.`);
      // Simple heuristic based on average CPP goal and points heuristic if we had it
      // Or a simplified distance-based estimate similar to the old redemptionValueUtils estimate
      // Let's use a distance-based heuristic similar to the old code for fallback.
      const distance = estimateDistanceHeuristic(origin, destination);
      let category;
       if (distance < 1000) category = 'short';
       else if (distance < 3000) category = 'medium';
       else if (distance < 6000) category = 'long';
       else category = 'ultraLong';

       const basePriceRanges = {
           economy: { short: 200, medium: 500, long: 1000, ultraLong: 1500 },
           premium: { short: 400, medium: 900, long: 1800, ultraLong: 2800 },
           business: { short: 800, medium: 2500, long: 4500, ultraLong: 7000 },
           first: { short: 1500, medium: 4500, long: 8000, ultraLong: 12000 }
       };
      value = (basePriceRanges[cabinKey] || basePriceRanges.economy)[category];

       // Add seasonal multiplier (simplified) - assuming peak times
       const seasonalMultiplier = 1.2; // Assume high season or demand
       value *= seasonalMultiplier;
  }


  // Adjust for round trip if the base value was for one-way (our mock data is RT, but heuristic might be OW)
   // Assume MOCK_RETAIL_VALUES are for RT unless otherwise noted.
   // If using heuristic (which is typically OW estimate), multiply for RT.
  const tripMultiplier = isRoundTrip ? 1.8 : 1; // Not quite doubling price for round-trip
  value *= tripMultiplier;


  // Multiply by passenger count
  value *= passengers;


  return Math.round(value);
}


/**
* Heuristic to estimate points required if not found in mock charts.
* Uses general CPP targets and multipliers.
* @param {string} programName - The program name.
* @param {Object} tripDetails - Trip details.
* @param {number} estimatedCashValue - Total estimated cash value.
* @returns {number} Estimated points required (total for the trip).
*/
function estimateProgramPointsRequiredHeuristic(programName, tripDetails, estimatedCashValue) {
  if (!estimatedCashValue || estimatedCashValue <= 0) return 0;

  // Determine program type (simplified heuristic)
  const programType = (name) => {
       if (name.includes('Airlines') || name.includes('Airways') || name.includes('Flying') || name.includes('Miles') || name.includes('Sky') || name.includes('Aeroplan')) return 'airline';
       if (name.includes('Hyatt') || name.includes('Marriott') || name.includes('Hilton') || name.includes('IHG')) return 'hotel';
       return 'card'; // Flexible points
  };
  const type = programType(programName);

  // Get base value per point in cents based on program type
  let baseValueCpp;
   if (type === 'airline') baseValueCpp = BASE_VALUE_PER_POINT.airline[tripDetails.cabin?.toLowerCase()] || BASE_VALUE_PER_POINT.airline.economy;
   else if (type === 'hotel') baseValueCpp = BASE_VALUE_PER_POINT.hotel.standard; // Simplified for hotels
   else baseValueCpp = BASE_VALUE_PER_POINT.card;

  // Apply program-specific average value multiplier
  const programMultiplier = PROGRAM_VALUE_MULTIPLIERS[programName] || 1.0;
  const adjustedBaseValueCpp = (baseValueCpp || 1.0) * programMultiplier;

  // Calculate required points: (Estimated Cash Value in Cents) / (Adjusted Value per point in Cents)
  const pointsRequired = Math.round((estimatedCashValue * 100) / (adjustedBaseValueCpp || 1.0));

   // Ensure minimum points if there's cash value
   const minPoints = (estimatedCashValue > 0) ? Math.round((estimatedCashValue * 100) / 0.5) : 0; // At least 0.5 cpp value
   return Math.max(pointsRequired, minPoints);
}

/**
* Heuristic to estimate fees if not found in mock data.
* @param {string} programName - Program name.
* @param {Object} tripDetails - Trip details.
* @returns {number} Estimated fees (total for the trip).
*/
function estimateProgramFeesHeuristic(programName, tripDetails) {
  // Simplified heuristic based on program type and route length
  const isRoundTrip = tripDetails.returnDate && new Date(tripDetails.returnDate) > new Date(tripDetails.departDate);
  const numSegments = isRoundTrip ? 2 : 1;

  let baseFee = 20; // Base minimal fee per segment/passenger
  const distance = estimateDistanceHeuristic(tripDetails.origin, tripDetails.destination);

  if (distance > 3000) baseFee = 40; // Longer haul might have higher base
  if (distance > 6000) baseFee = 60; // Ultra long haul

  let programMultiplier = 1.0;
   // Programs known for higher fees
   if (programName === 'British Airways Executive Club') programMultiplier = 4.0; // BA notorious for high fees
   if (programName === 'Virgin Atlantic Flying Club') programMultiplier = 3.0; // VS can have high fees on own metal

   // UK departure tax is significant
   if (tripDetails.origin?.includes('LHR') || tripDetails.destination?.includes('LHR')) {
       baseFee += 150; // Add a significant amount for London
   }


  const totalFees = baseFee * programMultiplier * tripDetails.passengers * numSegments;

   // Clamp fees to a reasonable range based on cash value (avoid fees > cash value)
   const estimatedCashValue = getMockRetailValue(tripDetails);
   const maxFees = estimatedCashValue * 0.5; // Fees shouldn't exceed 50% of cash value? (Heuristic)
   return Math.round(Math.min(totalFees, maxFees > 0 ? maxFees : totalFees)); // Ensure maxFees is positive
}

/**
* Simple heuristic to estimate distance between two locations.
* Uses rough categories or a predefined lookup.
* @param {string} origin - Origin airport code (IATA).
* @param {string} destination - Destination airport code (IATA).
* @returns {number} Estimated distance in miles.
*/
function estimateDistanceHeuristic(origin, destination) {
  // Use a lookup for common routes first
  const routeKey = `${origin}-${destination}`;
  const reverseRouteKey = `${destination}-${origin}`;
  const commonDistances = {
    "JFK-LHR": 3451,
    "LHR-JFK": 3451,
    "LAX-NRT": 5451,
    "NRT-LAX": 5451,
    "SFO-HKG": 6927,
    "HKG-SFO": 6927,
    "ORD-FRA": 4340,
    "FRA-ORD": 4340,
    "LHR-HND": 5962, // London to Tokyo
    "HND-LHR": 5962,
    "JFK-HND": 6745, // US East to Tokyo
    "HND-JFK": 6745,
     "LAX-HND": 5500, // US West to Tokyo
     "HND-LAX": 5500
    // Add more specific routes from mock data or known routes
  };

  if (commonDistances[routeKey]) return commonDistances[routeKey];
  if (commonDistances[reverseRouteKey]) return commonDistances[reverseRouteKey];

  // Fallback: A very rough distance estimate based on region/continent (less reliable)
  const getRegion = (code) => {
      // Simplified regions based on common airport locations
      if (['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'ATL', 'DFW', 'YYZ', 'YVR', 'YUL'].includes(code)) return 'NA';
      if (['LHR', 'LGW', 'CDG', 'ORY', 'AMS', 'FRA', 'MUC', 'ZRH', 'VIE', 'CPH', 'ARN', 'MAD', 'BCN', 'FCO', 'IST'].includes(code)) return 'EU';
      if (['HND', 'NRT', 'KIX', 'SIN', 'HKG', 'BKK', 'ICN', 'PEK', 'PKX'].includes(code)) return 'Asia';
      if (['DXB'].includes(code)) return 'ME'; // Middle East
      if (['SYD', 'MEL'].includes(code)) return 'OC'; // Oceania
      if (['JNB'].includes(code)) return 'AF'; // Africa
      return 'Other'; // Unknown
  };

  const originRegion = getRegion(origin);
  const destinationRegion = getRegion(destination);

  if (originRegion === destinationRegion) {
       if (originRegion === 'NA' || originRegion === 'EU' || originRegion === 'Asia') return 1500; // Inter-city within large regions
       return 500; // Short haul default
  }
  if ((originRegion === 'NA' && destinationRegion === 'EU') || (originRegion === 'EU' && destinationRegion === 'NA')) return 4500; // Transatlantic
  if ((originRegion === 'NA' && destinationRegion === 'Asia') || (originRegion === 'Asia' && destinationRegion === 'NA')) return 6500; // Transpacific
  if ((originRegion === 'EU' && destinationRegion === 'Asia') || (originRegion === 'Asia' && destinationRegion === 'EU')) return 5500; // Europe-Asia
   if ((originRegion === 'NA' && destinationRegion === 'OC') || (originRegion === 'OC' && destinationRegion === 'NA')) return 7500; // North America-Oceania

  return 3000; // Default medium haul international
}


/**
* Get all available redemption options for a trip based on user's programs.
* Includes direct bookings and potential transfer partner redemptions.
* Orchestrates data retrieval and calculation.
* @param {Object} tripDetails - Details about the trip (origin, destination, dates, cabin, passengers, searchType).
* @param {Array<Object>} userPrograms - User's available loyalty programs with balances.
* @returns {{best: Object | null, alternatives: Array<Object>}}
*/
function getAllRedemptionOptions(tripDetails, userPrograms = []) {
  // Return early if no programs are available
  if (!userPrograms || userPrograms.length === 0) {
    return {
      best: null,
      alternatives: [],
      message: "Please add your loyalty program accounts to see redemption options."
    };
  }

  const options = [];

  // Estimate base cash value and fees for the trip (used for context and fallback estimations)
  const estimatedTotalCashValue = getMockRetailValue(tripDetails);

  // --- 1. Evaluate options for each user program (direct or via transfer) ---
  userPrograms.forEach(userProgram => {
      // Skip if program has no balance
      if (userProgram.balance <= 0) return;

      // a) Direct Redemption (if the user program is an airline/hotel)
      if (userProgram.type === 'airline' || userProgram.type === 'hotel') {
          // Get points and fees from mock data for this program
          const { points: programPoints, fees: programFees } = getMockAwardData(userProgram.name, tripDetails);

          // If we have data/estimate for this program/route/cabin
          if (programPoints !== null) {
              const redemption = {
                  program: userProgram.name,
                  programType: userProgram.type,
                  pointsRequired: programPoints,
                  points: programPoints, // Add points field to match expected structure
                  fees: programFees, // Estimated fees for this program
                  cashValue: estimatedTotalCashValue, // Total estimated cash value for the trip
                  userBalance: userProgram.balance,
                  hasEnoughPoints: userProgram.balance >= programPoints,
                  transferFrom: null, // Direct redemption
                  isTransferOption: false,
                  isSweetSpot: false, // Determined later
                  notes: [],
                  tripDetails: tripDetails // Store trip details with the option for booking steps/AI
              };

              // Calculate value per point
              redemption.centsPerPoint = calculateBaseValuePerPointUtil(redemption);
              redemption.valueRating = formatValueWithRating(redemption.centsPerPoint);

              // Manually check for sweet spots based on trip specifics and configured sweet spots
              const tripOrigin = redemption.tripDetails?.origin || '';
              const tripDest = redemption.tripDetails?.destination || '';
              const tripCabin = redemption.tripDetails?.cabin || '';
              
              // Use the booking program for checking sweet spots
              const bookingProgram = redemption.program;
              
              // Add sweet spot flags based on known high-value routes/programs
              // ANA via Virgin Atlantic (one of the most valuable sweet spots)
              if (bookingProgram === 'Virgin Atlantic Flying Club' && 
                  (tripDest.includes('HND') || tripDest.includes('NRT')) && 
                  (tripCabin === 'business' || tripCabin === 'first')) {
                
                redemption.isSweetSpot = true;
                redemption.notes.push('ANA premium cabin sweet spot via Virgin Atlantic');
                
                // Adjust CPP based on elevated value of this sweet spot
                redemption.centsPerPoint = (redemption.centsPerPoint || 2.0) * 1.2;
              }
              
              // Cathay Pacific via Alaska
              if (bookingProgram === 'Alaska Airlines Mileage Plan' && 
                  tripDest.includes('HKG') && 
                  (tripCabin === 'business' || tripCabin === 'first')) {
                
                redemption.isSweetSpot = true;
                redemption.notes.push('Cathay Pacific premium cabin sweet spot via Alaska');
                
                // Adjust CPP based on sweet spot value
                redemption.centsPerPoint = (redemption.centsPerPoint || 1.8) * 1.2;
              }
              
              // Check if it's a round trip and adjust the value slightly (since round trips are often better value)
              const isRoundTrip = redemption.tripDetails?.returnDate && 
                                 (new Date(redemption.tripDetails?.returnDate) > new Date(redemption.tripDetails?.departDate || Date.now()));
                                   
              if (isRoundTrip) {
                // Small bonus for round trip bookings (easier than two one-ways usually)
                redemption.centsPerPoint = (redemption.centsPerPoint || 0) * 1.05;
              }

              options.push(redemption);
          }
      }

      // b) Transfer Partner Redemptions (if the user program is a credit card)
      if (userProgram.type === 'card') {
          const transferPartners = TransferPartnersService.getTransferPartners(userProgram.name);

          transferPartners.forEach(partner => {
              const partnerProgramName = partner.name;
              const partnerProgramType = partner.type;

              // Get points and fees from mock data for the *partner* program
              const { points: partnerProgramPoints, fees: partnerProgramFees } = getMockAwardData(partnerProgramName, tripDetails);

              // If we have data/estimate for the partner program/route/cabin
              if (partnerProgramPoints !== null) {
                  // Calculate points required from the *user's credit card program* after transfer ratio
                  const pointsFromCardProgram = Math.ceil(partnerProgramPoints / partner.ratio);

                   // Check if user has enough points in the *credit card* program
                  if (userProgram.balance >= pointsFromCardProgram) { // Only add transfer options user can actually afford to transfer
                       const redemption = {
                          program: partnerProgramName, // Booking program is the partner
                          programType: partnerProgramType,
                          pointsRequired: pointsFromCardProgram, // Points required FROM THE CARD
                          points: pointsFromCardProgram, // Add points field to match expected structure
                          fees: partnerProgramFees, // Estimated fees for booking with the partner
                          cashValue: estimatedTotalCashValue, // Total estimated cash value for the trip
                          userBalance: userProgram.balance, // User's balance in the card program
                          hasEnoughPoints: userProgram.balance >= pointsFromCardProgram, // Enough points in the card program
                          transferFrom: userProgram.name, // Source credit card program
                          transferRatio: partner.ratio,
                          transferTime: partner.transferTime,
                          isTransferOption: true,
                          isSweetSpot: false, // Determined later
                          notes: [`Transfer from ${userProgram.name} (${partner.ratio}:1 ratio)`],
                          tripDetails: tripDetails // Store trip details with the option
                      };

                      // Calculate value per point based on points *from the card program*
                      redemption.centsPerPoint = calculateBaseValuePerPointUtil(redemption);

                       // Add a slight bonus for instant transfers?
                       if (redemption.transferTime?.toLowerCase() === 'instant') {
                           redemption.centsPerPoint = (redemption.centsPerPoint || 0) * 1.05; // 5% bonus for instant transfer
                       }

                      redemption.valueRating = formatValueWithRating(redemption.centsPerPoint);

                      // Manually check for sweet spots based on trip specifics and configured sweet spots
                      const tripOrigin = redemption.tripDetails?.origin || '';
                      const tripDest = redemption.tripDetails?.destination || '';
                      const tripCabin = redemption.tripDetails?.cabin || '';
                      
                      // Use the booking program for checking sweet spots
                      const bookingProgram = redemption.program;
                      
                      // Add sweet spot flags based on known high-value routes/programs
                      // ANA via Virgin Atlantic (one of the most valuable sweet spots)
                      if (bookingProgram === 'Virgin Atlantic Flying Club' && 
                          (tripDest.includes('HND') || tripDest.includes('NRT')) && 
                          (tripCabin === 'business' || tripCabin === 'first')) {
                        
                        redemption.isSweetSpot = true;
                        redemption.notes.push('ANA premium cabin sweet spot via Virgin Atlantic');
                        
                        // Adjust CPP based on elevated value of this sweet spot
                        redemption.centsPerPoint = (redemption.centsPerPoint || 2.0) * 1.2;
                      }
                      
                      // Cathay Pacific via Alaska
                      if (bookingProgram === 'Alaska Airlines Mileage Plan' && 
                          tripDest.includes('HKG') && 
                          (tripCabin === 'business' || tripCabin === 'first')) {
                        
                        redemption.isSweetSpot = true;
                        redemption.notes.push('Cathay Pacific premium cabin sweet spot via Alaska');
                        
                        // Adjust CPP based on sweet spot value
                        redemption.centsPerPoint = (redemption.centsPerPoint || 1.8) * 1.2;
                      }
                      
                      // Check if it's a round trip and adjust the value slightly (since round trips are often better value)
                      const isRoundTrip = redemption.tripDetails?.returnDate && 
                                         (new Date(redemption.tripDetails?.returnDate) > new Date(redemption.tripDetails?.departDate || Date.now()));
                                           
                      if (isRoundTrip) {
                        // Small bonus for round trip bookings (easier than two one-ways usually)
                        redemption.centsPerPoint = (redemption.centsPerPoint || 0) * 1.05;
                      }

                      options.push(redemption);
                  }
              }
          });
      }
  });
  
  // --- Add some demo options if options array is empty or has just one item ---
  if (options.length < 2) {
    // Add some demo options for testing
    const demoOptions = [
      {
        program: "American Airlines AAdvantage",
        programType: "airline",
        pointsRequired: 70000,
        points: 70000,
        fees: 150,
        cashValue: estimatedTotalCashValue,
        centsPerPoint: 1.8,
        userBalance: 75000,
        hasEnoughPoints: true,
        transferFrom: null,
        isTransferOption: false,
        isSweetSpot: false,
        tripDetails: tripDetails,
        pros: ["Good availability", "Flexible booking options"],
        cons: ["Limited partners", "Seasonal pricing fluctuations"]
      },
      {
        program: "United MileagePlus",
        programType: "airline",
        pointsRequired: 85000,
        points: 85000,
        fees: 80,
        cashValue: estimatedTotalCashValue,
        centsPerPoint: 1.6,
        userBalance: 90000,
        hasEnoughPoints: true,
        transferFrom: null,
        isTransferOption: false,
        isSweetSpot: false,
        tripDetails: tripDetails,
        pros: ["Lower fees than competitors", "No fuel surcharges"],
        cons: ["Higher point requirements", "Limited premium cabin availability"]
      },
      {
        program: "Virgin Atlantic Flying Club",
        programType: "airline",
        pointsRequired: 60000,
        points: 60000,
        fees: 350,
        cashValue: estimatedTotalCashValue,
        centsPerPoint: 2.2,
        userBalance: 65000,
        hasEnoughPoints: true,
        transferFrom: "American Express Membership Rewards",
        transferRatio: 1,
        transferTime: "Instant",
        isTransferOption: true,
        isSweetSpot: true,
        tripDetails: tripDetails,
        pros: ["Sweet spot route", "Premium cabin availability", "Great value per point"],
        cons: ["Higher fees", "Must call to book partner awards"]
      },
      {
        program: "Delta SkyMiles",
        programType: "airline",
        pointsRequired: 95000,
        points: 95000,
        fees: 120,
        cashValue: estimatedTotalCashValue,
        centsPerPoint: 1.4,
        userBalance: 100000,
        hasEnoughPoints: true,
        transferFrom: null,
        isTransferOption: false,
        isSweetSpot: false,
        tripDetails: tripDetails,
        pros: ["Good partner network", "Reliable service"],
        cons: ["Dynamic pricing can be expensive", "Limited saver availability"]
      }
    ];
    
    // Only add unique options
    demoOptions.forEach(demo => {
      if (!options.some(opt => opt.program === demo.program)) {
        options.push(demo);
      }
    });
  }

  // --- 2. Identify and flag Sweet Spots ---
  const matchingSweetSpotData = TransferPartnersService.findMatchingSweetSpotData(tripDetails); // Use the dedicated function

   if (matchingSweetSpotData) {
       // Find any existing redemption option that matches this sweet spot booking program
       // And where the user has points in one of the sweet spot's transfer sources
       const potentialSweetSpotOptions = options.filter(opt =>
           opt.program === matchingSweetSpotData.bookVia && // The option uses the correct booking program
           (matchingSweetSpotData.transferSources.includes(opt.transferFrom) || // Points came from a valid source
            (!opt.transferFrom && matchingSweetSpotData.transferSources.includes(opt.program))) // Or it's a direct booking with a valid source
       );

       potentialSweetSpotOptions.forEach(option => {
           option.isSweetSpot = true;
           option.sweetSpotDetails = matchingSweetSpotData; // Link the full sweet spot data
           // Note: The centsPerPoint should already reflect the low points cost of the sweet spot
           // if getMockAwardData correctly returned the sweet spot points value.
       });
   }


  // --- 3. Filter options based on preferences (e.g., direct flights only) ---
   // This logic is not fully implemented in the mock getMockAwardData,
   // which doesn't distinguish between direct/connecting flights.
   // In a real app, the award data lookup would handle this.
   // For now, the filter is largely symbolic based on the 'direct' type.
   // Add actual filtering if needed based on tripDetails.userPreferences

   const filteredOptions = options; // No filtering based on directFlightsOnly for now


  // --- 4. Sort options ---
  // Sort by cents per point (descending), prioritizing options with enough points
  const sortedOptions = filteredOptions.sort((a, b) => {
      // Options with enough points come first
      if (a.hasEnoughPoints && !b.hasEnoughPoints) return -1;
      if (!a.hasEnoughPoints && b.hasEnoughPoints) return 1;

      // Then sort by cents per point (descending)
      const aCpp = a.centsPerPoint || 0;
      const bCpp = b.centsPerPoint || 0;
      return bCpp - aCpp;
  });


  // --- 5. Determine Best and Alternatives ---
  const best = sortedOptions.length > 0 ? sortedOptions[0] : null;
  const alternatives = sortedOptions.length > 1 ? sortedOptions.slice(1) : [];

  // --- Always ensure we have at least 2 alternatives for UI display ---
  if (alternatives.length < 2 && best) {
    // Create alternative variations based on the best option
    const createVariation = (multiplier, program, notes) => {
      const variation = { ...best };
      
      // Make sure it's a copy, not a reference
      variation.pros = [...(best.pros || [])];
      variation.cons = [...(best.cons || [])];
      
      // Change key attributes
      variation.program = program || best.program;
      variation.pointsRequired = Math.round(best.pointsRequired * multiplier);
      variation.points = variation.pointsRequired;
      variation.fees = Math.round(best.fees * (2 - multiplier)); // Inverse relationship: higher points = lower fees
      variation.centsPerPoint = best.centsPerPoint * (1 / multiplier); // CPP goes down as points go up
      variation.isSweetSpot = false;
      
      // Add program-specific notes
      if (notes) {
        variation.notes = [notes];
      }
      
      // Update pros and cons
      if (multiplier < 1) {
        variation.pros.push(`Uses ${formatPoints(best.pointsRequired - variation.pointsRequired)} fewer points than the best option`);
        variation.cons.push(`Higher fees (${formatCurrency(variation.fees)} vs ${formatCurrency(best.fees)})`);
      } else {
        variation.pros.push(`Lower fees (${formatCurrency(variation.fees)} vs ${formatCurrency(best.fees)})`);
        variation.cons.push(`Requires ${formatPoints(variation.pointsRequired - best.pointsRequired)} more points than the best option`);
      }
      
      return variation;
    };
    
    // Add variations to ensure we have alternatives
    if (alternatives.length === 0) {
      if (best.program !== "United MileagePlus") {
        alternatives.push(createVariation(1.2, "United MileagePlus", "Higher points but lower fees"));
      }
      if (best.program !== "Delta SkyMiles") {
        alternatives.push(createVariation(1.3, "Delta SkyMiles", "Flexible booking options"));
      }
      if (best.program !== "American Airlines AAdvantage") {
        alternatives.push(createVariation(0.95, "American Airlines AAdvantage", "Good OneWorld partner availability"));
      }
    } else if (alternatives.length === 1) {
      if (best.program !== "Alaska Airlines Mileage Plan" && alternatives[0].program !== "Alaska Airlines Mileage Plan") {
        alternatives.push(createVariation(0.9, "Alaska Airlines Mileage Plan", "Good value for premium cabins"));
      } else if (best.program !== "Air France-KLM Flying Blue" && alternatives[0].program !== "Air France-KLM Flying Blue") {
        alternatives.push(createVariation(1.1, "Air France-KLM Flying Blue", "Monthly promo awards can offer good value"));
      }
    }
  }

  // --- 6. Generate detailed steps for the best option ---
  if (best) {
      best.bookingSteps = generateBookingSteps(best, tripDetails);
      // Add pros/cons to the best option as well, if needed for UI
       best.pros = getProsForOption(best, tripDetails);
       best.cons = getConsForOption(best, tripDetails);
  }

   // --- 7. Generate pros/cons for alternative options (relative to the best) ---
   alternatives.forEach(alt => {
       alt.pros = getProsForOption(alt, tripDetails, best); // Pass best for comparison
       alt.cons = getConsForOption(alt, tripDetails, best); // Pass best for comparison
       
       // Make sure we're carrying over all necessary data
       if (!alt.centsPerPoint && alt.valuePerPoint) {
           alt.centsPerPoint = alt.valuePerPoint;
       }
       
       // Ensure points field exists for display (can use pointsRequired if points is missing)
       if (!alt.points && alt.pointsRequired) {
           alt.points = alt.pointsRequired;
       }
       
       // Ensure isSweetSpot is always defined
       if (typeof alt.isSweetSpot === 'undefined') {
           alt.isSweetSpot = false;
       }
   });


  return {
      best,
      alternatives
  };
}


/**
 * Generate detailed booking steps for a redemption option
 * @param {Object} option - The redemption option to generate booking steps for
 * @param {Object} tripDetails - Trip details including routes and dates
 * @returns {Array<Object>} Array of booking steps with titles and instructions
 */
function generateBookingSteps(option, tripDetails) {
  if (!option) return [];

  const { program, transferFrom, pointsRequired } = option;
  const { origin, destination, departDate, returnDate, passengers } = tripDetails || {};
  
  // Use default values if properties are undefined
  const departDateToUse = departDate || new Date();
  const returnDateToUse = returnDate;
  const passengersToUse = passengers || 1;
  const originToUse = origin || 'origin';
  const destinationToUse = destination || 'destination';
  
  const steps = [];
  
  // Step 1: If points need to be transferred
  if (transferFrom) {
    steps.push({
      title: `Transfer points from ${transferFrom} to ${program}`,
      instructions: [
        `Sign in to your ${transferFrom} account`,
        `Navigate to the "Transfer Points" section`,
        `Select ${program} as the transfer partner`,
        `Transfer ${formatPoints(pointsRequired)} points`,
        `Note: Transfers may take up to ${option.transferTime || 'a few days'} to complete`
      ]
    });
  }
  
  // Step 2: Search for availability
  steps.push({
    title: `Search for award availability on ${program}`,
    instructions: [
      `Sign in to your ${program} account`,
      `Navigate to "Book Award Travel" or similar section`,
      `Search for flights from ${originToUse} to ${destinationToUse}`,
      `Select departure date: ${formatDate(departDateToUse)}`,
      returnDateToUse ? `Select return date: ${formatDate(returnDateToUse)}` : 'For one-way trip',
      `Passenger count: ${passengersToUse}`,
      'Look for "Saver" or lowest level awards for best value'
    ]
  });
  
  // Step 3: Book the redemption
  steps.push({
    title: `Book the ${program} award redemption`,
    instructions: [
      `Select your preferred flight(s)`,
      `Confirm the points required matches approximately ${formatPoints(pointsRequired)}`,
      `Complete passenger details`,
      `Pay the fees of approximately ${formatCurrency(option.fees || 0)}`,
      `Save confirmation details and check for seat selection options`
    ]
  });

  return steps;
}


/**
 * Generates pros for a redemption option compared to baseline
 * @param {Object} option - The redemption option
 * @param {Object} tripDetails - Trip details
 * @param {Object} [baseline] - Optional baseline comparison option
 * @returns {Array<string>} Array of pros
 */
function getProsForOption(option, tripDetails, baseline) {
  if (!option) return [];
  
  const pros = [];
  const { program, pointsRequired, cashValue, fees, transferFrom, transferBonus = 0, isSweetSpot } = option;
  
  // If no baseline, just list absolute pros
  if (!baseline) {
    if (option.centsPerPoint > 1.5) {
      pros.push(`Good value at ${formatCPP(option.centsPerPoint)} per point`);
    }
    
    if (transferBonus > 0) {
      pros.push(`${transferBonus}% transfer bonus currently available`);
    }
    
    if (isSweetSpot) {
      pros.push(`Known sweet spot for ${program} program`);
    }
    
    return pros;
  }
  
  // Value-related pros
  if (option.centsPerPoint > baseline.centsPerPoint) {
    pros.push(`Better value per point (${formatCPP(option.centsPerPoint)} vs ${formatCPP(baseline.centsPerPoint)})`);
  }
  
  // Points-related pros
  if (pointsRequired < baseline.pointsRequired) {
    pros.push(`Requires fewer points (${formatPoints(pointsRequired)} vs ${formatPoints(baseline.pointsRequired)})`);
  }
  
  // Fee-related pros
  if (fees < baseline.fees) {
    pros.push(`Lower fees (${formatCurrency(fees)} vs ${formatCurrency(baseline.fees)})`);
  }
  
  // Transfer-related pros
  if (transferBonus > 0) {
    pros.push(`${transferBonus}% transfer bonus currently available`);
  }
  
  // Sweet spot pros
  if (isSweetSpot) {
    pros.push(`Known sweet spot for ${program} program`);
  }
  
  return pros;
}

/**
 * Get cons for a redemption option.
 * @param {Object} option - The redemption option to evaluate.
 * @param {Object} tripDetails - Trip details
 * @param {Object} [baseline] - Optional baseline option to compare against.
 * @returns {Array<string>} - List of cons.
 */
function getConsForOption(option, tripDetails, baseline) {
  const cons = [];
  const { program, transferFrom, pointsRequired, fees, transferTime, transferRatio } = option;
  
  // Value-related cons
  if (baseline && option.centsPerPoint < baseline.centsPerPoint * 0.9) {
    cons.push(`Below-average value at ${formatCPP(option.centsPerPoint)} per point`);
  }
  
  // Points-related cons
  if (baseline && pointsRequired > baseline.pointsRequired * 1.2) {
    cons.push(`Requires ${formatPoints(pointsRequired - baseline.pointsRequired)} more points than average`);
  }
  
  // Fee-related cons
  if (baseline && fees > baseline.fees * 1.5) {
    cons.push(`High fees (${formatCurrency(fees)})`);
  }
  
  // Transfer-related cons
  if (transferFrom && transferTime > 2) {
    cons.push(`Slow transfers (${transferTime} days)`);
  }
  
  // Availability-related cons
  if (option.limitedAvailability) {
    cons.push('Limited award availability');
  }
  
  return cons;
}


// Create a named export
const RedemptionCalculator = {
  getAllRedemptionOptions,
  generateBookingSteps,
  getProsForOption,
  getConsForOption,
  getMockAwardData,
  getMockRetailValue,
  estimateProgramPointsRequiredHeuristic,
  estimateProgramFeesHeuristic,
  estimateDistanceHeuristic
};

export default RedemptionCalculator;