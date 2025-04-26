// src/components/ConnectAccounts.js

import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaPlane, FaHotel, FaPencilAlt, FaTrash, FaPlus, FaSearch, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

// Comprehensive database of loyalty programs (same as provided)
const loyaltyPrograms = [
  // Airline Programs - grouped by alliance
  // Star Alliance
  { id: 'united', name: 'United MileagePlus', type: 'airline', alliance: 'Star Alliance' },
  { id: 'lufthansa', name: 'Lufthansa Miles & More', type: 'airline', alliance: 'Star Alliance' },
  { id: 'singapore', name: 'Singapore KrisFlyer', type: 'airline', alliance: 'Star Alliance' },
  { id: 'air-canada', name: 'Air Canada Aeroplan', type: 'airline', alliance: 'Star Alliance' },
  { id: 'ana', name: 'ANA Mileage Club', type: 'airline', alliance: 'Star Alliance' },
  { id: 'turkish', name: 'Turkish Airlines Miles&Smiles', type: 'airline', alliance: 'Star Alliance' },
  { id: 'copa', name: 'Copa ConnectMiles', type: 'airline', alliance: 'Star Alliance' },

  // OneWorld
  { id: 'american', name: 'American Airlines AAdvantage', type: 'airline', alliance: 'OneWorld' },
  { id: 'british', name: 'British Airways Executive Club', type: 'airline', alliance: 'OneWorld' },
  { id: 'cathay', name: 'Cathay Pacific Asia Miles', type: 'airline', alliance: 'OneWorld' },
  { id: 'qantas', name: 'Qantas Frequent Flyer', type: 'airline', alliance: 'OneWorld' },
  { id: 'japan', name: 'Japan Airlines Mileage Bank', type: 'airline', alliance: 'OneWorld' },
  { id: 'qatar', name: 'Qatar Airways Privilege Club', type: 'airline', alliance: 'OneWorld' },

  // SkyTeam
  { id: 'delta', name: 'Delta SkyMiles', type: 'airline', alliance: 'SkyTeam' },
  { id: 'air-france', name: 'Air France-KLM Flying Blue', type: 'airline', alliance: 'SkyTeam' },
  { id: 'korean', name: 'Korean Air SKYPASS', type: 'airline', alliance: 'SkyTeam' },
  { id: 'aeromexico', name: 'Aeromexico Club Premier', type: 'airline', alliance: 'SkyTeam' },

  // Non-Alliance Airlines
  { id: 'southwest', name: 'Southwest Rapid Rewards', type: 'airline', alliance: null },
  { id: 'jetblue', name: 'JetBlue TrueBlue', type: 'airline', alliance: null },
  { id: 'alaska', name: 'Alaska Airlines Mileage Plan', type: 'airline', alliance: null },
  { id: 'virgin-atlantic', name: 'Virgin Atlantic Flying Club', type: 'airline', alliance: null },
  { id: 'emirates', name: 'Emirates Skywards', type: 'airline', alliance: null },
  { id: 'etihad', name: 'Etihad Guest', type: 'airline', alliance: null },

  // Hotel Programs
  { id: 'marriott', name: 'Marriott Bonvoy', type: 'hotel' },
  { id: 'hilton', name: 'Hilton Honors', type: 'hotel' },
  { id: 'hyatt', name: 'World of Hyatt', type: 'hotel' },
  { id: 'ihg', name: 'IHG One Rewards', type: 'hotel' },
  { id: 'accor', name: 'Accor Live Limitless', type: 'hotel' },
  { id: 'radisson', name: 'Radisson Rewards', type: 'hotel' },
  { id: 'choice', name: 'Choice Privileges', type: 'hotel' },
  { id: 'wyndham', name: 'Wyndham Rewards', type: 'hotel' },

  // Credit Card Programs
  { id: 'amex', name: 'American Express Membership Rewards', type: 'card' },
  { id: 'chase', name: 'Chase Ultimate Rewards', type: 'card' },
  { id: 'citi', name: 'Citi ThankYou Rewards', type: 'card' },
  { id: 'capital-one', name: 'Capital One Miles', type: 'card' },
  { id: 'discover', name: 'Discover it Miles', type: 'card' },
  { id: 'bilt', name: 'Bilt Rewards', type: 'card' },
  { id: 'usbank', name: 'US Bank FlexPerks', type: 'card' },
  { id: 'hsbc', name: 'HSBC Rewards', type: 'card' }
];

