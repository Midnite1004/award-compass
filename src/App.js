//This file sets up the main routing and basic layout. It now uses the new project name "Award Compass".
// src/App.js

import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FaHome, FaSearch, FaPlus, FaCreditCard } from 'react-icons/fa';
import Dashboard from './components/Dashboard';
import SearchRedemption from './components/SearchRedemption';
import ConnectAccounts from './components/ConnectAccounts';
import OptimizationResults from './components/OptimizationResults';

/**
 * Custom NavLink component for the top navigation bar.
 * Highlights the link for the active route.
 */
const NavLink = ({ to, icon, label }) => {
  const location = useLocation(); // Use useLocation hook to get current path
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-4 py-3 flex items-center rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className={`mr-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

/**
 * Main App Component
 * Sets up routing and the main application layout.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-blue-600 tracking-tight">Award Compass</span> {/* Changed project name */}
              </div>
              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-2">
                <NavLink to="/" icon={<FaHome />} label="Dashboard" />
                <NavLink to="/search" icon={<FaSearch />} label="Search" />
                <NavLink to="/connect" icon={<FaPlus />} label="Programs" /> {/* Changed label */}
              </div>
            </div>
            {/* Pro Features Button (Placeholder) */}
            <div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                <FaCreditCard className="mr-2" />
                <span>Pro Features</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar - fixed at the bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-3 h-16"> {/* 3 columns for 3 main links */}
           {/* NavLink handles active state */}
          <NavLink to="/" icon={<FaHome className="text-lg" />} label="Dashboard" />
          <NavLink to="/search" icon={<FaSearch className="text-lg" />} label="Search" />
          <NavLink to="/connect" icon={<FaPlus className="text-lg" />} label="Programs" />
        </div>
      </div>

      {/* Main content area, padding at bottom for mobile fixed nav */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mb-20 md:mb-0"> {/* mb-20 adds space above mobile nav */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<SearchRedemption />} />
          <Route path="/connect" element={<ConnectAccounts />} />
          <Route path="/results" element={<OptimizationResults />} /> {/* Route for results page */}
          {/* Removed the /demo-results route as calculation is now handled */}
        </Routes>
      </main>
    </div>
  );
}