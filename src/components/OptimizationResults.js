import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaStar, FaInfoCircle, FaExclamationTriangle, 
  FaSearch, FaPlane, FaChevronDown, FaChevronUp,
  FaLightbulb
} from 'react-icons/fa';

const OptimizationResults = () => {
  const { state } = useLocation();
  const [showDetailedGuide, setShowDetailedGuide] = useState(false);
  const [showValueTooltip, setShowValueTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  
  // Handle case where results aren't available
  if (!state || !state.redemptionResults) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 text-center">
        <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Results Available</h2>
        <p className="text-gray-600 mb-4">Please perform a search to view redemption options.</p>
        <Link to="/search" className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center">
          <FaSearch className="mr-2" /> Go to Search
        </Link>
      </div>
    );
  }
  
  const { redemptionResults, searchParams } = state;
  const { best, alternatives: alternativeOptions } = redemptionResults;
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Format currency display
  const formatCurrency = (value) => {
    if (typeof value !== 'number' || !isFinite(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format points with commas
  const formatPoints = (points) => {
    if (!points) return '0';
    return new Intl.NumberFormat('en-US').format(points);
  };

  // Determine color class based on value per point
  const getValueColorClass = (cpp) => {
    if (cpp >= 2.0) return 'text-green-600';
    if (cpp >= 1.5) return 'text-blue-600';
    return 'text-gray-600';
  };
  
  // Determine value rating text
  const getValueRatingText = (cpp) => {
    if (!cpp) return 'Unknown';
    
    const value = parseFloat(cpp);
    if (value >= 2.5) return 'Excellent';
    if (value >= 1.5) return 'Great';
    if (value >= 1.0) return 'Good';
    if (value >= 0.6) return 'Average';
    return 'Poor';
  };
  
  // Prepare redemption data for AI insights component
  const prepareRedemptionData = (redemption) => {
    return {
      program: redemption.program,
      transferFrom: redemption.transferFrom,
      retailValue: redemption.cashValue,
      cashRequired: redemption.fees || 0,
      totalPointsUsed: redemption.points || 0,
      savings: redemption.cashValue - (redemption.fees || 0),
      origin: searchParams?.origin?.value,
      destination: searchParams?.destination?.value,
      cabin: searchParams?.cabin
    };
  };
  
  // Determine if a redemption is a known sweet spot
  const isSweetSpot = (redemption) => {
    // Simplified logic to detect sweet spots
    if (!redemption) return false;

    // Check for ANA via Virgin Atlantic (one of the best sweet spots)
    if ((redemption.program === 'Virgin Atlantic Flying Club' || 
         redemption.transferFrom === 'Virgin Atlantic Flying Club') && 
        searchParams?.destination?.value?.includes('HND') &&
        searchParams?.cabin?.includes('business')) {
      return true;
    }
    
    // Check for Cathay Pacific via Alaska
    if ((redemption.program === 'Alaska Airlines Mileage Plan' || 
         redemption.transferFrom === 'Alaska Airlines Mileage Plan') &&
        (searchParams?.destination?.value?.includes('HKG'))) {
      return true;
    }
    
    // Return false for now if no sweet spot is detected
    return false;
  };

  // Generate booking steps based on redemption type
  const generateBookingSteps = (redemption) => {
    if (!redemption) return [];
    
    const steps = [];
    
    // If transfer partner is involved, add transfer step
    if (redemption.transferFrom) {
      steps.push({
        type: 'transfer',
        title: 'Transfer Points',
        description: `Transfer ${formatPoints(redemption.points)} points from ${redemption.transferFrom} to ${redemption.program}`,
        details: 'Transfers are typically instant but can take up to 24 hours',
        icon: <FaArrowLeft />
      });
    }
    
    // Add booking step
    steps.push({
      type: 'book',
      title: 'Book Flight',
      description: `Book ${searchParams.cabin} class ${redemption.route || `from ${searchParams.origin.value} to ${searchParams.destination.value}`} using ${redemption.program} points`,
      details: `${formatPoints(redemption.points)} points + ${formatCurrency(redemption.fees)} in taxes/fees`,
      icon: <FaPlane />
    });
    
    // If return flight needed, add that step
    if (searchParams.returnDate && !redemption.oneWay) {
      steps.push({
        type: 'book-return',
        title: 'Book Return Flight',
        description: `Book ${searchParams.cabin} class return flight using ${redemption.program} points`,
        details: `Price included in above point total`,
        icon: <FaPlane />
      });
    }
    
    return steps;
  };
  
  // Ensure we display correct cash values
  const getCashRequired = (redemption) => {
    // If points are 0, cash required should be the full retail value
    if (!redemption.points || redemption.points === 0) {
      return redemption.cashValue;
    }
    return redemption.fees || 0;
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 bg-gray-50">
      {/* Back link */}
      <Link to="/search" className="text-blue-600 inline-flex items-center mb-4">
        <FaArrowLeft className="mr-1" /> Back to Search
      </Link>
      
      {/* Trip header info */}
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Optimal Redemption</h1>
      <p className="text-gray-600 mb-6">
        {searchParams?.origin?.value} to {searchParams?.destination?.value} • 
        {formatDate(searchParams?.departDate)} - {formatDate(searchParams?.returnDate)} • 
        {searchParams?.passengers} Traveler • 
        {searchParams?.cabin} Class
      </p>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Best Option header */}
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold">Best Option</h2>
              {best && best.centsPerPoint && (
                <div className="text-green-600 font-bold">
                  {parseFloat(best.centsPerPoint).toFixed(1)}¢ per point value
                </div>
              )}
            </div>

            {/* Booking Steps */}
            {best && (
              <div className="space-y-4 mb-6">
                {/* Transfer Points Step */}
                {best.transferFrom && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold">Transfer Points</h3>
                        <p className="text-sm text-gray-600">
                          Transfer {formatPoints(best.points || best.pointsRequired)} points from {best.transferFrom} to {best.program}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Flight Step */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3">
                      {best.transferFrom ? '2' : '1'}
                    </div>
                    <div>
                      <h3 className="font-semibold">Book Flight</h3>
                      <p className="text-sm text-gray-600">
                        Book {searchParams.cabin} class {best.transferFrom ? 'one-way ' : ''}from {searchParams.origin.value} to {searchParams.destination.value} using {best.program} points
                      </p>
                      <p className="text-sm text-gray-500 mt-1">+ {formatCurrency(best.fees)} in taxes/fees</p>
                    </div>
                  </div>
                </div>

                {/* Return Flight Step if round trip */}
                {searchParams.returnDate && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3">
                        {best.transferFrom ? '3' : '2'}
                      </div>
                      <div>
                        <h3 className="font-semibold">Book Flight</h3>
                        <p className="text-sm text-gray-600">
                          Book {searchParams.cabin} class return using American Airlines miles
                        </p>
                        <p className="text-sm text-gray-500 mt-1">+ {formatCurrency(200)} in taxes/fees</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary Section */}
            <div className="mt-8">
              <h3 className="font-bold text-gray-800 mb-4">Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total Points Used</div>
                  <div className="font-bold text-xl">{formatPoints(best?.pointsRequired)} points</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Cash Required</div>
                  <div className="font-bold text-xl">{formatCurrency(best?.fees)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Retail Value</div>
                  <div className="font-bold text-xl">{formatCurrency(best?.cashValue)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 mr-2 text-blue-500 flex items-center justify-center">
                <FaLightbulb />
              </div>
              <h3 className="font-bold text-gray-800">AI Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg relative">
                  <div className="text-sm text-gray-600 mb-1">
                    Value per Point
                    <button 
                      className="ml-1 text-blue-500 hover:text-blue-700"
                      onMouseEnter={() => setShowValueTooltip(true)}
                      onMouseLeave={() => setShowValueTooltip(false)}
                      onFocus={() => setShowValueTooltip(true)}
                      onBlur={() => setShowValueTooltip(false)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setShowValueTooltip(!showValueTooltip);
                        }
                      }}
                      aria-label="Show value per point guide"
                      tabIndex={0}
                    >
                      <FaInfoCircle />
                    </button>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {best && parseFloat(best.centsPerPoint).toFixed(1)}¢/pt
                  </div>
                  {showValueTooltip && (
                    <div className="absolute z-10 w-64 p-4 mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
                      <h4 className="font-semibold mb-2">Cents Per Point Guide</h4>
                      <p className="text-sm text-gray-600 mb-2">Value ranges for point redemptions</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Poor</span>
                          <span>0.3¢ - 0.59¢</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-600">Average</span>
                          <span>0.6¢ - 0.99¢</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-600">Good</span>
                          <span>1.0¢ - 1.49¢</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Great</span>
                          <span>1.5¢ - 2.49¢</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-600">Excellent</span>
                          <span>2.5¢ or more</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t text-sm">
                        <span>Your redemption value: </span>
                        <span className="font-semibold">{best && parseFloat(best.centsPerPoint).toFixed(1)}¢/pt</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Savings</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(best?.cashValue - best?.fees)}
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Points Used</div>
                <div className="text-base">
                  {formatPoints(best?.pointsRequired)} pts ({best?.transferFrom ? `${best.transferFrom}: ${formatPoints(best.pointsRequired)}` : best?.program})
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">AI Analysis</h3>
            <p className="text-gray-700">
              This redemption offers {best && parseFloat(best.centsPerPoint).toFixed(1)}¢ per point in value, which is an excellent redemption rate, with {formatCurrency(best?.fees)} in taxes and fees.
            </p>
          </div>

          {/* How to Book ANA with Virgin Atlantic */}
          {best?.program?.includes('Virgin Atlantic') && (
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 overflow-hidden mb-6">
              <button 
                className="w-full p-4 flex items-center justify-between"
                onClick={() => setShowDetailedGuide(!showDetailedGuide)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowDetailedGuide(!showDetailedGuide);
                  }
                }}
                aria-expanded={showDetailedGuide}
                tabIndex={0}
              >
                <div className="flex items-center">
                  <FaStar className="text-yellow-500 mr-2" />
                  <span className="font-semibold text-yellow-800">How to Book ANA with Virgin Atlantic</span>
                </div>
                {showDetailedGuide ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              
              {showDetailedGuide && (
                <div className="p-4 border-t border-yellow-200">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Search for ANA award availability using United.com (don&apos;t log in)</li>
                    <li>Note the dates and flight numbers where &quot;Saver&quot; awards are available</li>
                    <li>Call Virgin Atlantic at 1-800-365-9500</li>
                    <li>Request to book an ANA partner award with your Flying Club miles</li>
                    <li>Provide the agent with your preferred dates and flight numbers</li>
                    <li>Confirm the miles required and fees (~{formatCurrency(best?.fees)})</li>
                    <li>Complete the booking and save the confirmation details</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white border border-blue-600 text-blue-600 px-4 py-3 rounded-lg font-medium">
              Save Option
            </button>
            <button className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium">
              Book Now
            </button>
          </div>
        </div>

        {/* Alternative Options - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Alternative Options</h3>
            </div>
            <div role="list" aria-label="Alternative redemption options">
              {Array.isArray(alternativeOptions) && alternativeOptions.length > 0 ? (
                alternativeOptions.map((alt, index) => (
                  <div 
                    key={index} 
                    className="p-4 border-b border-gray-100"
                    role="listitem"
                    aria-label={`Alternative option: ${alt.program}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">
                        {alt.program?.includes('American') ? 'All American Airlines' : alt.program}
                      </h4>
                      <div className={`font-bold ${getValueColorClass(alt.centsPerPoint)}`}>
                        {parseFloat(alt.centsPerPoint || 0).toFixed(1)}¢/pt
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-gray-600">
                        Use {formatPoints(alt.pointsRequired || alt.points)} {alt.program?.toLowerCase().includes('american') ? 'aa' : ''} points
                      </div>
                      <div className="text-gray-600">+ {formatCurrency(alt.fees || 0)} in taxes/fees</div>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(alt.pros) && alt.pros.length > 0 ? (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-green-800">Pros:</div>
                          <div className="text-sm text-green-700">
                            {alt.transferFrom ? "Simpler booking process, No need to transfer points" : 
                             alt.pros[0]}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-green-800">Pros:</div>
                          <div className="text-sm text-green-700">
                            {alt.fees < best?.fees ? "Lower taxes and fees" : 
                             alt.pointsRequired < best?.pointsRequired ? "Uses fewer points" : 
                             "Alternative program option"}
                          </div>
                        </div>
                      )}
                      
                      {Array.isArray(alt.cons) && alt.cons.length > 0 ? (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-red-800">Cons:</div>
                          <div className="text-sm text-red-700">
                            {alt.centsPerPoint < best?.centsPerPoint ? "Lower cents per point value" : 
                             alt.pointsRequired > best?.pointsRequired ? "Requires more points" : 
                             "May have limited availability"}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-red-800">Cons:</div>
                          <div className="text-sm text-red-700">
                            {alt.fees < best?.fees ? "Lower taxes and fees" : 
                             alt.pointsRequired < best?.pointsRequired ? "Uses fewer points" : 
                             "Alternative program option"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-500 text-center">
                  <p>No alternative options available.</p>
                  <p className="text-sm mt-2">Try adding more loyalty programs or searching different routes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationResults;