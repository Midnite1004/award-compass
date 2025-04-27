// src/utils/redemptionValueUtils.js

/**
 * Utility functions for calculating and formatting redemption values.
 * These are general helpers and don't contain complex program-specific logic.
 */

// --- Constants (Simplified/Example Data) ---
// In a real app, these might be more dynamic or detailed

// Base value per point for different program types (in cents)
export const BASE_VALUE_PER_POINT = {
  airline: {
    economy: 1.2,
    premium: 1.5,
    business: 1.8,
    first: 2.2
  },
  hotel: {
    standard: 0.7,
    premium: 0.9,
    luxury: 1.1 // This might be used for high-end hotel redemptions, potentially a sweet spot type
  },
  card: 1.7 // Transferrable points average value
};

// Program-specific average value multipliers (relative to BASE_VALUE_PER_POINT)
// A multiplier of 1.0 means the program's average value aligns with the base.
export const PROGRAM_VALUE_MULTIPLIERS = {
  // Airlines
  'United MileagePlus': 1.0,
  'American Airlines AAdvantage': 1.1, // Slightly above average potential
  'Delta SkyMiles': 0.9, // Slightly below average potential
  'Alaska Airlines Mileage Plan': 1.3, // Known for good partner redemptions
  'British Airways Executive Club': 0.7, // Can have high fees reducing value
  'Air Canada Aeroplan': 1.2,
  'ANA Mileage Club': 1.4, // Good values on their metal
  'Virgin Atlantic Flying Club': 1.3, // Known for sweet spots
  'Singapore KrisFlyer': 1.2,
  'Air France-KLM Flying Blue': 1.0, // Can be dynamic

  // Hotels
  'Marriott Bonvoy': 0.8, // Average/lower value per point compared to some others
  'Hilton Honors': 0.5, // Generally lower value per point
  'World of Hyatt': 1.7, // Generally higher value per point
  'IHG One Rewards': 0.6,

  // Credit Cards (values based on transfer potential)
  'American Express Membership Rewards': 1.1,
  'Chase Ultimate Rewards': 1.1,
  'Citi ThankYou Rewards': 1.0,
  'Capital One Miles': 1.0
};

// Special high-value redemption opportunities (less detailed list)
// This list is less preferred than the detailed data in TransferPartnersService.js/sweetSpots
// It's kept here for compatibility if referenced elsewhere, but ideally consolidate.
export const SWEET_SPOTS = [
  {
    program: 'Virgin Atlantic Flying Club',
    partner: 'ANA',
    route: ['US', 'JP'],
    cabin: 'first',
    valueMultiplier: 3.0,
    description: 'Virgin Atlantic miles for ANA First Class (US-Japan)'
  },
  {
    program: 'Virgin Atlantic Flying Club',
    partner: 'ANA',
    route: ['US', 'JP'],
    cabin: 'business',
    valueMultiplier: 2.5,
    description: 'Virgin Atlantic miles for ANA Business Class (US-Japan)'
  },
  {
    program: 'Alaska Airlines Mileage Plan',
    partner: 'Cathay Pacific',
    route: ['US', 'HK'],
    cabin: 'business',
    valueMultiplier: 2.2,
    description: 'Alaska miles for Cathay Pacific Business (US-Hong Kong)'
  },
  {
    program: 'Alaska Airlines Mileage Plan',
    partner: 'Japan Airlines',
    route: ['US', 'JP'],
    cabin: 'business',
    valueMultiplier: 2.2,
    description: 'Alaska miles for JAL Business (US-Japan)'
  },
  {
    program: 'Air Canada Aeroplan',
    partner: 'Lufthansa',
    route: ['US', 'DE'],
    cabin: 'first',
    valueMultiplier: 2.0,
    description: 'Aeroplan miles for Lufthansa First Class (US-Germany)'
  },
  {
    program: 'World of Hyatt',
    partner: null,
    route: null,
    cabin: 'luxury',
    valueMultiplier: 2.0,
    description: 'Hyatt points for luxury properties'
  }
];


