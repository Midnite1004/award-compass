// src/components/SpecialRedemptionGuide.js

import React, { useEffect } from 'react';
import { 
  FaStar, 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaSearch, 
  FaPhone, 
  FaExternalLinkAlt, 
  FaPlane, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import TransferPartnersService from '../utils/TransferPartnersService';

/**
 * SpecialRedemptionGuide Component
 * Displays detailed guidance for a specific sweet spot if one is matched.
 * Receives parameters to identify the sweet spot (program, transferPartner, cabin, origin, destination).
 * Looks up detailed data from TransferPartnersService.
 */
const SpecialRedemptionGuide = ({ 
  program,
  transferPartner,
  cabin,
  origin,
  destination,
  sweetSpotData 
}) => {
  const [activeSection, setActiveSection] = React.useState('overview');
  const [guideData, setGuideData] = React.useState(null); // State to hold the guide data

   // Find the relevant guide data on component mount or props change
   React.useEffect(() => {
       // The SpecialRedemptionGuide component is triggered when a *calculated* redemption is
       // flagged as a sweet spot by the RedemptionCalculator.
       // The calculator passes the 'isSweetSpot' flag and 'sweetSpotDetails' object.
       // However, this component is designed to *find* the guide data itself based on trip criteria.
       // Let's simplify: If the parent (OptimizationResults) passes the sweetSpotDetails, use that directly.
       // Otherwise, use the lookup function based on the props (less ideal, relies on duplicate lookup).
       // Let's assume the parent passes the sweetSpotDetails via a prop named `sweetSpotDetails`.

       // Re-evaluating: The SpecialRedemptionGuide receives program, transferPartner, cabin, origin, destination
       // It should use these to find the *detailed guide data* from TransferPartnersService.sweetSpots.
       // The RedemptionCalculator only passes a simple flag and potentially the sweet spot ID.
       // So, we need the lookup function here.

       // The findMatchingSweetSpotData function from the service finds the *core* sweet spot data.
       // We need to enhance that data here with the UI-specific fields like `title`, `valueRange`, `bookVia`, `transferPartners`, `valuationRationale`, `routeOptions`, `searchWindow`, `searchTools`, `callInstructions`, `bookingLink`, `proTips`, `warnings`.
       // The service's `sweetSpots` object already contains most of this detailed data.
       // So, the lookup needs to find the correct entry within the service's `sweetSpots` structure.

       const searchCriteria = {
           origin: origin, // IATA code
           destination: destination, // IATA code
           cabin: cabin?.toLowerCase(),
           // We need to match the sweet spot based on which program booked it (`program` prop)
           // and potentially where the points came from (`transferPartner` prop)
           // and the specific route/cabin.
       };

       // Iterate through the sweetSpots data structure from the service to find a match
       const allSweetSpotsEntries = Object.entries(TransferPartnersService.sweetSpots);
       let foundGuideData = null;

       for (const [bookingProgramKey, sweetSpotsForProgram] of allSweetSpotsEntries) {
           const matchedSpot = sweetSpotsForProgram.find(spot => {
                // Does this spot match the booking program?
               if (spot.bookVia !== program) return false;

               // Does this spot match the cabin?
               if (spot.cabin && !spot.cabin.includes(cabin)) return false;

               // Does this spot match the route? (Simplified check matching the service's find logic)
               if (spot.route) {
                    let routeMatches = false;
                    if (Array.isArray(spot.route) && spot.route.length >= 1) { // Allow route to be a single identifier or pair
                        routeMatches = spot.route.some(routePart =>
                           origin?.includes(routePart) || destination?.includes(routePart)
                        );
                        // Add specific overrides for known sweet spot IDs if needed
                        if (spot.id === "ANA_PREMIUM_VS") { // US-Japan check
                             routeMatches = (origin?.includes('JFK') || origin?.includes('LAX') || origin?.includes('SFO') || origin?.includes('ORD') || origin?.includes('LHR')) &&
                                            (destination?.includes('HND') || destination?.includes('NRT'));
                        } else if (spot.id === "CX_PREMIUM_AS") { // US-Asia check
                            routeMatches = (origin?.includes('JFK') || origin?.includes('LAX') || origin?.includes('SFO') || origin?.includes('ORD') || origin?.includes('BOS')) &&
                                           (destination?.includes('HKG') || destination?.includes('SIN') || destination?.includes('BKK') || destination?.includes('NRT'));
                        } else if (spot.id === "ANA_BUSINESS_LHR_HND_VS") { // London-Tokyo check (more specific)
                            routeMatches = (origin?.includes('LHR') && destination?.includes('HND')) || (origin?.includes('HND') && destination?.includes('LHR'));
                        }
                         // Add checks for other specific routes...
                    } else if (typeof spot.route === 'string' && spot.route === 'Round the World (Multi-City)') {
                         // RTW can technically match any route, but we probably only want to show
                         // the RTW guide if the user is actively trying to find RTW flights,
                         // which is not handled by the current single O&D search form.
                         // For this component, let's require a specific route match or a non-route specific spot.
                         routeMatches = false; // Don't match RTW here based on single O&D
                    } else if (spot.route === null) {
                         // Non-route specific spot (e.g., hotel)
                         routeMatches = true; // Matches if not route-dependent
                    }

                    if (!routeMatches) return false;
               } else {
                   // If spot has no route defined, it matches by type/cabin (e.g., hotel luxury)
                    if (spot.type === 'airline') return false; // Airline spots without routes are unexpected/unmatched here
               }

                // If we reach here, it's a match for program, cabin, and route (if applicable)
               return true;
           });

           if (matchedSpot) {
               foundGuideData = matchedSpot; // Found the matching sweet spot data object
               break; // Stop searching once found
           }
       }


       // If a match is found, set the state.
       setGuideData(foundGuideData);
       if (foundGuideData) setActiveSection("overview"); // Reset tab on load
   }, [program, transferPartner, cabin, origin, destination]); // Effect dependencies


  // Don't render anything if no guide data is loaded
  if (!guideData) {
    return null;
  }

  // Map core sweet spot data fields to the UI-specific fields expected by the component's render logic
   const uiGuideData = {
       id: guideData.id,
       title: guideData.name, // Use 'name' from data as title
       description: guideData.description,
       program: guideData.program, // Underlying partner program (e.g., ANA)
       bookVia: guideData.bookVia, // Program used to book (e.g., Virgin Atlantic)
       valueRange: guideData.valuePerPoint, // Value range string (e.g., "4-8¢")
       pointsRequired: guideData.pointsRequired, // Object of point requirements
       transferPartners: guideData.transferSources, // Array of transfer sources
       searchWindow: guideData.searchWindow,
       searchTools: guideData.searchTools,
       callInstructions: guideData.callInstructions,
       bookingLink: guideData.bookingLink,
       routeOptions: guideData.routeOptions, // Array of route details
       proTips: guideData.proTips, // Array of tips
       warnings: guideData.warnings, // Array of warnings
       valuationRationale: guideData.valuationRationale // Specific rationale string
       // Add other fields if needed and present in the sweetSpots data
   };


  return (
    <div className="mt-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-100 p-4 border-b border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
            <FaStar className="text-yellow-500 mr-2" />
            {uiGuideData.title}
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            {uiGuideData.description}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-yellow-200 bg-yellow-50">
          <nav className="flex overflow-x-auto">
            <button
              className={`px-4 py-2 whitespace-nowrap font-medium text-sm ${
                activeSection === 'overview'
                  ? 'text-yellow-800 border-b-2 border-yellow-500'
                  : 'text-yellow-700 hover:text-yellow-800'
              }`}
              onClick={() => setActiveSection('overview')}
            >
              Overview
            </button>
            {/* Conditionally render tabs based on data availability */}
             {(uiGuideData.searchWindow || uiGuideData.callInstructions || (uiGuideData.searchTools && uiGuideData.searchTools.length > 0)) ? (
                 <button
                     className={`px-4 py-2 whitespace-nowrap font-medium text-sm ${
                         activeSection === 'booking'
                             ? 'text-yellow-800 border-b-2 border-yellow-500'
                             : 'text-yellow-700 hover:text-yellow-800'
                     }`}
                     onClick={() => setActiveSection('booking')}
                 >
                     How to Book
                 </button>
             ) : null}
             {uiGuideData.routeOptions && uiGuideData.routeOptions.length > 0 ? (
                 <button
                     className={`px-4 py-2 whitespace-nowrap font-medium text-sm ${
                         activeSection === 'routes'
                             ? 'text-yellow-800 border-b-2 border-yellow-500'
                             : 'text-yellow-700 hover:text-yellow-800'
                     }`}
                     onClick={() => setActiveSection('routes')}
                 >
                     Routes & Aircraft
                 </button>
             ) : null}
             {((uiGuideData.proTips && uiGuideData.proTips.length > 0) || (uiGuideData.warnings && uiGuideData.warnings.length > 0)) ? (
                 <button
                     className={`px-4 py-2 whitespace-nowrap font-medium text-sm ${
                         activeSection === 'tips'
                             ? 'text-yellow-800 border-b-2 border-yellow-500'
                             : 'text-yellow-700 hover:text-yellow-800'
                     }`}
                     onClick={() => setActiveSection('tips')}
                 >
                     Pro Tips
                 </button>
             ) : null}
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-4 text-sm text-gray-700"> {/* Set base text size and color */}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-yellow-800 font-medium">Sweet Spot Value</span>
                  <div className="text-2xl font-bold text-yellow-700">
                    {uiGuideData.valueRange} <span className="text-sm font-normal">per point</span> {/* Use valuePerPoint from data */}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm text-yellow-800 font-medium">Book Through</span>
                  <div className="text-lg font-bold text-yellow-700">
                    {uiGuideData.bookVia} {/* Use bookVia from data */}
                  </div>
                </div>
              </div>

              {/* Points Required - Display based on data structure */}
              {uiGuideData.pointsRequired && Object.keys(uiGuideData.pointsRequired).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Points Required</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(uiGuideData.pointsRequired).map(([routeKey, pointsString], idx) => (
                      <div key={idx} className="flex items-start text-sm">
                        <FaTicketAlt className="text-yellow-600 mt-1 mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{routeKey}:</span> {pointsString}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valuation Rationale - Display if available */}
              {uiGuideData.valuationRationale && (
                  <div className="bg-white p-3 rounded border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Why This is Valuable</h4>
                      <p className="text-sm text-gray-700">{uiGuideData.valuationRationale}</p>
                  </div>
              )}


              {/* Program and Transfer Partners */}
               {uiGuideData.program && ( // Display the underlying program (e.g. ANA)
                   <div className="flex items-center justify-between">
                       <span className="text-sm text-yellow-800 font-medium">Partner Airline/Hotel:</span>
                       <span className="text-sm font-medium text-gray-900">{uiGuideData.program}</span>
                   </div>
               )}

               {uiGuideData.transferPartners && uiGuideData.transferPartners.length > 0 && ( // Display where points come from
                   <div className="flex items-center justify-between border-t border-yellow-200 pt-2">
                       <span className="text-sm text-yellow-800 font-medium">Transfer From:</span>
                       <div className="text-sm text-gray-900 text-right"> {/* Added text-right */}
                           {uiGuideData.transferPartners.join(', ')}
                       </div>
                   </div>
               )}
               {/* Can also add a note about transfer time if available */}
            </div>
          )}

          {/* Booking Section */}
          {activeSection === 'booking' && (uiGuideData.searchWindow || uiGuideData.callInstructions || (uiGuideData.searchTools && uiGuideData.searchTools.length > 0)) && (
            <div className="space-y-4 text-sm text-gray-700">
               {uiGuideData.searchWindow && (
                   <div>
                       <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                           <FaCalendarAlt className="mr-2 text-yellow-600" /> When to Search
                       </h4>
                       <p className="text-sm text-gray-700 bg-white p-3 rounded border border-yellow-200">
                           {uiGuideData.searchWindow}
                       </p>
                   </div>
               )}

               {uiGuideData.searchTools && uiGuideData.searchTools.length > 0 && (
                   <div>
                       <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                           <FaSearch className="mr-2 text-yellow-600" /> Recommended Search Tools
                       </h4>
                       <ul className="space-y-2 list-disc list-inside"> {/* Use list styles */}
                           {uiGuideData.searchTools.map((tool, idx) => (
                               <li key={idx}>{tool}</li>
                           ))}
                       </ul>
                   </div>
               )}


              {uiGuideData.callInstructions && (
                  <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                          <FaPhone className="mr-2 text-yellow-600" /> How to Book
                      </h4>
                      <div className="bg-white p-3 rounded border border-yellow-200 text-sm text-gray-700">
                          {uiGuideData.callInstructions}
                      </div>
                  </div>
              )}


              {/* Add placeholder for booking link if available in data */}
              {uiGuideData.bookingLink && (
                  <div className="mt-4">
                      <a
                          href={uiGuideData.bookingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full block bg-blue-600 text-white px-4 py-2 rounded text-center flex items-center justify-center hover:bg-blue-700"
                      >
                          <FaExternalLinkAlt className="mr-2" /> Go to Booking Website
                      </a>
                  </div>
              )}
            </div>
          )}

          {/* Routes Section - Display if routeOptions exist */}
          {activeSection === 'routes' && uiGuideData.routeOptions && uiGuideData.routeOptions.length > 0 && (
            <div className="space-y-4 text-sm text-gray-700">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <FaPlane className="mr-2 text-yellow-600" /> Available Routes
              </h4>

              <div className="space-y-3">
                {uiGuideData.routeOptions.map((route, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-yellow-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{route.origin} → {route.destination}</div>
                      {route.frequency && (
                           <div className="text-xs bg-yellow-100 px-2 py-1 rounded text-yellow-800">
                             {route.frequency}
                           </div>
                      )}
                    </div>
                    {route.aircraft && <div className="text-sm text-gray-600">Aircraft: {route.aircraft}</div>}
                    {route.notes && <div className="text-sm text-gray-700 mt-1">{route.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro Tips Section - Display if tips or warnings exist */}
          {activeSection === 'tips' && ((uiGuideData.proTips && uiGuideData.proTips.length > 0) || (uiGuideData.warnings && uiGuideData.warnings.length > 0)) && (
            <div className="space-y-4 text-sm text-gray-700">
              {uiGuideData.proTips && uiGuideData.proTips.length > 0 && (
                  <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                          <FaStar className="mr-2 text-yellow-600" /> Pro Tips
                      </h4>
                      <ul className="space-y-2 list-disc list-inside"> {/* Use list styles */}
                          {uiGuideData.proTips.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                          ))}
                      </ul>
                  </div>
              )}

              {uiGuideData.warnings && uiGuideData.warnings.length > 0 && (
                  <div className="bg-red-50 p-3 rounded">
                      <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                          <FaExclamationTriangle className="mr-2 text-red-600" /> Watch Out For
                      </h4>
                      <ul className="space-y-2 list-disc list-inside text-red-700"> {/* Use list styles */}
                          {uiGuideData.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get guide data from the central sweetSpots data
// This function needs to be updated to correctly use the data structure
// defined in TransferPartnersService.js/sweetSpots
function getGuideData(program, transferPartner, cabin, origin, destination) {
  // Normalize inputs
  const searchProgram = program; // Program used for booking (e.g., 'Virgin Atlantic Flying Club')
  const searchTransferPartner = transferPartner; // Program points came from (e.g., 'Chase Ultimate Rewards')
  const searchCabin = cabin?.toLowerCase(); // e.g., 'business', 'first'
  const searchOrigin = origin; // IATA code (e.g., 'LHR', 'JFK')
  const searchDestination = destination; // IATA code (e.g., 'HND', 'HKG')


  // Find a matching sweet spot from the central data service
  const allSweetSpots = Object.values(TransferPartnersService.sweetSpots).flat(); // Flatten the nested structure

  const matchingSpot = allSweetSpots.find(spot => {
      // 1. Check Cabin Match (if the sweet spot specifies applicable cabins)
      if (spot.cabin && !spot.cabin.includes(searchCabin)) {
          return false;
      }
       // Handle hotel "cabin" (category) if needed
       if (spot.type === 'hotel' && searchCabin !== 'luxury') { // Simplified check for Hyatt luxury spot
           return false;
       }


      // 2. Check Program Match:
      //    The spot's `bookVia` must match the `program` prop passed to this component.
      if (spot.bookVia !== searchProgram) {
          return false;
      }

      // 3. Check Transfer Source Match (if this was a transferred redemption)
      //    If the `transferPartner` prop is provided, check if the spot's `transferSources`
      //    list includes this transfer partner. This confirms the specific transfer path
      //    led to this sweet spot.
      if (searchTransferPartner && !(spot.transferSources || []).includes(searchTransferPartner)) {
          // Exception: If the booking program IS the transfer partner (e.g., booking VS via VS points)
          // AND the sweet spot is for a *partner* (e.g., ANA), then this check is slightly different.
          // We still need to ensure the *booking* program (VS) is the `bookVia`.
          // The `transferPartner` check is more relevant when the booking program is NOT the source.
          // Let's refine: If transferPartner is provided, the spot must be reachable from it.
          // The spot's `transferSources` lists where points TO `bookVia` can come from.
          // So, if transferPartner is provided, it *must* be in `transferSources`.
          // Unless it's a direct booking where program == bookVia == transferPartner (not a transfer scenario).
          // For simplicity: If `transferPartner` is provided, it MUST be in `spot.transferSources`.
          // If `transferPartner` is NOT provided (direct booking), then `spot.bookVia` must be the program,
          // and it must *not* be a sweet spot that *requires* a transfer from a specific source
          // that the user doesn't have. This is complex.
          // Simpler check: If transferPartner is provided, ensure the spot lists it as a source.
           if (searchTransferPartner && !spot.transferSources.includes(searchTransferPartner)) {
                return false; // This sweet spot is not typically reached via this specific transfer partner
           }
      }


      // 4. Check Route Match (if the sweet spot specifies a route filter)
      //    This uses the simplified logic from the service.
      if (spot.route) {
          let routeMatches = false;
          if (Array.isArray(spot.route) && spot.route.length >= 1) {
              routeMatches = spot.route.some(routePart =>
                 origin?.includes(routePart) || destination?.includes(routePart)
              );
               // Specific overrides for known sweet spot IDs
              if (spot.id === "ANA_PREMIUM_VS" || spot.id === "ANA_BUSINESS_LHR_HND_VS") { // US/Europe-Japan check
                   routeMatches = (origin?.includes('JFK') || origin?.includes('LAX') || origin?.includes('SFO') || origin?.includes('ORD') || origin?.includes('LHR')) &&
                                  (destination?.includes('HND') || destination?.includes('NRT'));
              } else if (spot.id === "CX_PREMIUM_AS") { // US-Asia check
                  routeMatches = (origin?.includes('JFK') || origin?.includes('LAX') || origin?.includes('SFO') || origin?.includes('ORD') || origin?.includes('BOS')) &&
                                 (destination?.includes('HKG') || destination?.includes('SIN') || destination?.includes('BKK') || destination?.includes('NRT'));
              }
               // Add more specific checks for other sweet spots...

               if (!routeMatches) return false;
          } else if (typeof spot.route === 'string' && spot.route === 'Round the World (Multi-City)') {
                // RTW sweet spot - does it match if we have an O&D? Maybe only show for multi-city search?
                // For this component, let's skip RTW if we only have a single O&D.
                // This component should only trigger if the calculator *already* flagged the redemption as a sweet spot.
                // The calculator would have used `findMatchingSweetSpotData` which has similar route logic.
                // So, if the calculator flagged it, it should match the basic route logic here.
                // Let's assume if `spot.route` is defined and not null, we need to find a match.
                // If the search is a single O&D, we can't match RTW.
               if (spot.route === 'Round the World (Multi-City)') return false;
          } else if (spot.route === null) {
              // Non-route specific spot (e.g., hotel luxury) - route matching is satisfied
          }


      } else {
          // If spot has no route defined, it matches by type/cabin (e.g., hotel luxury)
          if (spot.type === 'airline') return false; // Airline spots without routes are unexpected/unmatched here
      }

      // If we pass all checks, it's the correct sweet spot guide to show
      return true;
  });

   // Return the found sweet spot data object or null
  return matchingSpot || null;
}

export default SpecialRedemptionGuide;