// src/components/SearchRedemption.js

import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select'; // Using react-select for better airport dropdown
import { useNavigate } from 'react-router-dom';
import {
  FaPlane, FaSpinner,
  FaInfoCircle, FaFilter, FaChevronDown, FaChevronUp, FaSearch, FaHotel
} from 'react-icons/fa'; // Added FaSearch and FaHotel

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
  const [errorFields, setErrorFields] = useState([]);

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
  }, []);


  // Add keyboard navigation for the search type buttons
  const handleSearchTypeKeyPress = (e, type) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSearchType(type);
    }
  };

  // Enhance form validation with field-specific errors
  const validateForm = () => {
    const errors = [];
    
    if (searchType === 'flight') {
      if (!origin) errors.push('origin');
      if (!destination) errors.push('destination');
      if (!departDate) errors.push('depart-date');
      if (!cabin) errors.push('cabin-select');
    } else {
      if (!destination) errors.push('destination');
      if (!departDate) errors.push('depart-date');
      if (!returnDate) errors.push('return-date');
    }
    
    if (errors.length > 0) {
      setErrorFields(errors);
      setValidationError(`Please fill in all required fields: ${errors.join(', ')}`);
      // Focus the first error field
      const firstError = document.getElementById(errors[0]);
      if (firstError) firstError.focus();
      return false;
    }
    
    setErrorFields([]);
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
    <form onSubmit={handleSubmit}>
      <div role="main" className="search-redemption-container">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="p-4 bg-blue-600 text-white">
            <h2 className="text-xl font-semibold">Find Your Best Redemption</h2>
            <p className="text-blue-100">We&apos;ll analyze your points and find the best value option</p>
          </div>

          <div className="p-6">
            <div className="search-type-buttons" role="radiogroup" aria-label="Search type">
              <button
                type="button"
                onClick={() => setSearchType('flight')}
                onKeyPress={(e) => handleSearchTypeKeyPress(e, 'flight')}
                className={`search-type-button ${searchType === 'flight' ? 'active' : ''}`}
                aria-pressed={searchType === 'flight'}
                aria-label="Search for flights"
                tabIndex={0}
              >
                <FaPlane aria-hidden="true" />
                Flight
              </button>
              <button
                type="button"
                onClick={() => setSearchType('hotel')}
                onKeyPress={(e) => handleSearchTypeKeyPress(e, 'hotel')}
                className={`search-type-button ${searchType === 'hotel' ? 'active' : ''}`}
                aria-pressed={searchType === 'hotel'}
                aria-label="Search for hotels"
                tabIndex={0}
              >
                <FaHotel aria-hidden="true" />
                Hotel
              </button>
            </div>

            <div className="search-form" role="form" aria-label={`${searchType} search form`}>
              <div className="search-fields">
                <div className="field-group">
                  <label id="origin-label" htmlFor="origin-select">
                    From
                    <span className="required-indicator" aria-hidden="true">*</span>
                    <span className="sr-only">Required</span>
                  </label>
                  <Select
                    id="origin-select"
                    aria-labelledby="origin-label"
                    value={origin}
                    onChange={setOrigin}
                    options={airportOptions}
                    placeholder="Select departure city"
                    isSearchable
                    className={`react-select-container ${errorFields.includes('origin') ? 'error' : ''}`}
                    classNamePrefix="react-select"
                    aria-invalid={errorFields.includes('origin')}
                    aria-describedby={errorFields.includes('origin') ? 'origin-error' : undefined}
                  />
                  {errorFields.includes('origin') && (
                    <div id="origin-error" className="error-message" role="alert">
                      Please select a departure city
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label id="destination-label" htmlFor="destination-select">To</label>
                  <Select
                    id="destination-select"
                    aria-labelledby="destination-label"
                    value={destination}
                    onChange={setDestination}
                    options={airportOptions}
                    placeholder="Select arrival city"
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="depart-date">
                    Departure Date
                    <span className="required-indicator" aria-hidden="true">*</span>
                    <span className="sr-only">Required</span>
                  </label>
                  <input
                    type="date"
                    id="depart-date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    aria-required="true"
                    className={errorFields.includes('depart-date') ? 'error' : ''}
                    aria-invalid={errorFields.includes('depart-date')}
                    aria-describedby={errorFields.includes('depart-date') ? 'depart-date-error' : undefined}
                  />
                  {errorFields.includes('depart-date') && (
                    <div id="depart-date-error" className="error-message" role="alert">
                      Please select a departure date
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label htmlFor="return-date">Return Date</label>
                  <input
                    type="date"
                    id="return-date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departDate || new Date().toISOString().split('T')[0]}
                    aria-required="false"
                  />
                </div>

                <div className="field-group">
                  <label id="cabin-label" htmlFor="cabin-select">Cabin Class</label>
                  <Select
                    id="cabin-select"
                    aria-labelledby="cabin-label"
                    value={cabin}
                    onChange={setCabin}
                    options={cabinOptions}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="passengers">Passengers</label>
                  <input
                    type="number"
                    id="passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="9"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowAdvancedOptions(!showAdvancedOptions);
                  }
                }}
                className="advanced-options-toggle"
                aria-expanded={showAdvancedOptions}
                aria-controls="advanced-options"
                tabIndex={0}
              >
                <FaFilter aria-hidden="true" />
                Advanced Options
                {showAdvancedOptions ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
              </button>

              {showAdvancedOptions && (
                <div id="advanced-options" className="advanced-options" role="region" aria-label="Advanced Search Options">
                  <div className="field-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={directFlightsOnly}
                        onChange={(e) => setDirectFlightsOnly(e.target.checked)}
                        aria-label="Direct flights only"
                      />
                      Direct flights only
                    </label>
                  </div>

                  <div className="field-group">
                    <label id="preferred-airlines-label" htmlFor="preferred-airlines">Preferred Airlines</label>
                    <Select
                      id="preferred-airlines"
                      aria-labelledby="preferred-airlines-label"
                      isMulti
                      value={preferredAirlines}
                      onChange={setPreferredAirlines}
                      options={popularAirlines}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder="Select preferred airlines"
                    />
                  </div>

                  <div className="field-group">
                    <label id="avoided-airlines-label" htmlFor="avoided-airlines">Airlines to Avoid</label>
                    <Select
                      id="avoided-airlines"
                      aria-labelledby="avoided-airlines-label"
                      isMulti
                      value={avoidedAirlines}
                      onChange={setAvoidedAirlines}
                      options={popularAirlines}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder="Select airlines to avoid"
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="travel-goal">Travel Goal/Preferences</label>
                    <textarea
                      id="travel-goal"
                      value={travelGoal}
                      onChange={(e) => setTravelGoal(e.target.value)}
                      placeholder="e.g., Maximize comfort, minimize connections, etc."
                      aria-label="Enter your travel preferences or goals"
                    />
                  </div>
                </div>
              )}

              {validationError && (
                <div role="alert" className="error-message">
                  <FaInfoCircle aria-hidden="true" /> {validationError}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  className="search-button"
                  disabled={loading}
                  aria-busy={loading}
                  aria-label={loading ? 'Searching for awards' : 'Search for awards'}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" aria-hidden="true" />
                      <span aria-hidden="true">Searching...</span>
                      <span className="sr-only">Searching for awards</span>
                    </>
                  ) : (
                    <>
                      <FaSearch aria-hidden="true" />
                      <span aria-hidden="true">Search Awards</span>
                      <span className="sr-only">Search for award availability</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {programs.length === 0 && (
          <div 
            role="alert" 
            className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-700"
            aria-live="polite"
          >
            <p className="font-medium">You haven&apos;t added any loyalty programs yet.</p>
            <p className="mt-1 text-sm">Add your programs to get accurate redemption recommendations.</p>
            <button
              type="button"
              className="mt-2 text-blue-600 font-medium hover:underline"
              onClick={() => navigate('/connect')}
              aria-label="Go to program connection page"
            >
              Connect Your Programs →
            </button>
          </div>
        )}

        {/* Estimated Value Section */}
        {(searchType === 'flight' && origin && destination && cabin && passengers > 0) ||
         (searchType === 'hotel' && destination && departDate && returnDate && passengers > 0 && new Date(departDate) < new Date(returnDate)) ? (
          <div 
            className="bg-blue-50 p-4 rounded-lg"
            role="region"
            aria-label="Estimated Value Information"
            aria-live="polite"
          >
            <div className="flex items-start">
              <FaInfoCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Estimated Cash Value</h3>
                {searchType === 'flight' ? (
                  <p className="text-sm text-blue-700 mt-1">
                    The estimated cash cost for {passengers} passenger{passengers > 1 ? 's' : ''} flying {cabin?.label || 'Economy'} from {origin?.label || origin?.value} to {destination?.label || destination?.value} around your dates is approximately: <span className="font-semibold" aria-label="Estimated cost">{formatCurrency(estimatedCashPrice())}</span>
                  </p>
                ) : (
                  <p className="text-sm text-blue-700 mt-1">
                    The estimated cash cost for {passengers} room{passengers > 1 ? 's' : ''} for {Math.max(1, (new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24))} night{Math.max(1, (new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''} in {destination?.label || destination?.value} is approximately: <span className="font-semibold" aria-label="Estimated cost">{formatCurrency(estimatedCashPrice())}</span>
                  </p>
                )}

                {/* Sweet Spot Hints */}
                {searchType === 'flight' && (cabin?.value === 'first' || cabin?.value === 'business') && 
                 (destination?.value?.includes('HND') || destination?.value?.includes('NRT')) && 
                 (programs.some(p => p.name === 'Virgin Atlantic Flying Club' || p.name === 'American Express Membership Rewards')) && (
                  <p className="text-xs text-blue-600 mt-1" role="note">
                    ✨ This route/cabin may qualify for the high-value ANA premium cabin sweet spot via Virgin Atlantic.
                  </p>
                )}
                {searchType === 'flight' && (cabin?.value === 'first' || cabin?.value === 'business') && 
                 (destination?.value?.includes('HKG') || destination?.value?.includes('SIN')) && 
                 programs.some(p => p.name === 'Alaska Airlines Mileage Plan') && (
                  <p className="text-xs text-blue-600 mt-1" role="note">
                    ✨ Check for the Cathay Pacific premium cabin sweet spot via Alaska Mileage Plan.
                  </p>
                )}
                {searchType === 'hotel' && (cabin?.value === 'luxury' || cabin?.value === 'premium' || cabin?.value === 'standard') && 
                 programs.some(p => p.name === 'World of Hyatt') && (
                  <p className="text-xs text-blue-600 mt-1" role="note">
                    ✨ Hyatt points can offer excellent value at luxury properties.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}