// --- Utility Functions ---

/**
 * Calculate the value per point for a specific redemption option.
 * Takes a structured redemption object as input containing cashValue, fees, and pointsRequired.
 * @param {Object} redemption - The redemption option details.
 * @param {number} redemption.cashValue - The estimated cash value of the redemption (e.g., flight cost).
 * @param {number} redemption.fees - The cash fees/taxes required for the redemption.
 * @param {number} redemption.pointsRequired - The total points required from the *user's account*.
 * @returns {number | null} Value per point in cents (or null if calculation is not possible/meaningless).
 */
export function calculateValuePerPoint(redemption) {
  const { cashValue, fees, pointsRequired } = redemption;

  // Ensure required numerical inputs are valid
  if (typeof cashValue !== 'number' || typeof fees !== 'number' || typeof pointsRequired !== 'number') {
      return null;
  }

  if (pointsRequired <= 0) {
    // Cannot calculate value if no points are used or points required is zero
    return null;
  }

  // Calculate the net value the points are offsetting
  const netValue = cashValue - fees;

  // If net value is zero or negative, the value per point is also zero or negative.
  // Return 0 in this case as negative CPP is not useful for comparison.
  if (netValue <= 0) return 0;

  const valuePerPoint = (netValue / pointsRequired) * 100; // Result is in cents per point

  // Return value rounded to one decimal place
  return parseFloat(valuePerPoint.toFixed(1));
}


/**
 * Format value per point with rating.
 * This is a presentation utility, keep it here.
 * @param {number | null} valuePerPoint - Value per point in cents, or null.
 * @returns {Object} Formatted value and rating info.
 */
export function formatValueWithRating(valuePerPoint) {
  // Handle null or non-finite values gracefully
  if (valuePerPoint === null || !isFinite(valuePerPoint)) {
    return {
      formatted: 'N/A',
      rating: 'unknown',
      description: 'Unknown value',
      colorClass: 'text-gray-500' // Tailwind class for grey text
    };
  }

  let rating, description, colorClass;

  // Define thresholds and corresponding labels/colors
  if (valuePerPoint >= 2.5) {
    rating = 'excellent';
    description = 'Excellent value';
    colorClass = 'text-purple-700'; // Using Tailwind purple for high value
  } else if (valuePerPoint >= 1.5) { // Changed from 1.8
    rating = 'great';
    description = 'Great value';
    colorClass = 'text-green-700'; // Tailwind green for great value
  } else if (valuePerPoint >= 1.0) { // Changed from 1.2
    rating = 'good';
    description = 'Good value';
    colorClass = 'text-blue-700'; // Tailwind blue for good value
  } else if (valuePerPoint >= 0.6) { // Changed from 0.8
    rating = 'average';
    description = 'Average value';
    colorClass = 'text-yellow-800'; // Tailwind yellow for average value
  } else { // Value per point less than 0.6
    rating = 'poor';
    description = 'Poor value';
    colorClass = 'text-red-700'; // Tailwind red for poor value
  }

  return {
    formatted: `${valuePerPoint.toFixed(1)}¢/pt`, // Format to one decimal place
    rating,
    description,
    colorClass
  };
}

