// src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/redemptionValueUtils'; // Import formatCurrency

// Function to determine the warning icon based on expiry date
const getExpiryWarningIcon = (dateStr) => {
  if (!dateStr) return null;
  try {
    const expiryDate = new Date(dateStr);
    if (isNaN(expiryDate.getTime())) return null; // Invalid date
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (expiryDate <= thirtyDaysFromNow && expiryDate >= today) {
      return <FaExclamationTriangle className="text-orange-500" title="Expires within 30 days" />;
    }
    // Add more conditions here if needed (e.g., for expired points)
  } catch (e) {
    console.error("Error parsing date for warning icon:", dateStr, e);
  }
  return null; // No warning icon if not expiring soon or error
};

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0); // State for total points
  const [totalValue, setTotalValue] = useState(0);
  const [expiringPoints, setExpiringPoints] = useState(0);
  const [expiringProgram, setExpiringProgram] = useState(null);
  
  // Calculate how many points expire within 3 months
  const getExpiringPoints = (programsList) => {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    threeMonthsFromNow.setHours(0, 0, 0, 0); // Compare at start of day

    let mostUrgent = null;
    let earliestExpiry = null;
    let totalExpiring = 0; // Track total expiring points

    programsList.forEach(program => {
      if (program.expiry) {
        try {
          const expiryDate = new Date(program.expiry);
          expiryDate.setHours(0, 0, 0, 0); // Compare at start of day

          if (expiryDate <= threeMonthsFromNow) {
             // Ensure program balance is a number
             const balance = typeof program.balance === 'number' ? program.balance : 0;
             totalExpiring += balance;

            // Track the program with the earliest expiration that still has points
            if (balance > 0 && (!earliestExpiry || expiryDate < earliestExpiry)) {
              earliestExpiry = expiryDate;
              mostUrgent = program;
            }
          }
        } catch (e) {
          console.error("Invalid expiry date format for program", program.name, program.expiry, e);
          // Optionally add this program to a list of programs with invalid dates
        }
      }
    });
    
    setExpiringProgram(mostUrgent);
    return totalExpiring; // Return the sum of expiring points
  };
  
  useEffect(() => {
    const loadedPrograms = JSON.parse(localStorage.getItem('programs') || '[]');
    setPrograms(loadedPrograms);
    
    // Calculate total points
    const totalPts = loadedPrograms.reduce((sum, program) => sum + (typeof program.balance === 'number' ? program.balance : 0), 0); // Ensure balance is number
    setTotalPoints(totalPts);

    // Calculate estimated total value (estimating 1.5 cents per point as a simple average)
    const estimatedValue = totalPts * 0.015; // 1.5 cents = $0.015 per point
    setTotalValue(estimatedValue); 
    
    setExpiringPoints(getExpiringPoints(loadedPrograms));
  }, []);
  
  // Function to truncate long program names for charts
  const formatProgramName = (name, maxLength = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };
  
  // Prepare chart data with truncated names
   // Filter out programs with 0 balance before creating chart data
   const programsWithBalance = programs.filter(program => typeof program.balance === 'number' && program.balance > 0);

   const pieData = programsWithBalance.map(program => ({
       name: formatProgramName(program.name),
       fullName: program.name,
       value: program.balance,
       type: program.type
   }));
  
  // Colors for pie chart (can expand this list)
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#f08080', '#c0c0c0', '#add8e6'];
  
  // Format for expiry dates
  const formatExpiry = (dateStr) => {
    if (!dateStr) return 'No expiry';
    try {
      const date = new Date(dateStr);
       if (isNaN(date.getTime())) return 'Invalid Date';
       return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  // Custom pie chart label renderer that handles long names
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show label if slice is large enough (e.g., > 5%)
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
         fontWeight="bold" // Make label bold
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };
  
  // Custom tooltip for the pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
       // Calculate percentage of total points
       const total = pieData.reduce((sum, d) => sum + d.value, 0);
       const percentage = total > 0 ? (data.value / total) * 100 : 0;

      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-sm"> {/* Added text-sm */}
          <p className="font-medium text-gray-800">{data.fullName}</p> {/* Use full name */}
          <p className="text-gray-700">{data.value.toLocaleString()} points</p> {/* Format balance */}
          <p className="text-gray-600">{percentage.toFixed(1)}% of total</p> {/* Format percentage */}
           {/* Add estimated value for this program */}
           <p className="text-green-600">Est. Value: {formatCurrency(data.value * 0.015)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for the bar chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-sm"> {/* Added text-sm */}
          <p className="font-medium text-gray-800">{data.fullName}</p> {/* Use full name */}
          <p className="text-gray-700">{data.value.toLocaleString()} points</p> {/* Format balance */}
          <p className="text-green-600">Est. Value: {formatCurrency(data.value * 0.015)}</p> {/* Format estimated value */}
        </div>
      );
    }
    return null;
  };
  
  // Prepare data for bar chart (top N by balance)
  const barData = [...programsWithBalance] // Use programs with balance
    .sort((a, b) => b.balance - a.balance) // Sort by balance
    .slice(0, 5) // Show only top 5 programs
    .map(program => ({ // Map to data structure expected by BarChart
        name: formatProgramName(program.name), // Truncated name for axis
        fullName: program.name, // Full name for tooltip
        value: program.balance // Points balance
    }));


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Your Loyalty Dashboard</h2>
        <Link to="/connect" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"> {/* Added hover */}
          <FaPlus className="mr-2" /> Add Program
        </Link>
      </div>
      
      {programs.length === 0 ? (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">Welcome to Award Compass!</h3> {/* Changed project name */}
          <p className="text-blue-600 mb-4">Start by adding your loyalty programs to see your points value and redemption options.</p>
          <Link to="/connect" className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center hover:bg-blue-700"> {/* Added hover */}
            <FaPlus className="mr-2" /> Add Your First Program
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Total Points Across Programs</h3> {/* Clarified label */}
              <p className="text-2xl font-bold text-gray-800">{totalPoints.toLocaleString()}</p> {/* Use totalPoints state */}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Estimated Total Value</h3> {/* Clarified label */}
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p> {/* Use formatCurrency */}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Points Expiring Soon (90 days)</h3> {/* Clarified label */}
              {expiringPoints > 0 ? (
                <>
                  <p className="text-2xl font-bold text-orange-500">{expiringPoints.toLocaleString()} pts</p> {/* Use expiringPoints state */}
                  {expiringProgram && ( // Display most urgent program if exists
                    <p className="text-sm text-orange-600 mt-1">
                      Most Urgent: {expiringProgram.name} ({formatExpiry(expiringProgram.expiry)})
                    </p>
                  )}
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-600">None</p>
              )}
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Points Distribution by Program</h3> {/* Clarified title */}
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData} // Use pieData derived from programsWithBalance
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                         isAnimationActive={false} // Disable animation for cleaner initial render
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip pieData={pieData} />} /> {/* Pass pieData to tooltip */}
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No programs with positive point balance to display
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Programs by Balance</h3> {/* Clarified title */}
              {barData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" hide={true} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120} 
                        tick={{ fontSize: 12, fill: '#333' }} // Styled ticks
                        axisLine={false} // Hide axis line
                        tickLine={false} // Hide tick lines
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 4, 4]} /> {/* Added radius */}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No programs with positive point balance to display
                </div>
              )}
            </div>
          </div>
          
          {/* Programs Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-700 p-4 border-b">Your Loyalty Programs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value</th>
                     {/* Removed Actions column from dashboard view */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programs.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{program.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{program.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{program.balance.toLocaleString()} pts</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {program.expiry ? (
                            <>
                              <div className="text-sm text-gray-500 mr-2">
                                {formatExpiry(program.expiry)}
                              </div>
                              {getExpiryWarningIcon(program.expiry)}
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">No expiry</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600">{formatCurrency((typeof program.balance === 'number' ? program.balance : 0) * 0.015, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </td>
                       {/* Removed Actions column data */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}