export default function ConnectAccounts() {
  const [list, setList] = useState([]);
  const emptyForm = { name: '', type: 'airline', balance: 0, expiry: '' }; // Changed variable name
  const [form, setForm] = useState(emptyForm); // Use emptyForm
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [selectedType, setSelectedType] = useState('airline');
  const [showDropdown, setShowDropdown] = useState(false);

  // Load programs from localStorage on mount
  useEffect(() => {
    setList(JSON.parse(localStorage.getItem('programs') || '[]'));
  }, []);

  // Filter programs based on search term and selected type
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = loyaltyPrograms.filter(program =>
      (lowerSearchTerm === '' ||
        program.name.toLowerCase().includes(lowerSearchTerm) ||
        (program.alliance && program.alliance.toLowerCase().includes(lowerSearchTerm))) &&
      program.type === selectedType // Filter by selected type
    );
    setFilteredPrograms(filtered);

    // Show dropdown only if there's a search term and results, or if search term is empty but there are filtered results for the type
    setShowDropdown(searchTerm.length > 0 ? filtered.length > 0 : filtered.length > 0);

  }, [searchTerm, selectedType, list]); // Added list to dependencies to update filters when list changes

  // Check if the current program would create a duplicate
  const isDuplicate = () => {
    if (!form.name) return false;
    const lowerFormName = form.name.toLowerCase();
    // In edit mode, exclude the program being edited from the duplicate check
    if (editMode && editId) {
      return list.some(p =>
        p.name.toLowerCase() === lowerFormName &&
        p.id !== editId
      );
    }
    // For new programs, check if any existing program has the same name
    return list.some(p => p.name.toLowerCase() === lowerFormName);
  };

  const saveProgram = () => {
    if (!form.name) {
      alert('Please select a program name.'); // Changed alert text
      return;
    }

    // Find the program from the master list to get its canonical name and type
    const selectedProgramDetails = loyaltyPrograms.find(p =>
        p.name.toLowerCase() === form.name.toLowerCase()
    );

    if (!selectedProgramDetails) {
        alert('Please select a valid program from the suggested list.');
        return;
    }

    // Use the canonical name and type from the master list
    const programToSave = {
        ...form, // Keep balance, expiry from form
        name: selectedProgramDetails.name, // Use canonical name
        type: selectedProgramDetails.type, // Use canonical type
        // ID handled below
    };


    // Check for duplicate program using the canonical name
    if (isDuplicate()) {
      const existingProgram = list.find(p =>
        p.name.toLowerCase() === programToSave.name.toLowerCase()
      );
      alert(`You already have a ${programToSave.name} account. Please edit the existing account.`);
      // Optionally redirect to edit view or just show the message
      editProgram(existingProgram); // Automatically go to edit
      return;
    }

    let updatedList;

    if (editMode && editId) {
      // Keep the connected status when updating (if applicable, based on your model)
      const existingProgram = list.find(p => p.id === editId);
      const connected = existingProgram && existingProgram.connected ? true : false;

      updatedList = list.map(p => p.id === editId ? { ...programToSave, id: editId, connected } : p);
    } else {
      // For manual entry, default to not connected, generate new ID
      updatedList = [...list, { ...programToSave, id: Date.now().toString(), connected: false }]; // Use timestamp as simple ID
    }

    localStorage.setItem('programs', JSON.stringify(updatedList));
    setList(updatedList);
    setForm(emptyForm); // Reset form
    setEditMode(false);
    setEditId(null); // Reset editId
    setShowForm(false); // Hide form after saving
    setSearchTerm(''); // Clear search term
  };

  const deleteProgram = (id) => {
    if (window.confirm('Are you sure you want to delete this program?')) { // Added confirmation
      const updated = list.filter(p => p.id !== id);
      localStorage.setItem('programs', JSON.stringify(updated));
      setList(updated);
    }
  };

  const editProgram = (program) => {
    // Set form state with the program details to be edited
    setForm(program);
    setEditId(program.id);
    setEditMode(true);
    setSelectedType(program.type);

    // Set the search term input value to the program name
    setSearchTerm(program.name);
    // No need to filter or show dropdown immediately in edit mode
    setFilteredPrograms([]); // Clear filtered list
    setShowDropdown(false); // Hide dropdown

    // Show the form for editing
    setShowForm(true);
  };

  const cancelEdit = () => {
    setForm(emptyForm); // Reset form state
    setEditMode(false);
    setEditId(null); // Reset edit ID
    setShowForm(false); // Hide form
    setSearchTerm(''); // Clear search term
    setFilteredPrograms([]); // Clear filtered list
  };

  const handleProgramSelect = (program) => {
    // When a program is selected from the dropdown:

    // Check if this program (by canonical name) already exists in the list
    const existingProgram = list.find(p =>
      p.name.toLowerCase() === program.name.toLowerCase()
    );

    if (existingProgram && !editMode) {
      // If it exists and we are NOT currently in edit mode, alert the user
      // and transition to editing the existing program instead.
      alert(`You already have a ${program.name} account. Redirecting you to edit the existing account.`);
      editProgram(existingProgram);
      return; // Stop the current select process
    }

    // If it doesn't exist, or if we ARE in edit mode (meaning we might be renaming or confirming),
    // update the form with the selected program's details.
    setForm({
      ...form, // Keep existing balance/expiry if editing
      name: program.name, // Set canonical name
      type: program.type // Set canonical type
    });
    setSelectedType(program.type); // Update type selection in UI
    setSearchTerm(program.name); // Set the input field to the selected name
    setShowDropdown(false); // Hide the dropdown

    // If we were adding a new program, ensure the form is visible
    if (!showForm) {
      setShowForm(true);
    }
  };


  const selectType = (type) => {
    setSelectedType(type);
    // Reset program name and search term when changing type
    setForm({...emptyForm, type}); // Reset balance/expiry too when changing type
    setSearchTerm('');
    setFilteredPrograms(loyaltyPrograms.filter(p => p.type === type)); // Filter dropdown immediately
    setShowDropdown(true); // Show dropdown for the new type
    setEditMode(false); // Exit edit mode if changing type
    setEditId(null);
  };

  // Import accounts from common providers (simulated quick-connect)
  const importFromProvider = (providerId) => {
    const matchingProgram = loyaltyPrograms.find(p => p.id === providerId);

    if (!matchingProgram) {
        console.error(`Program with ID ${providerId} not found.`);
        return;
    }

    // Check if this program already exists
    const existingProgram = list.find(p => p.name === matchingProgram.name);

    if (existingProgram) {
      alert(`You already have a ${existingProgram.name} account. Please edit the existing account.`);
      editProgram(existingProgram);
      return;
    }

    // Use a standard starting balance (could be random or zero)
    const points = 1000; // Starting balance

    const newProgram = {
      id: Date.now().toString() + '_' + providerId, // Use ID + timestamp for uniqueness
      name: matchingProgram.name,
      type: matchingProgram.type,
      balance: points,
      expiry: '', // Default empty expiry
      connected: true // Mark as 'quick-connected'
    };

    const updated = [...list, newProgram];
    localStorage.setItem('programs', JSON.stringify(updated));
    setList(updated);

    alert(`Successfully added ${matchingProgram.name}! Please edit its balance to match your actual points.`);
  };

  const getProgramIcon = (type) => {
    switch (type) {
      case 'airline': return <FaPlane className="text-blue-500" />;
      case 'hotel': return <FaHotel className="text-orange-500" />;
      case 'card': return <FaCreditCard className="text-purple-500" />;
      default: return <FaCreditCard className="text-gray-500" />;
    }
  };

  // Calculate and return appropriate expiry warning icon
  const getExpiryWarningIcon = (expiryDateStr) => {
    if (!expiryDateStr) return null;

    try {
        const today = new Date();
        const expiry = new Date(expiryDateStr);
        // Set time to start of day for comparison
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) {
             return (
                <span className="relative group text-red-500 ml-1" title="Points expired!">
                     <FaExclamationTriangle />
                     <span className="absolute z-10 hidden group-hover:block bg-black text-white text-xs rounded p-1 whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
                        Points expired on {new Date(expiryDateStr).toLocaleDateString()}
                     </span>
                </span>
            );
        }
        // Critical: Less than 30 days
        if (daysRemaining <= 30) {
          return (
            <span className="relative group text-red-500 ml-1" title={`Expires in ${daysRemaining} days!`}>
              <FaExclamationTriangle />
               <span className="absolute z-10 hidden group-hover:block bg-black text-white text-xs rounded p-1 whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
                   Critical: Points expire in {daysRemaining} day{daysRemaining > 1 ? 's' : ''}! Use them soon.
              </span>
            </span>
          );
        }

        // Warning: Less than 90 days
        if (daysRemaining <= 90) {
          return (
            <span className="relative group text-yellow-500 ml-1" title={`Expires in ${daysRemaining} days.`}>
              <FaExclamationTriangle />
               <span className="absolute z-10 hidden group-hover:block bg-black text-white text-xs rounded p-1 whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
                   Warning: Points expire in {daysRemaining} day{daysRemaining > 1 ? 's' : ''}. Plan your redemption soon.
              </span>
            </span>
          );
        }

        // Notice: Less than 180 days (Optional, can remove if too noisy)
        if (daysRemaining <= 180) {
          return (
             <span className="relative group text-blue-500 ml-1" title={`Expires in ${daysRemaining} days.`}>
                 <FaInfoCircle />
                  <span className="absolute z-10 hidden group-hover:block bg-black text-white text-xs rounded p-1 whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
                      Notice: Points expire in {daysRemaining} day{daysRemaining > 1 ? 's' : ''}.
                 </span>
             </span>
          );
        }

        return null; // No warning needed
    } catch (e) {
        console.error("Error calculating expiry date:", expiryDateStr, e);
        return <span className="text-gray-500 ml-1" title="Invalid date format"><FaInfoCircle/></span>;
    }
  };


  // Group programs by alliance or type for display in dropdown
  const groupedPrograms = filteredPrograms.reduce((acc, program) => {
    if (program.type === 'airline' && program.alliance) {
      if (!acc[program.alliance]) {
        acc[program.alliance] = [];
      }
      acc[program.alliance].push(program);
    } else {
      const key = program.type === 'airline' ? 'Other Airlines' :
                 program.type === 'hotel' ? 'Hotels' : 'Credit Cards';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(program);
    }
    // Sort programs alphabetically within each group
    Object.keys(acc).forEach(key => {
        acc[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    return acc;
  }, {});


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Connect Loyalty Programs</h2>

      {/* One-Click Import Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Connect (Sample Data)</h3> {/* Clarified it's sample data */}
        <div className="text-sm text-gray-600 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"> {/* Added flex-shrink */}
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Quick connect adds programs with 1,000 sample points. Remember to edit them to reflect your actual balances and expiry dates.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Credit Card Quick Connects */}
          <div
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition"
            onClick={() => importFromProvider('amex')}
          >
            <div className="flex items-center">
              <FaCreditCard className="text-purple-500" />
              <span className="ml-2 font-medium">Amex Membership Rewards</span>
            </div>
            <button type="button" className="text-blue-600 text-sm hover:underline">Connect</button> {/* Added type="button" */}
          </div>

          <div
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition"
            onClick={() => importFromProvider('chase')}
          >
            <div className="flex items-center">
              <FaCreditCard className="text-purple-500" />
              <span className="ml-2 font-medium">Chase Ultimate Rewards</span>
            </div>
             <button type="button" className="text-blue-600 text-sm hover:underline">Connect</button>
          </div>

          {/* Airline Quick Connects */}
          <div
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition"
            onClick={() => importFromProvider('virgin-atlantic')}
          >
            <div className="flex items-center">
              <FaPlane className="text-blue-500" />
              <span className="ml-2 font-medium">Virgin Atlantic Flying Club</span>
            </div>
             <button type="button" className="text-blue-600 text-sm hover:underline">Connect</button>
          </div>

          <div
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition"
            onClick={() => importFromProvider('american')}
          >
            <div className="flex items-center">
              <FaPlane className="text-blue-500" />
              <span className="ml-2 font-medium">American AAdvantage</span>
            </div>
             <button type="button" className="text-blue-600 text-sm hover:underline">Connect</button>
          </div>

          <div
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition"
            onClick={() => importFromProvider('delta')}
          >
            <div className="flex items-center">
              <FaPlane className="text-blue-500" />
              <span className="ml-2 font-medium">Delta SkyMiles</span>
            </div>
             <button type="button" className="text-blue-600 text-sm hover:underline">Connect</button>
          </div>

          {/* Hotel Quick Connect */}
          <div
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition"
            onClick={() => importFromProvider('marriott')}
          >
            <div className="flex items-center">
              <FaHotel className="text-orange-500" />
              <span className="ml-2 font-medium">Marriott Bonvoy</span>
            </div>
             <button type="button" className="text-blue-600 text-sm hover:underline">Connect</button>
          </div>
        </div>
      </div>

      {/* Manual Entry Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Manual Entry</h3>
          {!showForm && (
            <button
              type="button" // Added type="button"
              className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center hover:bg-blue-700"
              onClick={() => setShowForm(true)}
            >
              <FaPlus className="mr-2" /> Add Program
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="space-y-3">
              {/* Program Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button" // Added type="button"
                    className={`p-2 rounded-lg flex justify-center items-center ${selectedType === 'airline' ? 'bg-blue-100 border-blue-300 border text-blue-700' : 'bg-white border border-gray-300 text-gray-700'}`}
                    onClick={() => selectType('airline')}
                  >
                    <FaPlane className={`mr-2 ${selectedType === 'airline' ? 'text-blue-600' : 'text-gray-500'}`} />
                    Airline
                  </button>
                  <button
                    type="button" // Added type="button"
                    className={`p-2 rounded-lg flex justify-center items-center ${selectedType === 'hotel' ? 'bg-blue-100 border-blue-300 border text-blue-700' : 'bg-white border border-gray-300 text-gray-700'}`}
                    onClick={() => selectType('hotel')}
                  >
                    <FaHotel className={`mr-2 ${selectedType === 'hotel' ? 'text-blue-600' : 'text-gray-500'}`} />
                    Hotel
                  </button>
                  <button
                    type="button" // Added type="button"
                    className={`p-2 rounded-lg flex justify-center items-center ${selectedType === 'card' ? 'bg-blue-100 border-blue-300 border text-blue-700' : 'bg-white border border-gray-300 text-gray-700'}`}
                    onClick={() => selectType('card')}
                  >
                    <FaCreditCard className={`mr-2 ${selectedType === 'card' ? 'text-blue-600' : 'text-gray-500'}`} />
                    Credit Card
                  </button>
                </div>
              </div>

              {/* Program Name Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                <div className="flex border rounded-md overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <div className="bg-gray-100 p-2 flex items-center">
                    <FaSearch className="text-gray-500" />
                  </div>
                  <input
                    type="text" // Changed type from "input"
                    className="flex-1 p-2 border-0 focus:outline-none focus:ring-0"
                    placeholder={`Search for ${selectedType} programs...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        // Show dropdown on focus, but don't clear if already editing
                        if (!editMode) setShowDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 100)} // Hide dropdown on blur, delay to allow click
                  />
                </div>

                {/* Autocomplete Dropdown */}
                 {showDropdown && ( // Only show if showDropdown state is true
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {Object.entries(groupedPrograms).length > 0 ? (
                         Object.entries(groupedPrograms).map(([group, programs]) => (
                           <div key={group}>
                             <div className="sticky top-0 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
                               {group}
                             </div>
                             <div>
                               {programs.map(program => (
                                 <div
                                   key={program.id}
                                   className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                                   onClick={() => handleProgramSelect(program)}
                                 >
                                   {getProgramIcon(program.type)}
                                   <span className="ml-2">{program.name}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ))
                     ) : (
                          <div className="px-4 py-2 text-gray-500">No programs found for this type and search term.</div>
                     )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                <input
                  type="number"
                  className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Points balance"
                  value={form.balance}
                  onChange={e => setForm({...form, balance: +e.target.value})}
                  min="0" // Added min attribute
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (optional)</label>
                <input
                  type="date"
                  className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.expiry}
                  onChange={e => setForm({...form, expiry: e.target.value})}
                />
              </div>

              <div className="flex justify-center space-x-4 pt-2">
                <button
                  type="button" // Added type="button"
                  className={`${isDuplicate() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg w-36`}
                  onClick={saveProgram}
                  disabled={isDuplicate() || !form.name || form.balance === ''} // Disabled if duplicate, no name, or empty balance
                >
                  {editMode ? 'Update' : 'Save'}
                </button>
                <button
                  type="button" // Added type="button"
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg w-36 hover:bg-gray-400"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Programs List */}
        {list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connected Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map(program => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getProgramIcon(program.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900">{program.name}</span>
                         {/* Indicate quick-connected programs */}
                         {program.connected && <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Connected</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 capitalize">{program.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{program.balance.toLocaleString()} pts</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {program.expiry ? (
                          <>
                            <div className="text-sm text-gray-500 mr-2">
                              {new Date(program.expiry).toLocaleDateString()}
                            </div>
                            {getExpiryWarningIcon(program.expiry)}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">No expiry</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button" // Added type="button"
                        onClick={() => editProgram(program)}
                        className="text-blue-600 hover:text-blue-900 mr-3 disabled:text-gray-400" // Added disabled style
                         disabled={editMode && editId === program.id} // Disable if this program is currently being edited
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        type="button" // Added type="button"
                        onClick={() => deleteProgram(program.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No programs added yet. Click "Add Program" to get started.
          </div>
        )}
      </div>
    </div>
  );
}