/**
 * Format currency for display (USD).
 * This is a presentation utility, keep it here.
 * @param {number | null | undefined} value - Currency value.
 * @param {Object} [options] - Formatting options.
 * @param {string} [options.currency='USD'] - The currency code.
 * @param {number} [options.minimumFractionDigits=0] - Minimum decimal places.
 * @param {number} [options.maximumFractionDigits=0] - Maximum decimal places.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(value, options = {}) {
    // Handle null, undefined, or non-finite values gracefully
    if (value === null || value === undefined || typeof value !== 'number' || !isFinite(value)) {
        return 'N/A';
    }

    // Handle negative values
    if (value < 0) {
        return `-${formatCurrency(Math.abs(value), options)}`;
    }

    const {
        currency = 'USD',
        minimumFractionDigits = 0,
        maximumFractionDigits = 0,
        showCents = false // New option to control cents display
    } = options;

    try {
        // Use Intl.NumberFormat for reliable currency formatting
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: showCents ? 2 : minimumFractionDigits,
            maximumFractionDigits: showCents ? 2 : maximumFractionDigits
        }).format(value);
    } catch (error) {
        console.error('Error formatting currency:', value, options, error);
        // Fallback to a simple fixed-decimal format
        return `$${value.toFixed(2)}`;
    }
}

/**
 * Format points (large numbers) with commas.
 * @param {number | null | undefined} points - Points value.
 * @returns {string} Formatted points string.
 */
export function formatPoints(points) {
    if (points === null || points === undefined || typeof points !== 'number' || !isFinite(points)) {
        return 'N/A';
    }
    return points.toLocaleString(); // Use locale-aware formatting
}

/**
 * Format date for display (YYYY-MM-DD to readable format).
 * @param {Date|string|null} date - Date to format
 * @returns {string} Formatted date string or placeholder
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  
  try {
    // Handle string or Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    // Format as Month DD, YYYY
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date); // Return stringified date as fallback
  }
}

/**
 * Format cents per point for display
 * @param {number} cpp - Cents per point value
 * @returns {string} Formatted cents per point
 */
export function formatCPP(cpp) {
  if (cpp === null || cpp === undefined || !isFinite(cpp)) return 'N/A';
  return `${cpp.toFixed(1)}¢`;
}

/**
 * Format cents per point (alternative format)
 * @param {number} cpp - Cents per point value
 * @returns {string} Formatted cents per point
 */
export function formatCentsPerPoint(cpp) {
  if (cpp === null || cpp === undefined || !isFinite(cpp)) return 'N/A';
  return `${cpp.toFixed(1)} cents per point`;
}

// --- Deprecated/Less Centralized Functions ---
// These functions are kept for reference or potential niche use but are not
// the primary calculation path used by the new RedemptionCalculator.

/**
 * Estimate required points for a redemption based on *base* values.
 * This is a simplified estimation. The main RedemptionCalculator.js uses
 * a more sophisticated model that might incorporate award charts or specific heuristics.
 * @deprecated Use estimateProgramPointsRequired in RedemptionCalculator.js for core logic.
 */
export function estimatePointsRequired(options) {
    console.warn("Using deprecated estimatePointsRequired from redemptionValueUtils. Prefer estimateProgramPointsRequired in RedemptionCalculator.js");
    const {
      program, // Note: This function uses program *name*, not the full program object structure like others
      programType,
      cashValue,
      cabin = 'economy',
      hotelCategory = 'standard' // This might not align with the cabin structure
    } = options;

    if (!cashValue || !program || !programType) {
      return null; // Cannot estimate without these basics
    }

    // Get base value per point in cents based on program type and cabin/category
    let baseValueCpp;
    if (programType === 'airline') {
      baseValueCpp = BASE_VALUE_PER_POINT.airline[cabin];
    } else if (programType === 'hotel') {
      baseValueCpp = BASE_VALUE_PER_POINT.hotel[hotelCategory];
    } else if (programType === 'card') {
      baseValueCpp = BASE_VALUE_PER_POINT.card;
    } else {
      // Default if program type is unknown or other
      baseValueCpp = 1.0; // Assume 1 cent per point baseline
    }

    // Ensure base value is positive to avoid division issues
    if (baseValueCpp === undefined || baseValueCpp === null || baseValueCpp <= 0) {
        console.warn(`Invalid or zero baseValueCpp for programType=${programType}, cabin=${cabin}, hotelCategory=${hotelCategory}. Defaulting to 1.0.`);
        baseValueCpp = 1.0;
    }

    // Apply program-specific multiplier if available to the base CPP
    const multiplier = PROGRAM_VALUE_MULTIPLIERS[program] || 1.0;
    const adjustedBaseValueCpp = baseValueCpp * multiplier;

    // Calculate required points: (Cash Value in Cents) / (Adjusted Value per point in Cents)
    // (Cash Value in Dollars * 100) / adjustedBaseValueCpp
    const pointsRequired = Math.round((cashValue * 100) / (adjustedBaseValueCpp || 1.0)); // Use 1.0 if adjusted is 0

     // Ensure minimum points if there's cash value and calculation resulted in <= 0
     if (cashValue > 0 && pointsRequired <= 0) {
         // Fallback to 1 cpp if calculation yields zero or less points but there's cash value
         return Math.round((cashValue * 100) / 1.0);
     }


    return pointsRequired;
}

