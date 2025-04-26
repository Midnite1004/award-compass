// src/components/AIInsights.js

import React, { useState } from "react";
import {
  FaInfoCircle,
  FaChartLine,
  FaStar,
  FaLightbulb,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCalendarAlt, // Used in guidance
  FaSearch, // Used in guidance
  FaPlane,
  FaMoneyBillWave
} from "react-icons/fa";

// Import utility functions for formatting and rating
import { formatValueWithRating, formatCurrency, formatPoints } from '../utils/redemptionValueUtils';

/**
 * AIInsights Component
 * Displays analysis and guidance for a single redemption option.
 * Receives structured redemption data from the parent (OptimizationResults).
 */
const AIInsights = ({
  redemptionData,
  centsPerPoint,
  totalPoints,
  cashRequired,
  retailValue
}) => {
  const [activeTab, setActiveTab] = useState("analysis");
  const [showValueDetails, setShowValueDetails] = useState(false);

  // Use optional chaining and nullish coalescing for safety
  // Check if essential data for analysis is available
  if (!redemptionData || typeof redemptionData.centsPerPoint !== 'number' || !isFinite(redemptionData.centsPerPoint)) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="text-gray-500 text-center">
          <FaExclamationTriangle className="text-yellow-500 text-xl mx-auto mb-2" />
          <p className="text-sm">Insufficient data to analyze this redemption.</p>
        </div>
      </div>
    );
  }

  // Destructure only what we use
  const {
    pointsRequired,
    taxesFees,
    savings,
    type,
    isSweetSpot,
    sweetSpotDetails
  } = redemptionData;

   // Get value rating using the utility function
  const valueRating = formatValueWithRating(centsPerPoint);

  // Generate AI analysis summary and recommendation
  const analysis = generateAnalysisSummary(redemptionData, centsPerPoint, valueRating); // Uses pre-calculated pros/cons

  // Generate booking guidance using the redemption data
  const bookingGuidance = generateBookingGuidance(redemptionData); // Uses sweetSpotDetails if available


  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <FaLightbulb className="text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-800">AI Insights</h3>
      </div>

      {/* Value summary card */}
      <div className="p-4">
        <div className="bg-blue-50 rounded-lg p-3 flex items-start">
          <div className="bg-white rounded-full p-2 mr-3 shadow-sm flex-shrink-0"> {/* Added flex-shrink */}
            <FaChartLine className={`${valueRating.colorClass} text-lg`} />
          </div>
          <div>
            <div className="flex items-center">
              <span className={`font-bold text-lg ${valueRating.colorClass}`}>
                {centsPerPoint.toFixed(1)}¢/pt {/* Use centsPerPoint */}
              </span>
              <span className="ml-2 text-sm font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
                {valueRating.rating.charAt(0).toUpperCase() + valueRating.rating.slice(1)} {/* Capitalized label */}
              </span>
              {/* Tooltip for CPP Guide */}
              <div className="ml-2 relative group">
                <FaInfoCircle className="text-blue-500 cursor-pointer text-sm" /> {/* Adjusted size */}
                <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 text-xs right-0 transform translate-x-1/4 -translate-y-full bottom-full"> {/* Adjusted positioning and size */}
                  <h4 className="font-medium text-gray-800 mb-2">Cents Per Point Guide</h4>
                  <div className="space-y-1">
                    {/* Use thresholds from formatValueWithRating logic */}
                    <div className="flex justify-between text-xs"><span className="text-red-600">Poor:</span><span>0.3¢-0.59¢</span></div>
                    <div className="flex justify-between text-xs"><span className="text-yellow-600">Average:</span><span>0.6¢-0.99¢</span></div>
                    <div className="flex justify-between text-xs"><span className="text-blue-600">Good:</span><span>1.0¢-1.49¢</span></div>
                    <div className="flex justify-between text-xs"><span className="text-green-600">Great:</span><span>1.5¢-2.49¢</span></div>
                    <div className="flex justify-between text-xs"><span className="text-purple-600">Excellent:</span><span>2.5¢+</span></div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1">{analysis.summary}</p> {/* Use summary from analysis */}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px"> {/* Negative margin to align border */}
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'analysis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>

            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'booking' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('booking')}
            >
              Booking Guidance
            </button>

             {/* Only show Sweet Spot tab if the redemption is flagged as one and details exist */}
            {isSweetSpot && sweetSpotDetails && (
              <button
                className={`px-4 py-2 whitespace-nowrap font-medium text-sm ${activeTab === 'sweet' ? 'text-yellow-800 border-b-2 border-yellow-500' : 'text-yellow-700 hover:text-yellow-800'}`}
                onClick={() => setActiveTab('sweet')}
            >
              Sweet Spot
            </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {/* Key Factors */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Value Factors</h4>
                <div className="space-y-2">
                  {analysis.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start bg-gray-50 p-2 rounded">
                      <div className={`flex-shrink-0 rounded-full p-1 ${factor.positive ? 'bg-green-100' : 'bg-red-100'} mr-2`}>
                        {factor.positive ?
                          <FaCheck className="text-green-600 text-xs" /> :
                          <FaTimes className="text-red-600 text-xs" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{factor.name}</p> {/* Added text color */}
                        <p className="text-xs text-gray-600 mt-0.5">{factor.description}</p> {/* Added margin */}
                      </div>
                    </div>
                  ))}
                   {analysis.factors.length === 0 && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">No specific factors identified for this redemption.</p>}
                </div>
              </div>

              {/* Value Details Toggle */}
              <div> {/* Wrap in div for consistent spacing */}
                  <button
                      className="flex items-center text-blue-600 text-sm hover:underline" // Added hover underline
                      onClick={() => setShowValueDetails(!showValueDetails)}
                  >
                      {showValueDetails ? 'Hide' : 'Show'} Value Calculation Details
                      {showValueDetails ? <FaChevronUp className="ml-1 text-xs" /> : <FaChevronDown className="ml-1 text-xs" />} {/* Adjusted size */}
                  </button>
              </div>


              {/* Value Guide and Details */}
              {showValueDetails && (
                  <div className="space-y-4 mt-4"> {/* Added margin top */}
                      {/* Value Calculation Details */}
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                          <div className="grid grid-cols-2 gap-1">
                              <div className="text-gray-600">Estimated Cash Value:</div> {/* Clarified label */}
                              <div className="text-right font-medium text-gray-900">{formatCurrency(retailValue)}</div>

                              <div className="text-gray-600">Estimated Taxes & Fees:</div> {/* Clarified label */}
                              <div className="text-right font-medium text-gray-900">{formatCurrency(taxesFees)}</div>

                              <div className="text-gray-600">Net Value Offset:</div> {/* Clarified label */}
                              <div className="text-right font-medium text-gray-900">{formatCurrency(retailValue - taxesFees)}</div>

                              <div className="text-gray-600">Points Required:</div>
                              <div className="text-right font-medium text-gray-900">{formatPoints(pointsRequired)}</div> {/* Use formatPoints */}

                              <div className="border-t border-gray-200 pt-1 mt-1 text-gray-600 font-medium">Value Per Point:</div> {/* Added font-medium */}
                              <div className="border-t border-gray-200 pt-1 mt-1 text-right font-bold text-gray-900">{centsPerPoint.toFixed(1)}¢</div> {/* Bold the value */}
                          </div>
                      </div>
                  </div>
              )}


              {/* AI Recommendation */}
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-medium text-blue-800 mb-1">Recommendation</h4>
                <p className="text-sm text-blue-700">{analysis.recommendation}</p>
              </div>
            </div>
          )}

          {/* Booking Guidance Tab */}
          {activeTab === 'booking' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center"><FaCalendarAlt className="mr-2" /> Booking Timeline</h4> {/* Added icon */}
                <p className="text-sm text-blue-700">{bookingGuidance.timeline || 'Check airline website frequently for availability.'}</p> {/* Fallback text */}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2 flex items-center"><FaSearch className="mr-2" /> Best Ways to Search & Book</h4> {/* Added icon */}
                 {bookingGuidance.bookingMethods.length > 0 ? (
                     <ol className="space-y-3 list-decimal list-inside text-gray-700 text-sm"> {/* Use ordered list */}
                       {bookingGuidance.bookingMethods.map((method, idx) => (
                          // Render list items directly
                          <li key={idx}><span className="font-medium">{method.title}:</span> {method.description}</li>
                       ))}
                     </ol>
                 ) : (
                     <p className="text-sm text-gray-600">Specific booking steps not available. Check the program's website.</p>
                 )}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2 flex items-center"><FaStar className="mr-2" /> Pro Tips</h4> {/* Added icon */}
                <ul className="space-y-2 list-disc list-inside text-gray-700 text-sm"> {/* Use unordered list */}
                  {bookingGuidance.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                   {bookingGuidance.tips.length === 0 && <li className="text-gray-600">No specific tips for this redemption.</li>}
                </ul>
              </div>

              {bookingGuidance.warnings.length > 0 && (
                <div className="bg-red-50 p-3 rounded">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center"><FaExclamationTriangle className="mr-2" /> Watch Out For</h4> {/* Added icon */}
                  <ul className="space-y-2 list-disc list-inside text-red-700 text-sm"> {/* Use unordered list */}
                    {bookingGuidance.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sweet Spot Tab */}
           {activeTab === 'sweet' && isSweetSpot && sweetSpotDetails && ( // Ensure details exist
               <div className="space-y-4">
                   <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                       <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                           <FaStar className="text-yellow-500 mr-2" /> {sweetSpotDetails.name}
                       </h4>
                       <p className="text-sm text-yellow-700">{sweetSpotDetails.description}</p>
                   </div>

                   <div>
                       <h4 className="font-medium text-gray-700 mb-2">Why It's a Sweet Spot</h4>
                        {sweetSpotDetails.reasons && sweetSpotDetails.reasons.length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside text-gray-700 text-sm"> {/* Use unordered list */}
                              {sweetSpotDetails.reasons.map((reason, idx) => (
                                 <li key={idx}>{reason}</li>
                              ))}
                           </ul>
                        ) : (
                             <p className="text-sm text-gray-600">Reasons for this sweet spot not available.</p>
                        )}
                   </div>

                   {sweetSpotDetails.keyInfo && sweetSpotDetails.keyInfo.length > 0 && (
                       <div>
                           <h4 className="font-medium text-gray-700 mb-2">Key Information</h4>
                           <div className="bg-white p-3 rounded border border-gray-200 space-y-3 text-sm text-gray-700">
                             {sweetSpotDetails.keyInfo.map((info, idx) => (
                               <div key={idx} className="grid grid-cols-2 gap-1"> {/* Use grid for layout */}
                                 <div className="font-medium text-gray-600">{info.label}:</div> {/* Use font-medium */}
                                 <div>{info.value}</div>
                               </div>
                             ))}
                           </div>
                       </div>
                   )}
                   {/* Link to the dedicated guide component toggle could go here */}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Functions (Simplified AI Logic) ---
// These are internal helpers for AIInsights, distinct from the calculation logic

// Determine value rating based on cents per point (Using the utility function)
// function getValueRating(valuePerPoint) { ... moved to redemptionValueUtils.js }

// Generate analysis summary and factors
// Uses pre-calculated pros/cons from the RedemptionCalculator result object
function generateAnalysisSummary(redemptionData, valuePerPoint, valueRating) {
    const { program, transferFrom, isSweetSpot, sweetSpotDetails, cashValue, fees, pros, cons, hasEnoughPoints, pointsRequired, userBalance } = redemptionData;
    const netValue = cashValue - fees;

    let summary = '';
    let recommendation = '';
    const factors = [];

    // Generate summary based on value rating and sweet spot flag
    if (isSweetSpot) {
        const spotName = sweetSpotDetails?.name || 'a known sweet spot';
        summary = `This is ${spotName}! Your redemption at ${valuePerPoint.toFixed(1)}¢ per point confirms its exceptional value.`;
    } else {
        if (valueRating.rating === 'excellent') {
            summary = `This ${program} redemption offers excellent value at ${valuePerPoint.toFixed(1)}¢ per point, significantly above average.`;
        } else if (valueRating.rating === 'great') {
            summary = `This ${program} redemption offers great value at ${valuePerPoint.toFixed(1)}¢ per point, better than average.`;
        } else if (valueRating.rating === 'good') {
            summary = `This ${program} redemption provides good value at ${valuePerPoint.toFixed(1)}¢ per point, around the standard baseline.`;
        } else if (valueRating.rating === 'average') {
            summary = `This ${program} redemption offers average value at ${valuePerPoint.toFixed(1)}¢ per point.`;
        } else { // poor
            summary = `This ${program} redemption offers below-average value at ${valuePerPoint.toFixed(1)}¢ per point.`;
        }
    }

    // Generate recommendation based on value rating and user balance
     if (!hasEnoughPoints) {
         const pointsNeeded = pointsRequired - userBalance;
         recommendation = `You need ${formatPoints(pointsNeeded)} more points for this redemption. Consider earning more points, or finding alternative options you have enough points for.`;
     } else if (isSweetSpot) {
         recommendation = `This is a highly recommended redemption due to its exceptional value as a sweet spot. Book now if it fits your travel plans.`;
     } else if (valueRating.rating === 'excellent') {
         recommendation = `This is an excellent use of your points. We highly recommend booking if it fits your travel plans.`;
     } else if (valueRating.rating === 'great') {
         recommendation = `This redemption offers great value. Recommended if it fits your travel needs.`;
     } else if (valueRating.rating === 'good') {
         recommendation = `This is a reasonable use of your points if it fits your travel needs. You're not getting outsized value, but it's not a poor redemption either.`;
     } else if (valueRating.rating === 'average') {
         recommendation = `This redemption offers average value. Consider if you want to save points for higher value or pay cash.`;
     } else { // poor
         recommendation = `This redemption offers below-average value. Paying cash might be a better option unless points are expiring or you have a large surplus.`;
     }

    // Convert pros/cons lists into factor objects for display
    if (pros && pros.length > 0) {
        pros.forEach(p => factors.push({ name: p, description: '', positive: true })); // Simplified: use pro string as name/description
    }
     if (cons && cons.length > 0) {
        cons.forEach(c => factors.push({ name: c, description: '', positive: false })); // Simplified
    }


    // Sort factors to show positive ones first
    factors.sort((a, b) => b.positive - a.positive);


    return {
      summary,
      recommendation,
      factors,
      sweetSpotDetails // Pass sweet spot details to the analysis result structure
    };
}

// Generate booking guidance details
// Uses pre-fetched sweetSpotDetails if available in the redemption object
function generateBookingGuidance(redemptionData) {
  const {
    program,
    transferFrom,
    sweetSpotDetails, // Details object from calculator
    transferTime,
    transferRatio,
    tripDetails // Contains origin, destination, cabin etc.
  } = redemptionData;

  let timeline = '';
  const bookingMethods = [];
  const tips = [];
  const warnings = [];
  let bookingLink = null;

   const { origin, destination, cabin } = tripDetails; // Get trip details for context


   // Use sweet spot details if available, otherwise provide general guidance
   if (sweetSpotDetails) {
       timeline = sweetSpotDetails.searchWindow || 'Check airline website frequently.';
       if (sweetSpotDetails.searchTools && sweetSpotDetails.searchTools.length > 0) {
           sweetSpotDetails.searchTools.forEach(tool => {
               bookingMethods.push({ title: `${tool}`, description: `Recommended search tool for ${sweetSpotDetails.program} availability.` });
           });
       } else {
           bookingMethods.push({ title: `Search on ${sweetSpotDetails.bookVia || sweetSpotDetails.program} website`, description: 'Use the program\'s website to search for award availability.' });
       }

       if (sweetSpotDetails.callInstructions) {
           bookingMethods.push({ title: 'Phone Booking Required', description: sweetSpotDetails.callInstructions });
       } else if (sweetSpotDetails.bookVia) {
           // Assume online booking is primary unless specified otherwise
           bookingMethods.push({ title: `Book online via ${sweetSpotDetails.bookVia}`, description: 'Complete your award booking on the program\'s website.' });
       }


       if (sweetSpotDetails.proTips && sweetSpotDetails.proTips.length > 0) {
           tips.push(...sweetSpotDetails.proTips);
       }
       if (sweetSpotDetails.warnings && sweetSpotDetails.warnings.length > 0) {
           warnings.push(...sweetSpotDetails.warnings);
       }
       bookingLink = sweetSpotDetails.bookingLink;

   } else {
      // --- General Airline Booking Guidance ---
      if (redemptionData.programType === 'airline') { // Check based on program type
        timeline = 'For best availability in premium cabins, book 6-11 months in advance or check 1-2 weeks before departure for last-minute openings. For economy, availability is usually better closer in.';

        bookingMethods.push(
          {
            title: `Search on ${program} website`,
            description: 'Look for "Saver" or lowest level awards for best value.'
          }
        );

        // Suggest partner search tools based on program (simplified heuristic)
         if (program.includes('United') || program.includes('Lufthansa') || program.includes('Singapore') || program.includes('Air Canada') || program.includes('ANA')) {
             bookingMethods.push({ title: 'Search on United.com', description: 'Useful for searching Star Alliance partner availability (don\'t log in).' });
         } else if (program.includes('American') || program.includes('British') || program.includes('Cathay') || program.includes('Japan Airlines')) {
             bookingMethods.push({ title: 'Search on British Airways website', description: 'Useful for searching OneWorld partner availability (requires free account).' });
         } else if (program.includes('Delta') || program.includes('Air France-KLM')) {
             bookingMethods.push({ title: 'Search on Air France/KLM website', description: 'Useful for searching SkyTeam partner availability.' });
         }


        tips.push(
          'Be flexible with dates and times to find more availability.',
          'Tuesday and Wednesday typically have better award availability.',
          'Check nearby airports for more options.',
          'Mixed cabin itineraries can sometimes offer better availability (e.g., business on one segment, economy on another).'
        );

        warnings.push(
          'Award availability can change frequently - book promptly when you find what you want.',
          'Taxes and fees vary significantly by airline and route.',
          'Change and cancellation policies vary by program and fare type - review before booking.'
        );

         // Basic guess for booking link
         bookingLink = `https://www.${program.replace(/\s+/g, '').toLowerCase()}.com/redeem/`;

          // Add phone booking note for programs often requiring it for partners
          if (program === 'Alaska Airlines Mileage Plan' || program === 'British Airways Executive Club' || program === 'ANA Mileage Club') {
              if (!transferFrom) { // If booking directly with these programs
                   bookingMethods.push({ title: 'May Require Phone Call', description: `Complex or partner awards with ${program} often require calling reservations.` });
                   warnings.push(`Booking partner awards with ${program} may require calling their phone line.`);
              } else if (transferFrom === 'Marriott Bonvoy' && program === 'Alaska Airlines Mileage Plan') { // Specific partner booking note
                   bookingMethods.push({ title: 'Book via Phone', description: `Cathay Pacific awards booked via Alaska require calling Alaska Airlines.` });
              }
          }


      }
       // --- General Hotel Booking Guidance ---
      else if (redemptionData.programType === 'hotel') {
          timeline = 'Availability varies by property and season. Book popular properties or peak dates well in advance (as soon as the calendar opens).';
          bookingMethods.push({
              title: `Search and book on ${program} website`,
              description: 'Use the "Use Points" or "Awards" option when searching for hotel stays.'
          });
           tips.push(
               'Look for standard room awards for best value.',
               'Consider combining points and cash options if available.',
               'Check for "5th night free" benefits offered by some programs (Marriott, Hilton, IHG) when booking 5 or more consecutive nights.',
               'Be flexible with dates and room types.'
           );
           warnings.push(
               'Some properties may charge resort fees or other taxes even on points stays - check the booking details carefully.',
               'Availability can be limited during peak season or at popular destinations.'
           );
           // Basic guess for booking link
           bookingLink = `https://www.${program.replace(/\s+/g, '').toLowerCase()}.com/points/redeem/`;
      }

       // --- Transfer Guidance if applicable ---
       if(transferFrom){
            const transferTitle = `Transfer points from ${transferFrom}`;
            const transferDesc = `Initiate the transfer from your ${transferFrom} account to your ${program} account.`;
            if(transferTime?.toLowerCase() === 'instant'){
                 bookingMethods.unshift({title: `${transferTitle} (Instant)`, description: `${transferDesc} This transfer is typically instant, but confirm space before transferring.`}); // Add to the start
            } else {
                 bookingMethods.unshift({title: `${transferTitle} (${transferTime})`, description: `${transferDesc} Estimated transfer time is ${transferTime}. Wait for points to arrive before booking.`}); // Add to the start
                 warnings.unshift(`Point transfer from ${transferFrom} to ${program} may take up to ${transferTime}. Confirm award availability *before* transferring points, as space may disappear while you wait.`);
            }
       }

   }


  return {
    timeline,
    bookingMethods,
    tips,
    warnings,
    bookingLink // Include booking link in guidance
  };
}


export default AIInsights;