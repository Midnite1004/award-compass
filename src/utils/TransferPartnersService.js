// src/utils/TransferPartnersService.js

/**
 * TransferPartnersService.js
 * Provides comprehensive information about transfer partners between credit card programs and airlines/hotels,
 * and data on specific high-value "sweet spot" redemptions.
 */

// --- Data ---

// Mapping of credit card programs to their transfer partners
// Includes transfer ratio and estimated transfer time.
export const transferPartners = {
  "American Express Membership Rewards": [
    { name: "Air Canada Aeroplan", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "ANA Mileage Club", type: "airline", ratio: 1, transferTime: "2-3 days" },
    { name: "British Airways Executive Club", type: "airline", ratio: 1, transferTime: "1-2 days" },
    { name: "Delta SkyMiles", type: "airline", ratio: 1, transferTime: "Instant" }, // Delta is instant for Amex US
    { name: "Emirates Skywards", type: "airline", ratio: 1, transferTime: "1-2 days" },
    { name: "Etihad Guest", type: "airline", ratio: 1, transferTime: "1-3 days" },
    { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1, transferTime: "Instant" }, // Flying Blue is instant for Amex US
    { name: "Singapore KrisFlyer", type: "airline", ratio: 1, transferTime: "1-2 days" },
    { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1, transferTime: "Instant" },
    // Note: Hotel transfers from Amex generally offer poor value compared to airline transfers or using hotel points directly.
    // Including them here for completeness, but their value needs to be evaluated carefully.
    // Using 1:1 ratio as a placeholder for simplicity, actual ratio varies by card (e.g., some Amex cards transfer to Marriott at 3:1, others have specific hotel points). Assume this is for general MR points transferring to partners listed by name.
    { name: "Marriott Bonvoy", type: "hotel", ratio: 1, transferTime: "1-2 days", ratioNote: "Ratio varies by card (often 3:1 or special rates)" },
    { name: "Hilton Honors", type: "hotel", ratio: 1, transferTime: "1-2 days", ratioNote: "1:2 transfer ratio (1000 Amex -> 2000 Hilton)" } // Hilton is often 1:2
    // Add more Amex partners...
  ],
  "Chase Ultimate Rewards": [
    { name: "United MileagePlus", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "Southwest Rapid Rewards", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "British Airways Executive Club", type: "airline", ratio: 1, transferTime: "Instant" }, // BA is instant for Chase US
    { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "Singapore KrisFlyer", type: "airline", ratio: 1, transferTime: "1-2 days" },
    { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "World of Hyatt", type: "hotel", ratio: 1, transferTime: "Instant" },
    // Note: Marriott transfer from Chase is 1:1, but value is often poor.
    { name: "Marriott Bonvoy", type: "hotel", ratio: 1, transferTime: "1 day" },
    { name: "IHG One Rewards", type: "hotel", ratio: 1, transferTime: "Instant", ratioNote: "1:1 transfer ratio (1000 Chase -> 1000 IHG)" } // IHG is often 1:1
    // Add more Chase partners...
  ],
  "Citi ThankYou Rewards": [ // Renamed from Citi ThankYou Points based on common usage
    { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1, transferTime: "Instant" }, // Flying Blue instant for Citi
    { name: "Etihad Guest", type: "airline", ratio: 1, transferTime: "1-3 days" }, // Was 1 week
    { name: "Singapore KrisFlyer", type: "airline", ratio: 1, transferTime: "1-2 days" },
    { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1, transferTime: "Instant" }, // VS instant for Citi
    // Add more Citi partners...
  ],
  "Capital One Miles": [
    { name: "Air Canada Aeroplan", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1, transferTime: "Instant" },
    { name: "British Airways Executive Club", type: "airline", ratio: 1, transferTime: "1 day" },
    { name: "Emirates Skywards", type: "airline", ratio: 1, transferTime: "Instant" }, // Ratio was 0.5, often 1:1 now
    { name: "Singapore KrisFlyer", type: "airline", ratio: 1, transferTime: "1-2 days" }, // Ratio was 0.5
    { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1, transferTime: "Instant" },
    // Add more Capital One partners...
  ],
   "Marriott Bonvoy": [ // Marriott is also a source for airline transfers, but usually poor value (3:1 ratio + bonus)
      { name: "Alaska Airlines Mileage Plan", type: "airline", ratio: 3, transferTime: "2 days", bonusNote: "5,000 bonus miles for every 60,000 points transferred" },
      { name: "American Airlines AAdvantage", type: "airline", ratio: 3, transferTime: "2 days", bonusNote: "5,000 bonus miles for every 60,000 points transferred" },
      { name: "United MileagePlus", type: "airline", ratio: 3, transferTime: "3 days", bonusNote: "5,000 bonus miles for every 60,000 points transferred, plus 10k bonus for every 60k to UA" } // Special bonus for UA
      // Add other Marriott partners...
   ]
  // Add other card programs like Bilt, US Bank, etc.
};

