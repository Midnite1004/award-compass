// src/components/SearchRedemption.js

import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select'; // Using react-select for better airport dropdown
import { useNavigate } from 'react-router-dom';
import {
  FaPlane, FaCalendarAlt, FaSpinner,
  FaInfoCircle, FaFilter, FaChevronDown, FaChevronUp, FaSearch
} from 'react-icons/fa'; // Added FaSearch

// Import airport data (assuming airports.json is in public/)
// Need to manually fetch or import if not using Webpack's file-loader for JSON
// For this setup, let's assume airports.json is imported directly from utils
import airportData from '../utils/airports.json';

// Import the new central RedemptionCalculator service and formatters
import RedemptionCalculator, { getMockRetailValue } from '../utils/RedemptionCalculator'; // Import default and named export
import { formatCurrency } from '../utils/redemptionValueUtils'; // Import formatting utility


// Airport options formatted for react-select
const airportOptions = airportData.map(a => ({
  value: a.iata,
  label: `${a.city} (${a.iata}) - ${a.airport}`,
  city: a.city,
  airport: a.airport,
  country: a.country,
  coordinates: a.coordinates
}));


// Cabin options
const cabinOptions = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium', label: 'Premium Economy' },
  { value: 'business', label: 'Business Class' },
  { value: 'first', label: 'First Class' }
];

// Sample data for airlines (used in advanced options)
// These should match the program names used in TransferPartnersService.js and MOCK_AWARD_CHARTS
const popularAirlines = [
  { value: 'United MileagePlus', label: 'United Airlines' },
  { value: 'Delta SkyMiles', label: 'Delta Air Lines' },
  { value: 'American Airlines AAdvantage', label: 'American Airlines' },
  { value: 'Southwest Rapid Rewards', label: 'Southwest Airlines' }, // Example, might not be in mock data
  { value: 'Lufthansa Miles & More', label: 'Lufthansa' },
  { value: 'British Airways Executive Club', label: 'British Airways' },
  { value: 'Emirates Skywards', label: 'Emirates' }, // Example, might not be in mock data
  { value: 'Qatar Airways Privilege Club', label: 'Qatar Airways' },
  { value: 'Singapore KrisFlyer', label: 'Singapore Airlines' },
  { value: 'ANA Mileage Club', label: 'ANA' },
  { value: 'Japan Airlines Mileage Bank', label: 'Japan Airlines' }, // Example, might not be in mock data
  { value: 'Cathay Pacific Asia Miles', label: 'Cathay Pacific' },
  { value: 'Air France-KLM Flying Blue', label: 'Air France-KLM' }, // Combined Flying Blue
  { value: 'Turkish Airlines Miles&Smiles', label: 'Turkish Airlines' },
  { value: 'Alaska Airlines Mileage Plan', label: 'Alaska Airlines' },
  { value: 'Virgin Atlantic Flying Club', label: 'Virgin Atlantic' }
  // Add relevant hotel programs here if hotel search advanced options are added
];