/**
 * Check if a redemption is a known sweet spot based on the *local, less detailed* SWEET_SPOTS list.
 * The TransferPartnersService.js module contains a more comprehensive `sweetSpots` data structure
 * and a `findMatchingSweetSpotData` function that is used by the main RedemptionCalculator.
 * @deprecated Use findMatchingSweetSpotData from TransferPartnersService.js for more comprehensive data.
 */
export function findSweetSpot(redemption) {
    console.warn("Using deprecated findSweetSpot from redemptionValueUtils. Prefer findMatchingSweetSpotData from TransferPartnersService.js");
    const { program, origin, destination, cabin = 'economy' } = redemption;

    if (!program) return null;

    // Simple country code extraction (assuming origin/destination are IATA codes or country codes)
    const originCode = typeof origin === 'object' ? origin?.value : origin;
    const destinationCode = typeof destination === 'object' ? destination?.value : destination;
     // Simple substring isn't reliable for country codes, but matches old logic
    const originCountry = originCode?.length > 1 ? originCode.substring(0, 2) : originCode;
    const destinationCountry = destinationCode?.length > 1 ? destinationCode.substring(0, 2) : destinationCode;


    // Find matching sweet spots from the *local* SWEET_SPOTS array
    const matchingSweetSpot = SWEET_SPOTS.find(spot => {
      // Program must match the program doing the booking, or the partner being booked
      if (spot.program !== program && spot.partner !== program) return false;

      // If cabin is specified, it must match (case-insensitive)
      if (spot.cabin && spot.cabin.toLowerCase() !== cabin.toLowerCase()) return false;

      // If route is specified (as [country1, country2]), check if origin/destination match
      if (spot.route && originCountry && destinationCountry) {
        const [country1, country2] = spot.route;
        // Check if the route is between these two countries (in either direction)
        const routeMatches = (originCountry === country1 && destinationCountry === country2) ||
                             (originCountry === country2 && destinationCountry === country1);
        if (!routeMatches) return false;
      }
      // If route is specified in spot but origin/destination weren't provided, no route match is possible.
      // If route is *not* specified in spot (i.e., spot.route is null/undefined), it's a non-route-specific sweet spot (like Hyatt luxury).
      // In that case, it's a match if the program and cabin (if specified) matched.

      // If we reached here, and a route was specified in the spot, the route matched.
      // If no route was specified in the spot, it's considered a match.
      return true;
    });

    return matchingSweetSpot || null; // Return the matching object or null
  }


const RedemptionValueUtils = {
  calculateValuePerPoint,
  formatValueWithRating,
  formatCurrency,
  formatPoints,
  formatDate,
  formatCPP,
  formatCentsPerPoint,
  estimatePointsRequired, // Deprecated
  findSweetSpot, // Deprecated
  BASE_VALUE_PER_POINT,
  PROGRAM_VALUE_MULTIPLIERS, // Renamed from PROGRAM_MULTIPLIERS
  SWEET_SPOTS // Less detailed sweet spot list
};

export default RedemptionValueUtils;