// Detailed Sweet Spots data structure
// Organized by the *booking* program (where the points are used).
// Includes details needed for the SpecialRedemptionGuide component.
export const sweetSpots = {
  "ANA Mileage Club": [
    // Sweet spot booked *via* ANA Mileage Club itself (e.g. ANA RTW)
    {
      id: "ANA_RTW",
      name: "ANA First/Business Round the World",
      description: "Multi-stop award allowing up to 8 stopovers booked directly with ANA.",
      type: "airline", // Type of the sweet spot redemption (airline, hotel)
      cabin: ["economy", "premium", "business", "first"], // Applicable cabins
      route: "Round the World (Multi-City)", // Route description or specific segments
      pointsRequired: { // Points structure (e.g., by region, distance, or cabin within the spot)
         // These are illustrative and depend on ANA's chart
         "Economy": "75,000 - 120,000 pts", // Example points based on distance tiers
         "Business": "100,000 - 200,000 pts",
         "First": "180,000 - 300,000 pts" // Example points
      },
      bookVia: "ANA Mileage Club", // Program to book with
      transferSources: ["American Express Membership Rewards", "Marriott Bonvoy"], // Credit card programs that transfer TO the booking program
      valuePerPoint: "4-10¢", // Estimated value range for this spot type
      searchWindow: "Search up to 355 days in advance when ANA releases partner space. Requires calling ANA.",
      searchTools: ["ANA website (for own flights)", "Star Alliance tools (United.com, AirCanada.com)", "ExpertFlyer"],
      callInstructions: "Call ANA Mileage Club at 1-800-235-9262 to book complex multi-city or partner awards.",
      bookingLink: "https://www.ana.co.jp/en/us/amc/partner-flight-awards/", // Link to partner award info
      routeOptions: [], // RTW doesn't have fixed routes like a single long-haul segment
      proTips: [
          "Maximize value by including multiple long-haul segments",
          "Award space is limited, flexibility is key",
          "Calculated based on total distance, not per segment",
          "Requires phone booking"
          ],
      warnings: [
          "Complex booking rules",
          "Availability is highly competitive in premium cabins",
          "Fuel surcharges may apply depending on carrier"
      ],
       // Internal flag to indicate this is a complex, multi-segment sweet spot
       isComplexMultiCity: true
    }
  ],
  "Virgin Atlantic Flying Club": [
    // Sweet spot booked *via* Virgin Atlantic using VS miles for *partner* ANA
    {
      id: "ANA_PREMIUM_VS",
      name: "ANA Premium Cabins via Virgin Atlantic",
      description: "Exceptional value for ANA premium cabins between US/Europe and Japan using Virgin points.",
      type: "airline",
      cabin: ["business", "first"],
      route: ["US", "JP"], // Route filter: Between US and JP (simplified)
      pointsRequired: { // Specific points based on region/cabin (round-trip)
        "Business (West US / Europe)": "90,000 round-trip",
        "Business (East US)": "95,000 round-trip",
        "First (West US / Europe)": "110,000 round-trip",
        "First (East US)": "120,000 round-trip"
      },
      bookVia: "Virgin Atlantic Flying Club", // Program to book with
      transferSources: ["American Express Membership Rewards", "Chase Ultimate Rewards", "Citi ThankYou Rewards"], // Credit card programs that transfer TO Virgin
      valuePerPoint: "4-8¢", // Estimated value range
      searchWindow: "Search up to 355 days in advance when ANA releases space. Book via phone.",
      searchTools: ["United.com (for ANA space)", "ANA website", "ExpertFlyer (paid)"],
      callInstructions: "Call Virgin Atlantic Flying Club at 1-800-365-9500 to book ANA partner awards.",
      bookingLink: "https://www.virginatlantic.com/us/en/flying-club/partners/airlines/all-nippon-airways.html",
      routeOptions: [ // Illustrative direct routes where this is possible
          { origin: "New York (JFK)", destination: "Tokyo (HND/NRT)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "Mix of new ('The Suite' / 'The Room') and classic products." },
          { origin: "Chicago (ORD)", destination: "Tokyo (HND)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "Mix of new ('The Room') and classic products." },
          { origin: "Los Angeles (LAX)", destination: "Tokyo (HND/NRT)", aircraft: "Boeing 777-300ER / 787-9", frequency: "Daily", notes: "Mix of new and classic products." },
          { origin: "San Francisco (SFO)", destination: "Tokyo (NRT)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "Classic product." },
          { origin: "London (LHR)", destination: "Tokyo (HND)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "Features ANA's newest 'The Room' business class on select aircraft."}
      ],
      proTips: [
          "Round-trip bookings are required when booking ANA through Virgin Atlantic.",
          "No fuel surcharges apply to ANA awards booked with Virgin points.",
          "Transfer times from Amex, Chase, Citi to Virgin are usually instant.",
          "Search for 'Saver' level award space on partner sites like United.com.",
          "Availability is competitive, book as soon as space is released (355 days out)."
          ],
      warnings: [
          "Requires phone booking with Virgin Atlantic.",
          "Virgin Atlantic agents may not see all available ANA space - be polite and persistent.",
          "Award space disappears very quickly, especially First Class."
      ],
      valuationRationale: "This redemption offers outstanding value because the cash price for ANA premium cabins is extremely high, while Virgin Atlantic requires significantly fewer points than most other programs for the same flights, with minimal taxes/fees.",
      // Internal flag to indicate round-trip pricing
       isRoundTripPriced: true
    }
     // Add specific LHR-HND guide details if different from US-JP (based on provided code, points match West US/Europe)
     // Keeping it combined under ANA_PREMIUM_VS for simplicity, route options include LHR-HND.

  ],
  "Alaska Airlines Mileage Plan": [
    // Sweet spot booked *via* Alaska Mileage Plan using AS miles for *partner* Cathay Pacific
    {
      id: "CX_PREMIUM_AS",
      name: "Cathay Pacific Premium Cabins via Alaska",
      description: "Excellent value for Cathay Pacific Business/First Class to Asia using Alaska miles, including a free stopover in Hong Kong.",
      type: "airline",
      cabin: ["business", "first"],
      route: ["US", "Asia"], // Route filter: Between US and Asia (via HKG)
      pointsRequired: { // Specific points (one-way)
        "Business (US to Asia)": "50,000 one-way",
        "First (US to Asia)": "70,000 one-way",
        "Business (US to Australia/NZ via HKG)": "60,000 one-way",
        "First (US to Australia/NZ via HKG)": "80,000 one-way"
      },
      bookVia: "Alaska Airlines Mileage Plan",
      transferSources: ["Marriott Bonvoy"], // Credit card programs that transfer TO Alaska
      valuePerPoint: "3-6¢", // Estimated value range
       searchWindow: "Book 10-11 months in advance or 1-2 weeks before departure (last-minute releases). Search partner sites.",
       searchTools: ["British Airways website", "Qantas website", "ExpertFlyer (paid)"],
       callInstructions: "Call Alaska Airlines Mileage Plan at 1-800-252-7522 to book Cathay Pacific partner awards.",
       bookingLink: "https://www.alaskaair.com/content/mileage-plan/how-to-use/award-charts#partners",
       routeOptions: [ // Illustrative routes
          { origin: "New York (JFK)", destination: "Hong Kong (HKG)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "First Class available." },
          { origin: "Los Angeles (LAX)", destination: "Hong Kong (HKG)", aircraft: "Boeing 777-300ER / Airbus A350", frequency: "Daily", notes: "Mix of aircraft, First Class on 777s." },
          { origin: "San Francisco (SFO)", destination: "Hong Kong (HKG)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "First Class available." },
          { origin: "Boston (BOS)", destination: "Hong Kong (HKG)", aircraft: "Airbus A350", frequency: "Daily", notes: "Excellent business class, no First Class on A350." },
          { origin: "Chicago (ORD)", destination: "Hong Kong (HKG)", aircraft: "Boeing 777-300ER", frequency: "Daily", notes: "First Class available."}
       ],
      proTips: [
          "Alaska allows one FREE stopover in Hong Kong even on a one-way award!",
          "You can continue to Southeast Asia, Australia, or New Zealand on the same award for a slightly higher rate.",
          "Search for Oneworld partner space on BA.com or Qantas.com, then call Alaska to book.",
          "Availability is competitive, especially for First Class."
      ],
      warnings: [
          "Requires phone booking with Alaska Airlines.",
          "Marriott Bonvoy is the only major transferable currency partner for Alaska (3:1 ratio)."
      ],
       valuationRationale: "This redemption offers tremendous value due to the low point cost for premium cabins, the included free stopover in Hong Kong, and low taxes/fees.",
       // Internal flag to indicate one-way pricing
       isOneWayPriced: true
    }
     // Add other Alaska sweet spots (e.g. JAL via Alaska)
  ],
  "World of Hyatt": [
      // Sweet spot booked *via* World of Hyatt itself (for hotel stays)
      {
          id: "HYATT_LUXURY",
          name: "Hyatt Luxury Property Redemptions",
          description: "High value redemptions at top-tier Hyatt properties (Category 7 & 8) like Park Hyatt or Alila.",
          type: "hotel",
          cabin: ["luxury", "standard", "premium"], // Applicable categories/tiers (using cabin field loosely)
          route: null, // Not route specific
          pointsRequired: { // Per night, standard rates
              "Category 1": "5,000 pts / night", "Category 2": "8,000 pts / night", "Category 3": "12,000 pts / night", "Category 4": "15,000 pts / night",
              "Category 5": "20,000 pts / night", "Category 6": "25,000 pts / night", "Category 7": "30,000 pts / night", "Category 8": "40,000 pts / night"
              // Add peak/off-peak if needed
          },
          bookVia: "World of Hyatt",
          transferSources: ["Chase Ultimate Rewards"], // Credit card programs that transfer TO Hyatt
          valuePerPoint: "2-5¢+", // Estimated value range (can be very high)
          searchWindow: "Book up to 13 months in advance when the calendar opens. Availability is best outside of peak dates/locations.",
          searchTools: ["Hyatt.com"],
          callInstructions: "Most bookings can be done online. Call Hyatt reservations if you have complex needs or issues.",
          bookingLink: "https://www.hyatt.com/redeem",
          routeOptions: [], // N/A for hotels
          proTips: [
              "World of Hyatt points are highly valuable, often exceeding 2 cents per point.",
              "Chase Ultimate Rewards is the only major 1:1 transfer partner.",
              "Look for Category 7 and 8 properties for the highest potential value.",
              "Availability for standard rooms at top properties is limited."
          ],
          warnings: [
              "Avoid transferring points to Hyatt unless you have a specific high-value redemption in mind.",
              "Cash & Points redemptions can sometimes offer good value too.",
              "Hotel award nights generally do not include resort fees or destination fees - check property details."
          ],
           valuationRationale: "Hyatt points offer exceptional value, particularly at higher-category properties, where the cash price would be very high but the points cost is relatively low.",
      }
      // Add other Hyatt sweet spots (e.g. all-inclusive)
  ]
   // Add sweet spots for other programs (e.g., Aeroplan partners, BA short-haul, etc.)
};


// --- Helper Functions ---

/**
 * Returns all transfer partners for a given credit card program.
 * @param {String} programName - Name of the credit card program.
 * @returns {Array<Object>} - Array of transfer partners with details.
 */
export function getTransferPartners(programName) { // Exporting function for use in calculator
  return transferPartners[programName] || [];
}

/**
 * Returns all transfer options for a specific airline or hotel program
 * (i.e., which card programs transfer IN).
 * @param {String} programName - Name of the airline/hotel program.
 * @returns {Array<Object>} - Array of credit card programs that transfer to this program.
 */
export function getTransferOptions(programName) { // Exporting function for use in calculator
  const options = [];

  Object.entries(transferPartners).forEach(([creditCardProgram, partners]) => {
    const partnerInfo = partners.find(p => p.name === programName);
    if (partnerInfo) {
      options.push({
        program: creditCardProgram, // The program you have points IN
        ratio: partnerInfo.ratio, // The ratio FROM the card program
        transferTime: partnerInfo.transferTime,
        bonusRatio: partnerInfo.bonusRatio, // Potential transfer bonus ratio
        bonusNote: partnerInfo.bonusNote
      });
    }
  });

  return options;
}

/**
 * Finds known sweet spots that match a specific trip criteria.
 * Returns the sweet spot *data* object from the `sweetSpots` structure if a match is found.
 * This is used by RedemptionCalculator and AIInsights/SpecialRedemptionGuide.
 * @param {Object} criteria - Search criteria { origin, destination, cabin, searchType } (IATA codes)
 * @returns {Object | null} - The matching sweet spot data object, or null.
 */
export function findMatchingSweetSpotData(criteria) { // Exporting function
    const { origin, destination, cabin, searchType } = criteria; // Expect IATA codes
    const searchCabin = cabin?.toLowerCase();

    // Iterate through all defined sweet spots in the object structure
    const allSweetSpots = Object.values(sweetSpots).flat(); // Flatten the nested structure

    const matchingSpot = allSweetSpots.find(spot => {
        // 1. Check if the sweet spot type matches the search type (flight/hotel)
        if (spot.type !== searchType) return false;

        // 2. Check Cabin/Category Match (if the sweet spot specifies applicable cabins/categories)
        if (spot.cabin) {
             // For hotels, check if the search cabin matches any allowed "cabin" (category) for the spot
             if (spot.type === 'hotel' && !spot.cabin.includes(searchCabin)) return false;
             // For airlines, check if the search cabin matches any allowed cabin for the spot
             if (spot.type === 'airline' && !spot.cabin.includes(searchCabin)) return false;
        }


        // 3. Check Route Match (if the sweet spot specifies a route filter)
        if (spot.route) {
            let routeMatches = false;
            // Handle specific route formats defined in sweetSpots data
            if (Array.isArray(spot.route) && spot.route.length >= 1) { // Allow route to be a single identifier or pair
                // Simple checks if origin/destination codes contain the route identifiers (simplified)
                routeMatches = spot.route.some(routePart =>
                   origin?.includes(routePart) || destination?.includes(routePart)
                );

                // Add more precise checks for specific common routes if needed, e.g., LHR-HND
                 if (spot.id === "ANA_PREMIUM_VS" || spot.id === "ANA_BUSINESS_LHR_HND_VS") { // US/Europe-Japan check
                      routeMatches = (origin?.includes('JFK') || origin?.includes('LAX') || origin?.includes('SFO') || origin?.includes('ORD') || origin?.includes('LHR')) &&
                                     (destination?.includes('HND') || destination?.includes('NRT'));
                 } else if (spot.id === "CX_PREMIUM_AS") { // US-Asia check
                     routeMatches = (origin?.includes('JFK') || origin?.includes('LAX') || origin?.includes('SFO') || origin?.includes('ORD') || origin?.includes('BOS')) &&
                                    (destination?.includes('HKG') || destination?.includes('SIN') || destination?.includes('BKK') || destination?.includes('NRT'));
                 }
                  // Add checks for other specific routes...

                 if (!routeMatches) return false;
            } else if (typeof spot.route === 'string' && spot.route === 'Round the World (Multi-City)') {
                 // Special handling for RTW. Matches if search criteria implies multi-city (not handled by simple O&D yet).
                 // For this simple O&D search, RTW won't match unless we add complex logic.
                 // Let's assume RTW only matches if the search type was explicitly multi-city (future feature)
                 // or if we add a flag to the searchParams. For now, it won't match simple O&D.
                  routeMatches = false;
            }
            // If route is specified in spot but we couldn't confirm a match, it's not a match.
             if (!routeMatches && spot.route !== null) return false;


        } else {
            // If no route is specified in the sweet spot data, it matches any route for its type/cabin (e.g., Hyatt luxury)
            // This is handled by the type/cabin check above.
        }

        // If we pass all checks, it's a matching sweet spot for the given criteria (type, cabin, and route).
        return true;
    });

    return matchingSpot || null; // Return the found sweet spot object or null
}


// --- Exported Service Functions ---

const TransferPartnersService = {
  getTransferPartners,
  getTransferOptions,
  findMatchingSweetSpotData,
  transferPartners, // Export the raw data (optional, maybe just export functions)
  sweetSpots // Export the raw data (optional)
};

export default TransferPartnersService;