export default function SearchRedemption() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null); // Use object structure {value: 'JFK', label: 'NY (JFK)', ...}
  const [destination, setDestination] = useState(null); // Use object structure
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [cabin, setCabin] = useState(cabinOptions[0]); // Use object structure for React-Select
  const [passengers, setPassengers] = useState(1);
  const [searchType, setSearchType] = useState('flight'); // 'flight' or 'hotel' - NOTE: Hotel search calculation is minimal/heuristic
  const [programs, setPrograms] = useState([]); // User's loyalty programs from localStorage
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false); // Preference
  const [preferredAirlines, setPreferredAirlines] = useState([]); // Preference (array of {value, label} objects from react-select)
  const [avoidedAirlines, setAvoidedAirlines] = useState([]); // Preference (array of {value, label} objects from react-select)
  const [travelGoal, setTravelGoal] = useState(''); // Preference

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const nearestAirport = airportOptions.find(a => a.coordinates && typeof a.coordinates.lat === 'number' && typeof a.coordinates.lon === 'number');
          if (nearestAirport) {
            setOrigin(nearestAirport); // Set the airport object
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Set default dates and load saved data/programs
  useEffect(() => {
    // Define helper functions inside useEffect to avoid dependency issues
    // Simple function to find nearest airport based on latitude/longitude
    // Uses the coordinates available in airports.json
    const findNearestAirport = (lat, lon) => {
        let closestAirport = null;
        let minDistanceSq = Infinity; // Use squared distance for comparison

         // Filter airportOptions to include only those with coordinates
         const airportsWithCoords = airportOptions.filter(a => a.coordinates && typeof a.coordinates.lat === 'number' && typeof a.coordinates.lon === 'number');

        // This is a simplified calculation (Euclidean distance on lat/lon)
        // For better accuracy, use Haversine distance or a geospatial library.
        // Limiting the search to the first 100 with coords as a proxy for major hubs for demo efficiency.
        const searchLimit = 100;
        for (let i = 0; i < Math.min(searchLimit, airportsWithCoords.length); i++) {
            const airport = airportsWithCoords[i];
            const airportLat = airport.coordinates.lat;
            const airportLon = airport.coordinates.lon;

            const dx = airportLon - lon;
            const dy = airportLat - lat;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestAirport = airport;
            }
        }

        console.log("Found nearest airport (simple coordinate distance):", closestAirport?.value);
        return closestAirport; // Returns the airport object
    };

    // Attempt to get user's location and find nearest airport
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const nearestAirport = findNearestAirport(latitude, longitude);
            if (nearestAirport) {
              setOrigin(nearestAirport); // Set the airport object
            }
          },
          (error) => {
            console.log("Geolocation error:", error);
            // Fallback to a default if location fails
            const defaultOrigin = airportOptions.find(a => a.value === 'JFK'); // Default to JFK
            if (defaultOrigin) setOrigin(defaultOrigin);
          }
        );
      } else {
         // Fallback to a default if geolocation is not supported
         const defaultOrigin = airportOptions.find(a => a.value === 'JFK'); // Default to JFK
         if (defaultOrigin) setOrigin(defaultOrigin);
      }
    };

    // Load last search from localStorage (persist for 72 hours)
    const saved = JSON.parse(localStorage.getItem('awardcompass_lastSearch') || 'null'); // Changed localStorage key
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 72 hours in ms

    if (saved && Date.now() - saved.savedAt < THREE_DAYS) {
      // Restore saved search params
      if (saved.origin) setOrigin(saved.origin); // Store/restore full object
      if (saved.destination) setDestination(saved.destination); // Store/restore full object
      if (saved.departDate) setDepartDate(saved.departDate);
      if (saved.returnDate) setReturnDate(saved.returnDate);
      // Find the full cabin object in options based on saved value
      const savedCabinOption = cabinOptions.find(opt => opt.value === saved.cabin?.value);
      if (savedCabinOption) setCabin(savedCabinOption); // Use the object if found
      if (saved.passengers) setPassengers(saved.passengers);
      if (saved.searchType) setSearchType(saved.searchType); // Restore search type
      if (typeof saved.directFlightsOnly === 'boolean') setShowAdvancedOptions(true); // Show advanced if these were saved
      if (typeof saved.directFlightsOnly === 'boolean') setDirectFlightsOnly(saved.directFlightsOnly);
      if (saved.preferredAirlines) setPreferredAirlines(saved.preferredAirlines); // Restore array of objects
      if (saved.avoidedAirlines) setAvoidedAirlines(saved.avoidedAirlines); // Restore array of objects
      if (saved.travelGoal) setTravelGoal(saved.travelGoal);

    } else {
      // Initialize with default values if no saved search
      const today = new Date();
      const returnDay = new Date(today);
      returnDay.setDate(today.getDate() + 7);

      const formatDate = (date) => {
        return date.toISOString().split('T')[0]; // Format to YYYY-MM-DD
      };

      setDepartDate(formatDate(today));
      setReturnDate(formatDate(returnDay));

      // Try to set origin based on user's location (if available)
      getUserLocation(); // Call the function defined above inside useEffect
    }

    // Load saved programs from localStorage
    const savedPrograms = JSON.parse(localStorage.getItem('programs') || '[]');
    // If no saved programs, initialize with some default programs for demo purposes
    if (!savedPrograms || savedPrograms.length === 0) {
      const defaultPrograms = [
        { name: 'Chase Ultimate Rewards', balance: 100000 },
        { name: 'American Express Membership Rewards', balance: 80000 },
        { name: 'Capital One Miles', balance: 60000 }
      ];
      localStorage.setItem('programs', JSON.stringify(defaultPrograms));
      setPrograms(defaultPrograms);
    } else {
      setPrograms(savedPrograms);
    }
  }, []); // Dependency array is now empty


  // Validation logic before search
  const validateForm = () => {
    if (searchType === 'flight') {
        if (!origin || !destination) {
          setValidationError('Please select both origin and destination airports.');
          return false;
        }
        if (!departDate) {
          setValidationError('Please select a departure date.');
          return false;
        }
         // Return date is optional for flights (one-way) but validate if provided
        if (returnDate && new Date(departDate) > new Date(returnDate)) {
          setValidationError('Return date must be after departure date.');
          return false;
        }
    }

    // Minimal hotel validation for now
    if (searchType === 'hotel') {
        if (!destination) {
          setValidationError('Please select a destination city/area.');
          return false;
        }
        if (!departDate) {
           setValidationError('Please select a check-in date.');
           return false;
        }
         if (!returnDate || new Date(departDate) >= new Date(returnDate)) {
             setValidationError('Please select a check-out date after the check-in date.');
             return false;
         }
    }

    if(programs.length === 0) {
         setValidationError('Please add your loyalty programs to search.');
         return false;
    }

    // Clear validation error if everything is okay
    setValidationError('');
    return true;
  };


  // Estimate rough cash value for the route (used for hint in UI)
  const estimatedCashPrice = () => {
       // Only estimate if flight search and origin/destination/cabin are selected
       if (searchType !== 'flight' || !origin || !destination || !cabin) return null;

       const tripDetailsForEstimate = {
            origin: origin.value, // Pass IATA code
            destination: destination.value, // Pass IATA code
            departDate, // Dates affect seasonality multiplier in estimateTripCost
            returnDate,
            cabin: cabin.value, // Pass cabin value string
            passengers
       };
       // Use the estimation function from RedemptionCalculator (or internal utility if preferred)
       // Let's use the internal utility's basic estimate for this UI hint.
       // Note: RedemptionCalculator's getMockRetailValue is more aligned with its internal award data.
       // Using a simple distance-based estimate here for the UI hint.
       // The getMockRetailValue is part of the RedemptionCalculator, so let's just call it.
       const cashValue = getMockRetailValue(tripDetailsForEstimate); // Corrected function call
       return cashValue;
  }


  // Handle search submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form inputs
    if (!validateForm()) {
        // Scroll to the top to make the error visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setLoading(true); // Start loading state

    try {
      // Prepare trip details object to pass to the calculator service
      // Ensure origin/destination are IATA codes (strings)
      const tripDetails = {
        origin: origin?.value,
        destination: destination?.value,
        departDate,
        returnDate, // Can be empty for one-way
        cabin: searchType === 'flight' ? cabin?.value : 'standard', // Use 'standard' or specific category key for hotels
        passengers: parseInt(passengers),
        searchType, // 'flight' or 'hotel'
         // Pass preferences to the calculator
        userPreferences: {
            directFlightsOnly: showAdvancedOptions && directFlightsOnly,
             // Pass only the values (program names) for preferred/avoided airlines
            preferredAirlines: showAdvancedOptions ? preferredAirlines.map(p => p.value) : [],
            avoidedAirlines: showAdvancedOptions ? avoidedAirlines.map(p => p.value) : [],
            travelGoal: travelGoal || null
        }
      };


      // Call the central calculation service
      // This function returns the best and alternative redemption options
      const redemptionResults = RedemptionCalculator.getAllRedemptionOptions(
        tripDetails,
        programs // Pass the user's loaded programs
      );

      // In a real application, the AI server would analyze these results or generate its own suggestions.
      // For this version, the AI server mock just returns a simple message.
      // We pass the calculated results and search params to the results page.

      // Persist last search to localStorage (72 hours)
      const lastSearch = {
        origin, // Store the full object for easy restoration
        destination, // Store the full object
        departDate,
        returnDate,
        cabin, // Store the full object
        passengers,
        searchType,
        directFlightsOnly,
        preferredAirlines, // Store the array of objects
        avoidedAirlines, // Store the array of objects
        travelGoal,
        savedAt: Date.now()
      };
      localStorage.setItem('awardcompass_lastSearch', JSON.stringify(lastSearch)); // Changed localStorage key


      // Navigate to results page, passing the calculated results and search parameters
      navigate('/results', {
        state: {
          searchParams: tripDetails, // Pass the tripDetails object used for calculation
          // Pass the results structure returned by the calculator
          redemptionResults: redemptionResults,
          // AI summary can be added here if a real AI provides it, or generated on the results page
          // aiSummary: "Analysis complete."
        }
      });

    } catch (error) {
      console.error('Error calculating redemptions:', error);
      setValidationError('An unexpected error occurred during calculation. Please try again.');
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 bg-blue-600 text-white">
          <h2 className="text-xl font-semibold">Find Your Best Redemption</h2>
          <p className="text-blue-100">We'll analyze your points and find the best value option</p>
        </div>

        <div className="p-6">
          {/* Search Type Tabs - Keeping for potential future Hotel logic */}
          <div className="flex mb-6 border-b">
            <button
              type="button" // Added type="button"
              className={`pb-2 px-4 flex items-center ${searchType === 'flight' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSearchType('flight')}
            >
              <FaPlane className="mr-2" /> Flight Redemption
            </button>
             {/* Hotel search is minimal/placeholder in calculations - uncomment if needed later */}
             {/*
            <button
               type="button"
               className={`pb-2 px-4 flex items-center ${searchType === 'hotel' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSearchType('hotel')}
            >
              <FaHotel className="mr-2" /> Hotel Redemption
            </button>
              */}
          </div>

          {/* Error message - Display at the top if validation fails */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-700 text-sm mb-4">
              <span className="font-medium">Error:</span> {validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4"> {/* Added space-y */}
            {/* Origin & Destination / Hotel Location */}
            {searchType === 'flight' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                  {/* Using react-select for better dropdown experience */}
                  <Select
                    options={airportOptions}
                    onChange={setOrigin}
                    placeholder="Select origin airport"
                    value={origin}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable // Allow clearing the selection
                    isSearchable // Allow typing to search
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                   <Select
                    options={airportOptions}
                    onChange={setDestination}
                    placeholder="Select destination airport"
                    value={destination}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                  />
                </div>
              </div>
            )}

            {/* Hotel Location - Placeholder UI - uncomment if needed */}
            {/*
            {searchType === 'hotel' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination City/Area</label>
                 <Select
                  options={airportOptions} // Using airport list as city list placeholder
                  onChange={setDestination}
                  placeholder="Select destination city"
                  value={destination}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  isSearchable
                 />
              </div>
            )}
            */}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {searchType === 'flight' ? 'Departure Date' : 'Check-in Date'}
                </label>
                <div className="flex border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"> {/* Added focus styles */}
                  <div className="bg-gray-100 p-2 flex items-center">
                    <FaCalendarAlt className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    className="flex-1 p-2 border-0 focus:outline-none focus:ring-0"
                    value={departDate}
                    onChange={e => setDepartDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {searchType === 'flight' ? 'Return Date (Optional)' : 'Check-out Date'}
                </label>
                <div className="flex border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"> {/* Added focus styles */}
                  <div className="bg-gray-100 p-2 flex items-center">
                    <FaCalendarAlt className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    className="flex-1 p-2 border-0 focus:outline-none focus:ring-0"
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    required={searchType === 'hotel'} // Return date required for hotel stay length
                  />
                </div>
              </div>
            </div>

            {/* Additional Options (Cabin & Passengers) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchType === 'flight' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Class</label>
                  <Select
                    options={cabinOptions}
                    onChange={setCabin}
                    value={cabin}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              )}
               {/* Add Hotel Category dropdown if needed */}
              {/* {searchType === 'hotel' && ( ... )} */}


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {searchType === 'flight' ? 'Passengers' : 'Rooms'}
                </label>
                {/* Using select element for passenger count */}
                <select
                  className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={passengers}
                  onChange={e => setPassengers(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Goal (optional)
              </label>
              <input
                type="text"
                className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="E.g., 'Luxury honeymoon', 'Family reunion', 'Business trip'"
                value={travelGoal}
                onChange={e => setTravelGoal(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Helps personalize recommendations
              </p>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                type="button" // Added type="button"
                className="text-blue-600 text-sm flex items-center hover:underline"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <FaFilter className="mr-2" />
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                 {showAdvancedOptions ? <FaChevronUp className="ml-2 text-xs" /> : <FaChevronDown className="ml-2 text-xs" />}
              </button>
            </div>

            {/* Advanced Options (Flight Only for now) */}
            {showAdvancedOptions && searchType === 'flight' && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm text-gray-700"> {/* Combined label and span */}
                    <input
                      type="checkbox"
                      checked={directFlightsOnly}
                      onChange={e => setDirectFlightsOnly(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>Only show options for direct flights</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Airlines (optional)
                  </label>
                  {/* Using react-select for multi-select dropdown */}
                  <Select
                    options={popularAirlines}
                    isMulti // Allow multiple selections
                    placeholder="Select preferred airlines..."
                    onChange={setPreferredAirlines}
                    value={preferredAirlines} // Controlled component
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Airlines to Avoid (optional)
                  </label>
                  <Select
                    options={popularAirlines}
                    isMulti
                    placeholder="Select airlines to avoid..."
                    onChange={setAvoidedAirlines}
                    value={avoidedAirlines}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
            )}

            {/* Points Value Estimator / Hint */}
             {/* Show estimation hint if enough basic info is provided */}
             {(searchType === 'flight' && origin && destination && cabin && passengers > 0) ||
              (searchType === 'hotel' && destination && departDate && returnDate && passengers > 0 && new Date(departDate) < new Date(returnDate)) ? (
                 <div className="bg-blue-50 p-4 rounded-lg">
                     <div className="flex items-start">
                         <FaInfoCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
                         <div>
                             <h3 className="text-sm font-medium text-blue-800">Estimated Cash Value</h3>
                             {/* Display estimated cash value based on search type */}
                             {searchType === 'flight' ? (
                                <p className="text-sm text-blue-700 mt-1">
                                    The estimated cash cost for {passengers} passenger{passengers > 1 ? 's' : ''} flying {cabin?.label || 'Economy'} from {origin?.label || origin?.value} to {destination?.label || destination?.value} around your dates is approximately: <span className="font-semibold">{formatCurrency(estimatedCashPrice())}</span>
                                </p>
                             ) : ( // Hotel estimate
                                <p className="text-sm text-blue-700 mt-1">
                                     The estimated cash cost for {passengers} room{passengers > 1 ? 's' : ''} for {Math.max(1, (new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24))} night{Math.max(1, (new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''} in {destination?.label || destination?.value} is approximately: <span className="font-semibold">{formatCurrency(estimatedCashPrice())}</span>
                                </p>
                             )}

                             {/* Add hints about potential sweet spots based on search criteria */}
                             {/* Note: These hints are basic heuristics, the actual sweet spot match happens in the calculator */}
                             {searchType === 'flight' && (cabin?.value === 'first' || cabin?.value === 'business') && (destination?.value?.includes('HND') || destination?.value?.includes('NRT')) && (programs.some(p => p.name === 'Virgin Atlantic Flying Club' || p.name === 'American Express Membership Rewards')) && (
                                 <p className="text-xs text-blue-600 mt-1">✨ This route/cabin may qualify for the high-value ANA premium cabin sweet spot via Virgin Atlantic.</p>
                             )}
                              {searchType === 'flight' && (cabin?.value === 'first' || cabin?.value === 'business') && (destination?.value?.includes('HKG') || destination?.value?.includes('SIN')) && programs.some(p => p.name === 'Alaska Airlines Mileage Plan') && (
                                 <p className="text-xs text-blue-600 mt-1">✨ Check for the Cathay Pacific premium cabin sweet spot via Alaska Mileage Plan.</p>
                             )}
                              {searchType === 'hotel' && (cabin?.value === 'luxury' || cabin?.value === 'premium' || cabin?.value === 'standard') && programs.some(p => p.name === 'World of Hyatt') && (
                                 <p className="text-xs text-blue-600 mt-1">✨ Hyatt points can offer excellent value at luxury properties.</p>
                             )}
                         </div>
                     </div>
                 </div>
             ) : null}


            {/* Search Button */}
            <div className="mt-6">
              <button
                type="submit" // Set type to submit to trigger form submission
                disabled={loading || programs.length === 0} // Disable if loading or no programs added
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Calculating Best Redemptions...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Find Best Redemptions
                  </>
                )}
              </button>
            </div>
          </form> {/* Closing form tag */}
        </div>
      </div>

      {/* No programs warning */}
      {programs.length === 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-700">
          <p className="font-medium">You haven't added any loyalty programs yet.</p>
          <p className="mt-1 text-sm">Add your programs to get accurate redemption recommendations.</p>
          <button
            type="button" // Added type="button"
            className="mt-2 text-blue-600 font-medium hover:underline"
            onClick={() => navigate('/connect')}
          >
            Add Programs Now
          </button>
        </div>
      )}
    </div>
  );
}