/**
 * BookingStrategyService.js
 * Advanced service for calculating optimal multi-program booking strategies
 */

/**
 * Get transfer partners for a credit card program
 * @param {String} programName - Name of the credit card program
 * @returns {Array} - List of transfer partners with ratios
 */
function getTransferPartners(programName) {
    const transferPartnersMap = {
      "American Express Membership Rewards": [
        { name: "Air Canada Aeroplan", type: "airline", ratio: 1.0 },
        { name: "ANA Mileage Club", type: "airline", ratio: 1.0 },
        { name: "British Airways Executive Club", type: "airline", ratio: 1.0 },
        { name: "Delta SkyMiles", type: "airline", ratio: 1.0 },
        { name: "Emirates Skywards", type: "airline", ratio: 1.0 },
        { name: "Etihad Guest", type: "airline", ratio: 1.0 },
        { name: "Singapore KrisFlyer", type: "airline", ratio: 1.0 },
        { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1.0 },
        { name: "Marriott Bonvoy", type: "hotel", ratio: 1.0 },
        { name: "Hilton Honors", type: "hotel", ratio: 1.0 }
      ],
      "Chase Ultimate Rewards": [
        { name: "United MileagePlus", type: "airline", ratio: 1.0 },
        { name: "Southwest Rapid Rewards", type: "airline", ratio: 1.0 },
        { name: "British Airways Executive Club", type: "airline", ratio: 1.0 },
        { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1.0 },
        { name: "Singapore KrisFlyer", type: "airline", ratio: 1.0 },
        { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1.0 },
        { name: "World of Hyatt", type: "hotel", ratio: 1.0 },
        { name: "Marriott Bonvoy", type: "hotel", ratio: 1.0 }
      ],
      "Citi ThankYou Points": [
        { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1.0 },
        { name: "Etihad Guest", type: "airline", ratio: 1.0 },
        { name: "Singapore KrisFlyer", type: "airline", ratio: 1.0 },
        { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1.0 }
      ],
      "Capital One Miles": [
        { name: "Air Canada Aeroplan", type: "airline", ratio: 1.0 },
        { name: "Air France-KLM Flying Blue", type: "airline", ratio: 1.0 },
        { name: "British Airways Executive Club", type: "airline", ratio: 1.0 },
        { name: "Emirates Skywards", type: "airline", ratio: 0.5 },
        { name: "Singapore KrisFlyer", type: "airline", ratio: 0.5 },
        { name: "Virgin Atlantic Flying Club", type: "airline", ratio: 1.0 }
      ]
    };
      
    return transferPartnersMap[programName] || [];
  }
  
  /**
   * Analyzes available loyalty programs and finds the optimal booking strategy
   * for a given trip, potentially using multiple programs for different segments.
   * @param {Object} tripDetails - Details about the trip
   * @param {Array} availablePrograms - User's available loyalty programs and balances
   * @param {Object} preferences - User preferences for the booking
   * @returns {Object} - Optimal booking strategy with steps
   */
  export function findOptimalBookingStrategy(tripDetails, availablePrograms, preferences = {}) {
    const { origin, destination, departDate, returnDate, cabin, passengers } = tripDetails;
    
    // Validate inputs
    if (!origin || !destination || !departDate || !cabin || !availablePrograms?.length) {
      return { error: "Missing required trip or program information" };
    }
    
    // Clone programs to avoid modifying original data
    const programs = JSON.parse(JSON.stringify(availablePrograms));
    
    // Calculate if this is a one-way or round-trip
    const isRoundTrip = returnDate && new Date(returnDate) > new Date(departDate);
    
    // Generate possible booking paths
    const bookingPaths = generateBookingPaths(tripDetails, programs, isRoundTrip);
    
    // Score and rank the booking paths
    const rankedPaths = rankBookingPaths(bookingPaths, preferences);
    
    // Get the top paths
    const optimalPath = rankedPaths[0];
    const alternativePaths = rankedPaths.slice(1, 3); // Get next 2 alternatives
    
    // Generate detailed strategy from the optimal path
    const strategy = generateBookingStrategy(optimalPath, programs, tripDetails);
    
    return {
      optimalStrategy: strategy,
      alternatives: alternativePaths.map(path => generateBookingStrategy(path, programs, tripDetails)),
      valuePerPoint: strategy.valuePerPoint,
      summary: generateStrategySummary(strategy, isRoundTrip)
    };
  }
  
  /**
   * Generates possible booking paths for the trip
   * @param {Object} tripDetails - Details about the trip
   * @param {Array} programs - User's available loyalty programs
   * @param {Boolean} isRoundTrip - Whether the trip is round-trip
   * @returns {Array} - Array of possible booking paths
   */
  function generateBookingPaths(tripDetails, programs, isRoundTrip) {
    const paths = [];
    const { origin, destination, cabin, passengers } = tripDetails;
    
    // 1. Direct redemptions (using a single program for the entire trip)
    programs.forEach(program => {
      // Check if program has enough points
      const requiredPoints = estimateRequiredPoints(program, tripDetails);
      if (requiredPoints <= program.balance) {
        paths.push({
          type: "direct",
          programs: [program],
          segments: [{
            direction: "outbound",
            program: program,
            points: isRoundTrip ? Math.round(requiredPoints / 2) : requiredPoints,
            transferFrom: null
          }],
          ...(isRoundTrip && {
            returnSegment: {
              direction: "return",
              program: program,
              points: Math.round(requiredPoints / 2),
              transferFrom: null
            }
          }),
          totalPoints: requiredPoints,
          fees: estimateFees(program, tripDetails),
          valuePerPoint: calculateValuePerPoint(program, tripDetails)
        });
      }
    });
    
    // 2. Transfer partner redemptions
    programs.forEach(program => {
      if (program.type === 'card') {
        const transferPartners = getTransferPartners(program.name);
        
        transferPartners.forEach(partner => {
          // Find matching airline/hotel program if user has it connected
          const partnerProgram = programs.find(p => p.name === partner.name);
          
          // Calculate required points with transfer ratio
          const requiredPoints = Math.ceil(estimateRequiredPoints(
            partnerProgram || { name: partner.name, type: partner.type }, 
            tripDetails
          ) / partner.ratio);
          
          if (requiredPoints <= program.balance) {
            paths.push({
              type: "transfer",
              programs: [program],
              segments: [{
                direction: "outbound",
                program: partnerProgram || { name: partner.name, type: partner.type },
                points: isRoundTrip ? Math.round(requiredPoints / 2) : requiredPoints,
                transferFrom: {
                  program: program.name,
                  ratio: partner.ratio
                }
              }],
              ...(isRoundTrip && {
                returnSegment: {
                  direction: "return",
                  program: partnerProgram || { name: partner.name, type: partner.type },
                  points: Math.round(requiredPoints / 2),
                  transferFrom: {
                    program: program.name,
                    ratio: partner.ratio
                  }
                }
              }),
              totalPoints: requiredPoints,
              fees: estimateFees(partnerProgram || { name: partner.name, type: partner.type }, tripDetails) + 
                    (partner.transferFee || 0),
              valuePerPoint: calculateValuePerPoint(
                partnerProgram || { name: partner.name, type: partner.type }, 
                tripDetails,
                { transferRatio: partner.ratio }
              )
            });
          }
        });
      }
    });
    
    // 3. Mixed-program redemptions (different programs for outbound and return)
    if (isRoundTrip) {
      for (let i = 0; i < programs.length; i++) {
        for (let j = 0; j < programs.length; j++) {
          if (i !== j && (programs[i].type === 'airline' || programs[i].type === 'card') &&
              (programs[j].type === 'airline' || programs[j].type === 'card')) {
            
            const outboundProgram = programs[i];
            const returnProgram = programs[j];
            
            // Handle outbound and return routes
            const outboundDetails = {
              ...tripDetails,
              returnDate: null
            };
            
            const returnDetails = {
              ...tripDetails,
              origin: tripDetails.destination,
              destination: tripDetails.origin,
              departDate: tripDetails.returnDate,
              returnDate: null
            };
            
            // Calculate outbound redemption
            const outboundRedemption = calculateBestRedemption(outboundProgram, outboundDetails);
            if (!outboundRedemption) continue;
            
            // Calculate return redemption
            const returnRedemption = calculateBestRedemption(returnProgram, returnDetails);
            if (!returnRedemption) continue;
            
            // Create the mixed path
            paths.push({
              type: "mixed",
              programs: [outboundProgram, returnProgram],
              segments: [{
                direction: "outbound",
                program: outboundRedemption.program,
                points: outboundRedemption.points,
                transferFrom: outboundRedemption.transferFrom
              }],
              returnSegment: {
                direction: "return",
                program: returnRedemption.program,
                points: returnRedemption.points,
                transferFrom: returnRedemption.transferFrom
              },
              totalPoints: outboundRedemption.points + returnRedemption.points,
              fees: outboundRedemption.fees + returnRedemption.fees,
              valuePerPoint: calculateWeightedValuePerPoint(
                outboundRedemption, 
                returnRedemption
              )
            });
          }
        }
      }
    }
    
    return paths;
  }
  
  /**
   * Calculate the best redemption option for a program
   * @param {Object} program - Loyalty program
   * @param {Object} tripDetails - Trip details
   * @returns {Object|null} - Best redemption option or null if not possible
   */
  function calculateBestRedemption(program, tripDetails) {
    // Direct airline redemption
    if (program.type === 'airline') {
      const points = estimateRequiredPoints(program, tripDetails);
      if (points <= program.balance) {
        return {
          program: program,
          points: points,
          fees: estimateFees(program, tripDetails),
          valuePerPoint: calculateValuePerPoint(program, tripDetails),
          transferFrom: null
        };
      }
      return null;
    }
    
    // Credit card with transfer partners
    if (program.type === 'card') {
      const transferPartners = getTransferPartners(program.name);
      const airlinePartners = transferPartners.filter(p => p.type === 'airline');
      
      // Find the best transfer partner
      let bestPartner = null;
      let bestValue = 0;
      let bestPoints = 0;
      let bestFees = 0;
      
      for (const partner of airlinePartners) {
        const partnerProgram = { name: partner.name, type: 'airline' };
        const points = Math.ceil(estimateRequiredPoints(partnerProgram, tripDetails) / partner.ratio);
        
        if (points <= program.balance) {
          const fees = estimateFees(partnerProgram, tripDetails);
          const valuePerPoint = calculateValuePerPoint(
            partnerProgram, 
            tripDetails,
            { transferRatio: partner.ratio }
          );
          
          // Check for sweet spots
          let sweetSpotBonus = 0;
          if (isSweetSpot(partnerProgram.name, tripDetails)) {
            sweetSpotBonus = 1;
          }
          
          const totalValue = valuePerPoint + sweetSpotBonus;
          
          if (totalValue > bestValue) {
            bestValue = totalValue;
            bestPartner = partner;
            bestPoints = points;
            bestFees = fees;
          }
        }
      }
      
      if (bestPartner) {
        return {
          program: { name: bestPartner.name, type: 'airline' },
          points: bestPoints,
          fees: bestFees,
          valuePerPoint: bestValue,
          transferFrom: {
            program: program.name,
            ratio: bestPartner.ratio,
            partnerName: bestPartner.name
          }
        };
      }
    }
    
    return null;
  }
  
  /**
   * Calculate weighted value per point for mixed redemptions
   * @param {Object} outbound - Outbound redemption details
   * @param {Object} inbound - Inbound redemption details
   * @returns {Number} - Weighted value per point
   */
  function calculateWeightedValuePerPoint(outbound, inbound) {
    const totalPoints = outbound.points + inbound.points;
    
    if (totalPoints === 0) return 0;
    
    const weightedValue = 
      ((outbound.valuePerPoint * outbound.points) + 
       (inbound.valuePerPoint * inbound.points)) / totalPoints;
    
    return weightedValue;
  }
  
  /**
   * Check if a redemption is a known sweet spot
   * @param {String} program - Loyalty program
   * @param {Object} tripDetails - Trip details
   * @returns {Boolean} - Whether this is a sweet spot
   */
  function isSweetSpot(program, tripDetails) {
    const { origin, destination, cabin } = tripDetails;
    
    // Check for popular sweet spots
    
    // ANA via Virgin Atlantic
    if (program === "Virgin Atlantic Flying Club" && 
        (destination?.includes("TYO") || destination?.includes("NRT") || destination?.includes("HND") ||
         origin?.includes("TYO") || origin?.includes("NRT") || origin?.includes("HND")) &&
        (cabin === "business" || cabin === "first")) {
      return true;
    }
    
    // Cathay Pacific via Alaska
    if (program === "Alaska Airlines Mileage Plan" && 
        (destination?.includes("HKG") || origin?.includes("HKG")) &&
        (cabin === "business" || cabin === "first")) {
      return true;
    }
    
    // Add more sweet spots as needed
    
    return false;
  }
  
  /**
   * Ranks booking paths by various factors
   * @param {Array} paths - Array of booking paths
   * @param {Object} preferences - User preferences
   * @returns {Array} - Ranked array of booking paths
   */
  function rankBookingPaths(paths, preferences = {}) {
    // Apply weights to different factors
    const weights = {
      valuePerPoint: 0.7,
      simplicity: 0.1,
      fees: 0.1,
      highValuePrograms: 0.1,
      ...preferences.weights
    };
    
    // Score each path
    const scoredPaths = paths.map(path => {
      // Value per point score (higher is better)
      const valueScore = (path.valuePerPoint / 5) * weights.valuePerPoint; // Normalize to 0-1 range assuming 5cpp is max
      
      // Simplicity score (direct > transfer > mixed)
      const simplicityScore = 
        path.type === "direct" ? 1 * weights.simplicity :
        path.type === "transfer" ? 0.7 * weights.simplicity :
        0.4 * weights.simplicity;
      
      // Fees score (lower is better)
      const maxFees = 1000; // Assume $1000 as max fees
      const feesScore = (1 - (path.fees / maxFees)) * weights.fees;
      
      // High-value program score (bonus for known high-value redemptions)
      let highValueScore = 0;
      
      // Check if any segments use known sweet spots
      const checkSegment = (segment) => {
        if (!segment) return false;
        
        const programName = segment.transferFrom 
          ? segment.transferFrom.partnerName 
          : segment.program.name;
        
        return programName === "Virgin Atlantic Flying Club" || 
               programName === "Alaska Airlines Mileage Plan" ||
               programName === "Air Canada Aeroplan" ||
               programName === "World of Hyatt";
      };
      
      if (checkSegment(path.segments[0]) || checkSegment(path.returnSegment)) {
        highValueScore = weights.highValuePrograms;
      }
      
      // Calculate total score
      const totalScore = valueScore + simplicityScore + feesScore + highValueScore;
      
      return {
        ...path,
        score: totalScore,
        scoreDetails: {
          valueScore,
          simplicityScore,
          feesScore,
          highValueScore
        }
      };
    });
    
    // Sort by total score (descending)
    return scoredPaths.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Generates a detailed booking strategy from a booking path
   * @param {Object} path - A booking path
   * @param {Array} programs - User's available programs
   * @param {Object} tripDetails - Trip details
   * @returns {Object} - Detailed booking strategy
   */
  function generateBookingStrategy(path, programs, tripDetails) {
    const { cabin, origin, destination } = tripDetails;
    
    const steps = [];
    const usedPrograms = new Set();
    
    // Add transfer steps if needed for outbound
    if (path.segments[0].transferFrom) {
      const sourceProgram = path.segments[0].transferFrom.program;
      const targetProgram = path.segments[0].program.name;
      const transferPoints = path.segments[0].points;
      
      steps.push({
        type: "transfer",
        from: sourceProgram,
        to: targetProgram,
        points: transferPoints,
        ratio: path.segments[0].transferFrom.ratio,
        description: `Transfer ${transferPoints.toLocaleString()} points from ${sourceProgram} to ${targetProgram}`
      });
      
      usedPrograms.add(sourceProgram);
    }
    
    // Add outbound booking step
    steps.push({
      type: "book",
      program: path.segments[0].program.name,
      points: path.segments[0].points,
      route: `${origin} to ${destination}`,
      direction: "outbound",
      cabin: cabin,
      fees: path.type === "direct" ? path.fees / 2 : path.fees / 2,
      description: `Book ${cabin} class from ${origin} to ${destination} using ${path.segments[0].points.toLocaleString()} ${path.segments[0].program.name} points`
    });
    
    usedPrograms.add(path.segments[0].program.name);
    
    // Add return booking step if applicable
    if (path.returnSegment) {
      // Add transfer step for return if needed
      if (path.returnSegment.transferFrom) {
        const sourceProgram = path.returnSegment.transferFrom.program;
        const targetProgram = path.returnSegment.program.name;
        const transferPoints = path.returnSegment.points;
        
        // Only add if we haven't used this program yet (to avoid duplicate transfers)
        if (!usedPrograms.has(sourceProgram)) {
          steps.push({
            type: "transfer",
            from: sourceProgram,
            to: targetProgram,
            points: transferPoints,
            ratio: path.returnSegment.transferFrom.ratio,
            description: `Transfer ${transferPoints.toLocaleString()} points from ${sourceProgram} to ${targetProgram}`
          });
          
          usedPrograms.add(sourceProgram);
        }
      }
      
      steps.push({
        type: "book",
        program: path.returnSegment.program.name,
        points: path.returnSegment.points,
        route: `${destination} to ${origin}`,
        direction: "return",
        cabin: cabin,
        fees: path.fees / 2,
        description: `Book ${cabin} class from ${destination} to ${origin} using ${path.returnSegment.points.toLocaleString()} ${path.returnSegment.program.name} points`
      });
      
      usedPrograms.add(path.returnSegment.program.name);
    }
    
    // Calculate estimated retail value
    const retailValue = estimateFlightCashValue(tripDetails, cabin);
    
    // Sum up the total fees across all steps
    const totalFees = steps.reduce((sum, step) => 
      step.type === "book" ? sum + step.fees : sum, 0);
    
    return {
      type: path.type,
      steps,
      totalPoints: path.totalPoints,
      retailValue,
      cashRequired: totalFees,
      valuePerPoint: path.valuePerPoint,
      pros: generatePros(path, tripDetails),
      cons: generateCons(path, tripDetails)
    };
  }
  
  /**
   * Generate a summary description for the booking strategy
   * @param {Object} strategy - The booking strategy
   * @param {Boolean} isRoundTrip - Whether the trip is round-trip
   * @returns {String} - Summary description
   */
  function generateStrategySummary(strategy, isRoundTrip) {
    const { steps, valuePerPoint, totalPoints, retailValue, cashRequired } = strategy;
    
    let summary = `This ${strategy.type} redemption `;
    
    if (strategy.type === "direct") {
      const programName = steps.find(step => step.type === "book").program;
      summary += `uses ${totalPoints.toLocaleString()} ${programName} points`;
    } 
    else if (strategy.type === "transfer") {
      const fromProgram = steps.find(step => step.type === "transfer").from;
      const toProgram = steps.find(step => step.type === "transfer").to;
      summary += `transfers ${totalPoints.toLocaleString()} ${fromProgram} points to ${toProgram}`;
    }
    else if (strategy.type === "mixed") {
      const outboundStep = steps.find(step => step.type === "book" && step.direction === "outbound");
      const returnStep = steps.find(step => step.type === "book" && step.direction === "return");
      
      summary += `combines ${outboundStep.program} for the outbound flight and ${returnStep.program} for the return`;
    }
    
    summary += `, providing a value of ${valuePerPoint.toFixed(1)}¢ per point.`;
    
    // Add value comparison
    const totalSavings = retailValue - cashRequired;
    const savingsPercentage = Math.round((totalSavings / retailValue) * 100);
    
    summary += ` You're saving ${totalSavings.toLocaleString()} (${savingsPercentage}% off) compared to paying cash.`;
    
    return summary;
  }
  
  /**
   * Generate pros for a booking strategy
   * @param {Object} path - The booking path
   * @param {Object} tripDetails - Trip details
   * @returns {Array} - List of pros
   */
  function generatePros(path, tripDetails) {
    const pros = [];
    
    // Value-based pros
    if (path.valuePerPoint >= 3.0) {
      pros.push("Excellent redemption value (3¢+ per point)");
    } else if (path.valuePerPoint >= 2.0) {
      pros.push("Very good redemption value (2¢+ per point)");
    } else if (path.valuePerPoint >= 1.5) {
      pros.push("Good redemption value (1.5¢+ per point)");
    }
    
    // Simplicity pros
    if (path.type === "direct") {
      pros.push("Simple redemption process with a single program");
    }
    
    // Fee-based pros
    if (path.fees < 100) {
      pros.push("Very low taxes/fees");
    } else if (path.fees < 300) {
      pros.push("Reasonable taxes/fees");
    }
    
    // Sweet spot pros
    const hasAnaVirgin = path.segments.some(segment => 
      segment.program.name === "ANA Mileage Club" || 
      (segment.transferFrom && segment.transferFrom.partnerName === "Virgin Atlantic Flying Club"));
    
    if (hasAnaVirgin && tripDetails.cabin.includes("first")) {
      pros.push("Uses the exceptional ANA First Class sweet spot via Virgin Atlantic");
    } else if (hasAnaVirgin && tripDetails.cabin.includes("business")) {
      pros.push("Uses the high-value ANA Business Class sweet spot via Virgin Atlantic");
    }
    
    return pros;
  }
  
  /**
   * Generate cons for a booking strategy
   * @param {Object} path - The booking path
   * @param {Object} tripDetails - Trip details
   * @returns {Array} - List of cons
   */
  function generateCons(path, tripDetails) {
    const cons = [];
    
    // Value-based cons
    if (path.valuePerPoint < 1.0) {
      cons.push("Below average redemption value");
    }
    
    // Complexity cons
    if (path.type === "transfer") {
      cons.push("Requires transferring points between programs");
      cons.push("Transfer times may vary (typically instant to 3 days)");
    } else if (path.type === "mixed") {
      cons.push("More complex booking process using multiple programs");
      cons.push("Requires separate bookings for each flight segment");
    }
    
    // Fee-based cons
    if (path.fees >= 500) {
      cons.push("High taxes/fees reduce the overall value");
    } else if (path.fees >= 300) {
      cons.push("Moderate taxes/fees");
    }
    
    // Availability cons for certain programs
    const hasLimitedAvailability = path.segments.some(segment => 
      ["ANA Mileage Club", "Singapore KrisFlyer", "Lufthansa Miles & More"].includes(segment.program.name) ||
      (segment.transferFrom && ["ANA Mileage Club", "Singapore KrisFlyer", "Lufthansa Miles & More"].includes(segment.transferFrom.partnerName)));
    
    if (hasLimitedAvailability) {
      cons.push("Award availability may be limited, book well in advance");
    }
    
    return cons;
  }
  
  /**
   * Estimates required points for a given program and trip
   * @param {Object} program - Loyalty program
   * @param {Object} tripDetails - Trip details
   * @returns {Number} - Estimated points required
   */
  function estimateRequiredPoints(program, tripDetails) {
    const { cabin, origin, destination } = tripDetails;
    
    // Base points by cabin class
    const basePoints = {
      economy: 25000,
      premium: 40000,
      business: 60000,
      first: 85000
    };
    
    // Get base points for cabin
    const cabinBasePoints = basePoints[cabin.toLowerCase()] || basePoints.economy;
    
    // Distance multiplier (simplified - would use actual distance in real app)
    const distance = estimateDistance(origin, destination);
    let distanceMultiplier = 1;
    
    if (distance < 2000) distanceMultiplier = 0.7;      // Short haul
    else if (distance < 5000) distanceMultiplier = 1;   // Medium haul
    else if (distance < 8000) distanceMultiplier = 1.5; // Long haul
    else distanceMultiplier = 2;                        // Ultra long haul
    
    // Program-specific multipliers
    const programMultipliers = {
      "American Airlines AAdvantage": 1.1,
      "United MileagePlus": 1.2,
      "Delta SkyMiles": 1.3,
      "Virgin Atlantic Flying Club": 0.8,
      "Alaska Airlines Mileage Plan": 1.0,
      "British Airways Executive Club": 1.3,
      "ANA Mileage Club": 0.9,
      "Singapore KrisFlyer": 1.0,
      "Air Canada Aeroplan": 1.0,
      "World of Hyatt": 0.9,
      "Marriott Bonvoy": 1.4,
      "Hilton Honors": 2.5
    };
    
    const programMultiplier = programMultipliers[program.name] || 1;
    
    // Sweet spot adjustments
    let sweetSpotAdjustment = 1;
    
    // ANA bookings via Virgin have special sweet spot pricing
    if (program.name === "Virgin Atlantic Flying Club" && 
        ((origin?.includes("US") && destination?.includes("JP")) || 
         (origin?.includes("JP") && destination?.includes("US")))) {
      sweetSpotAdjustment = 0.7;
    }
    
    // Calculate points
    const points = Math.round(cabinBasePoints * distanceMultiplier * programMultiplier * sweetSpotAdjustment);
    
    // If round-trip, double the points (simplified)
    const isRoundTrip = tripDetails.returnDate && new Date(tripDetails.returnDate) > new Date(tripDetails.departDate);
    return isRoundTrip ? points * 2 : points;
  }
  
  /**
   * Estimates distance between two locations
   * @param {String} origin - Origin location
   * @param {String} destination - Destination location
   * @returns {Number} - Estimated distance in miles
   */
  function estimateDistance(origin, destination) {
    // This is a simplified estimation - in a real app we would use a proper distance calculator
    // For now we'll use a lookup table of common routes
    
    const routeDistances = {
      "JFK-LHR": 3451,
      "LHR-JFK": 3451,
      "LAX-NRT": 5451,
      "NRT-LAX": 5451,
      "SFO-HKG": 6927,
      "HKG-SFO": 6927,
      "ORD-FRA": 4340,
      "FRA-ORD": 4340
    };
    
    const routeKey = `${origin}-${destination}`;
    
    if (routeDistances[routeKey]) {
      return routeDistances[routeKey];
    }
    
    // Fallback - use a simple classification based on regions
    if (origin?.includes("US") && destination?.includes("US")) {
      return 1500; // Domestic US (medium)
    }
    
    if ((origin?.includes("US") && destination?.includes("EU")) ||
        (origin?.includes("EU") && destination?.includes("US"))) {
      return 4500; // Transatlantic
    }
    
    if ((origin?.includes("US") && (destination?.includes("JP") || destination?.includes("CN") || destination?.includes("HK"))) ||
        ((origin?.includes("JP") || origin?.includes("CN") || origin?.includes("HK")) && destination?.includes("US"))) {
      return 6500; // Transpacific
    }
    
    return 3000; // Default - medium-haul international
  }
  
  /**
   * Estimates taxes and fees for a booking
   * @param {Object} program - Loyalty program
   * @param {Object} tripDetails - Trip details
   * @returns {Number} - Estimated fees in USD
   */
  function estimateFees(program, tripDetails) {
    // Base fees by program
    const baseFees = {
      "American Airlines AAdvantage": 5.60,
      "United MileagePlus": 5.60,
      "Delta SkyMiles": 5.60,
      "Virgin Atlantic Flying Club": 50,
      "Alaska Airlines Mileage Plan": 5.60,
      "British Airways Executive Club": 150,
      "ANA Mileage Club": 50,
      "Singapore KrisFlyer": 50,
      "Air Canada Aeroplan": 40,
      "World of Hyatt": 0,
      "Marriott Bonvoy": 0,
      "Hilton Honors": 0
    };
    
    const baseFee = baseFees[program.name] || 30;
    
    // Surcharges for specific programs and routes
    let surcharge = 0;
    
    // British Airways has high surcharges on many routes
    if (program.name === "British Airways Executive Club") {
      if (tripDetails.origin?.includes("LHR") || tripDetails.destination?.includes("LHR")) {
        surcharge += 200;
      } else {
        surcharge += 100;
      }
    }
    
    // Add airport fees and taxes (simplified)
    const originFees = 30;
    const destinationFees = 30;
    
    // Add round-trip multiplier
    const isRoundTrip = tripDetails.returnDate && new Date(tripDetails.returnDate) > new Date(tripDetails.departDate);
    const tripMultiplier = isRoundTrip ? 1.8 : 1; // Not quite doubling fees for round-trip
    
    return Math.round((baseFee + surcharge + originFees + destinationFees) * tripMultiplier);
  }
  
  /**
   * Estimate flight cash value
   * @param {Object} tripDetails - Trip details
   * @param {String} cabin - Cabin class
   * @returns {Number} - Estimated cash value
   */
  function estimateFlightCashValue(tripDetails, cabin) {
    // Base price ranges by cabin class (very simplified model)
    const basePriceRanges = {
      economy: { short: 200, medium: 500, long: 1000, ultraLong: 1500 },
      premium: { short: 400, medium: 900, long: 1800, ultraLong: 2800 },
      business: { short: 800, medium: 2500, long: 4500, ultraLong: 7000 },
      first: { short: 1500, medium: 4500, long: 8000, ultraLong: 12000 }
    };
    
    // Determine flight category based on distance
    const distance = estimateDistance(tripDetails.origin, tripDetails.destination);
    let category;
    
    if (distance < 2000) category = 'short';
    else if (distance < 5000) category = 'medium';
    else if (distance < 8000) category = 'long';
    else category = 'ultraLong';
    
    // Get base price
    const cabinLower = cabin.toLowerCase();
    const basePrice = (basePriceRanges[cabinLower] || basePriceRanges.economy)[category];
    
    // Add seasonal multiplier (simplified)
    const seasonalMultiplier = 1.2; // Assume high season
    
    // Apply round-trip multiplier
    const isRoundTrip = tripDetails.returnDate && new Date(tripDetails.returnDate) > new Date(tripDetails.departDate);
    const tripMultiplier = isRoundTrip ? 1.8 : 1; // Not quite doubling price for round-trip
    
    return Math.round(basePrice * seasonalMultiplier * tripMultiplier);
  }
  
  /**
   * Calculate value per point for a redemption
   * @param {Object} program - Loyalty program
   * @param {Object} tripDetails - Trip details
   * @param {Object} options - Additional options
   * @returns {Number} - Value per point in cents
   */
  function calculateValuePerPoint(program, tripDetails, options = {}) {
    const cashValue = estimateFlightCashValue(tripDetails, tripDetails.cabin);
    const requiredPoints = estimateRequiredPoints(program, tripDetails);
    const fees = estimateFees(program, tripDetails);
    
    const { transferRatio = 1 } = options;
    
    // Adjust points if transferred
    const effectivePoints = requiredPoints / transferRatio;
    
    // Calculate value: (cash value - fees) / points * 100 for cents per point
    const valuePerPoint = ((cashValue - fees) / effectivePoints) * 100;
    
    return isFinite(valuePerPoint) && valuePerPoint > 0 ? valuePerPoint : 0;
  }
  
  export default {
    findOptimalBookingStrategy,
    getTransferPartners,
    estimateRequiredPoints,
    calculateValuePerPoint,
    estimateFlightCashValue,
    estimateFees
  };