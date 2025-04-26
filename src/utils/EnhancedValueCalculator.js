/**
 * EnhancedValueCalculator.js
 * Advanced algorithm for calculating true point value with consideration for 
 * multiple factors beyond simple cash value / points calculation
 */

/**
 * Calculate the enhanced value per point for a redemption
 * @param {Object} redemption - Redemption details
 * @param {Object} options - Additional calculation options
 * @returns {Object} - Detailed value information
 */
export function calculateEnhancedValue(redemption, options = {}) {
    const {
      program,
      transferFrom,
      pointsRequired,
      cashValue,
      fees = 0,
      cabin,
      origin,
      destination,
      directFlight = true,
      seasonality = 'regular',
      bookingWindow = 'standard'
    } = redemption;
    
    // Base value calculation
    const netCashValue = cashValue - fees;
    const baseValuePerPoint = (netCashValue / pointsRequired) * 100; // in cents
    
    // Calculate adjustments
    const adjustments = calculateValueAdjustments(redemption, options);
    
    // Calculate adjusted value per point
    const adjustedValuePerPoint = baseValuePerPoint * adjustments.totalMultiplier;
    
    // Calculate opportunity cost
    const opportunityCost = calculateOpportunityCost(program, transferFrom);
    
    // Calculate final true value
    const trueValuePerPoint = adjustedValuePerPoint - opportunityCost;
    
    // Get a qualitative rating
    const rating = getValueRating(trueValuePerPoint, program);
    
    return {
      baseValuePerPoint,
      adjustedValuePerPoint,
      trueValuePerPoint,
      rating,
      adjustments,
      opportunityCost,
      programType: getProgramType(program, transferFrom),
      valueBreakdown: {
        cashValue,
        fees,
        netCashValue,
        pointsRequired
      }
    };
  }
  
  /**
   * Calculate value adjustments based on various factors
   * @param {Object} redemption - Redemption details
   * @param {Object} options - Additional calculation options
   * @returns {Object} - Value adjustments and total multiplier
   */
  function calculateValueAdjustments(redemption, options = {}) {
    const {
      program,
      transferFrom,
      cabin,
      origin,
      destination,
      directFlight,
      seasonality,
      bookingWindow
    } = redemption;
    
    const adjustments = {
      // Cabin class adjustment - premium cabins often provide more subjective value
      cabinValue: getCabinValueAdjustment(cabin),
      
      // Direct flight premium - direct flights are more convenient
      directFlightPremium: directFlight ? 1.1 : 1.0,
      
      // Seasonality adjustment - high season redemptions save more money
      seasonalityAdjustment: getSeasonalityAdjustment(seasonality),
      
      // Booking window adjustment - last-minute bookings typically save more money
      bookingWindowAdjustment: getBookingWindowAdjustment(bookingWindow),
      
      // Sweet spot bonus - known high-value redemptions
      sweetSpotBonus: getSweetSpotBonus(program, transferFrom, origin, destination, cabin)
    };
    
    // Calculate total multiplier
    const totalMultiplier = Object.values(adjustments).reduce((a, b) => a * b, 1);
    
    return {
      ...adjustments,
      totalMultiplier
    };
  }
  
  /**
   * Calculate opportunity cost of using points
   * @param {String} program - Loyalty program
   * @param {String} transferFrom - Transfer source program, if applicable
   * @returns {Number} - Opportunity cost in cents per point
   */
  function calculateOpportunityCost(program, transferFrom) {
    // If points were transferred, use the transfer program for opportunity cost
    const programToEvaluate = transferFrom || program;
    
    // Base earning rate for different program types (cashback equivalent)
    const baseEarningRates = {
      airline: 0.1, // 1% back equivalent
      hotel: 0.1,
      card: 0.2    // 2% back equivalent (could have earned cashback instead)
    };
    
    // Program-specific adjustments
    const programAdjustments = {
      "Chase Ultimate Rewards": 1.5,   // Higher opportunity cost due to flexibility
      "American Express Membership Rewards": 1.5,
      "Citi ThankYou Points": 1.25,
      "Capital One Miles": 1.25,
      "World of Hyatt": 0.8,          // Lower opportunity cost due to consistent value
      "Marriott Bonvoy": 1.0,
      "Hilton Honors": 0.8
    };
    
    // Determine program type
    const programType = getProgramType(programToEvaluate);
    
    // Get base rate
    const baseRate = baseEarningRates[programType] || 0.1;
    
    // Apply program-specific adjustment
    const adjustment = programAdjustments[programToEvaluate] || 1.0;
    
    // Calculate opportunity cost in cents per point
    return baseRate * adjustment;
  }
  
  /**
   * Get program type
   * @param {String} program - Program name
   * @param {String} transferFrom - Transfer source program, if applicable
   * @returns {String} - Program type
   */
  function getProgramType(program, transferFrom) {
    // If transferFrom is provided, that's the primary program to evaluate
    const programToCheck = transferFrom || program;
    
    const airlinePrograms = [
      "American Airlines AAdvantage",
      "United MileagePlus",
      "Delta SkyMiles",
      "Southwest Rapid Rewards",
      "Alaska Airlines Mileage Plan",
      "British Airways Executive Club",
      "Air Canada Aeroplan",
      "ANA Mileage Club",
      "Singapore KrisFlyer",
      "Air France-KLM Flying Blue",
      "Virgin Atlantic Flying Club"
    ];
    
    const hotelPrograms = [
      "Marriott Bonvoy",
      "Hilton Honors",
      "World of Hyatt",
      "IHG One Rewards",
      "Wyndham Rewards",
      "Choice Privileges"
    ];
    
    const cardPrograms = [
      "American Express Membership Rewards",
      "Chase Ultimate Rewards",
      "Citi ThankYou Points",
      "Capital One Miles"
    ];
    
    if (airlinePrograms.includes(programToCheck)) return "airline";
    if (hotelPrograms.includes(programToCheck)) return "hotel";
    if (cardPrograms.includes(programToCheck)) return "card";
    
    // Try to infer from program name
    if (programToCheck.includes("Airlines") || 
        programToCheck.includes("Airways") ||
        programToCheck.includes("Miles") ||
        programToCheck.includes("Flying")) {
      return "airline";
    }
    
    if (programToCheck.includes("Hotels") ||
        programToCheck.includes("Resorts") ||
        programToCheck.includes("Bonvoy") ||
        programToCheck.includes("Honors")) {
      return "hotel";
    }
    
    if (programToCheck.includes("Rewards") ||
        programToCheck.includes("Points") ||
        programToCheck.includes("Card")) {
      return "card";
    }
    
    return "other";
  }