//This file is the mock AI server. Keep it separate as provided. The frontend will not directly rely on its current mock implementation after the changes, but it's there if you want to integrate real AI later.
// ai-server.js - Enhanced version (as provided by user)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// AI reasoning endpoint
app.post('/api/get-ai-reasoning', async (req, res) => {
  try {
    const { query, programs } = req.body;

    if (!query || typeof query !== 'object') {
      return res.status(400).json({ error: 'Query object is required' });
    }

    if (!query.origin || !query.destination) {
      return res.status(400).json({ error: 'Origin and destination required' });
    }

    // --- Mock Logic & Response ---
    // This mock endpoint generates sample data.
    // In a real AI integration, this would call a real AI model
    // to analyze the search query and user programs to suggest redemptions.

    console.log("AI Server received query:", query);
    console.log("AI Server received programs:", programs);

    // *** Replace this mock redemption generation with your AI model call ***
    // For now, it returns a fixed sample data set similar to the London-Tokyo example
    const redemptionResults = {
        best: {
            program: 'Virgin Atlantic Flying Club',
            transferFrom: 'Chase Ultimate Rewards',
            pointsRequired: 67500,
             // Note: AirlinePointsAfterTransfer is an internal calculator detail, AI deals with pointsRequired (from source)
            taxesFees: 550,
            retailValue: 6200,
            centsPerPoint: 8.4,
            hasEnoughPoints: true,
            savings: 5650, // Savings = retailValue - taxesFees
            type: 'transfer', // 'direct' or 'transfer'
            transferRatio: 1, // Example ratio
            transferTime: 'Instant', // Example time
            isSweetSpot: true, // Example flag
            sweetSpotDetails: { // Example sweet spot data structure matching TransferPartnersService
                 id: "ANA_BUSINESS_LHR_HND_VS",
                 name: "ANA Business LHR-HND via Virgin Atlantic",
                 description: "High value ANA Business Class between London and Tokyo.",
                 reasons: ["Low points cost", "Low fees", "Great Business Product"],
                 keyInfo: [{label: "Points", value: "90k RT"}, {label: "Booking", value: "Phone"}],
                 searchWindow: "Book 330 days out",
                 searchTools: ["United.com"],
                 callInstructions: "Call Virgin Atlantic",
                 bookingLink: "https://www.virginatlantic.com"
                 // Add other sweet spot fields...
            },
             // Include tripDetails here if needed by frontend AIInsights/Guide components
             tripDetails: query
        },
        alternatives: [
            {
                program: 'American Airlines AAdvantage',
                 // Assume this is a direct AA booking for the *whole* trip (points required would be estimated)
                 pointsRequired: 85000, // Example estimate
                 taxesFees: 450, // Example estimate
                 retailValue: 6200,
                 centsPerPoint: (6200 - 450) / 85000 * 100, // Calculate CPP
                 hasEnoughPoints: programs.some(p => p.name === 'American Airlines AAdvantage' && p.balance >= 85000), // Check if user has AA points
                 savings: 6200 - 450,
                 type: 'direct',
                 pros: ['Simpler booking process'], // Example pros/cons
                 cons: ['Higher points required', 'Lower cents per point value compared to best']
            },
            {
                program: 'British Airways Executive Club',
                 // Assume direct BA booking
                 pointsRequired: 150000, // BA often requires more Avios for long haul
                 taxesFees: 800, // BA has high fees ex-LHR
                 retailValue: 6200,
                 centsPerPoint: (6200 - 800) / 150000 * 100, // Calculate CPP
                 hasEnoughPoints: programs.some(p => p.name === 'British Airways Executive Club' && p.balance >= 150000), // Check user BA balance
                 savings: 6200 - 800,
                 type: 'direct',
                 pros: ['Direct booking'],
                 cons: ['Very high taxes and fees', 'Poor cents per point value']
            }
             // Add more alternatives...
        ]
    };

    // Use the local RedemptionCalculator to generate the data structure based on the query and programs
    // This overrides the simple mock data above and uses the logic implemented in the frontend util.
    // In a real AI scenario, the AI would generate the *content* (summary, recommendation, factors)
    // and potentially *suggest* the best options (program, points, fees) which you'd then structure.
    // For this exercise, we'll just use the AI server as a passthrough that returns a pre-defined structure,
    // allowing the frontend to use its own calculation logic primarily.
    // Let's return a simple success message and let the frontend calculate/structure the redemptions.

     const aiResponse = {
         summary: "Calculation complete. Review the best and alternative redemption options below.",
         // Frontend will generate redemptions based on searchParams and programs
         // You could add AI-generated recommendation text here if the AI provides it.
         // recommendationText: "Based on your points and this route, this looks like a good option."
     };


    res.json(aiResponse); // Return only the AI summary/recommendation, frontend calculates options

  } catch (error) {
    console.error('AI reasoning error:', error);
    res.status(500).json({ error: 'Failed to generate AI reasoning' });
  }
});

app.listen(5001, () => console.log('AI server running on port 5001'));