// Machine Learning Integration for FloodSafe System

// Simple ML model for flood prediction (in a real implementation, this would call a backend API)
class FloodPredictionModel {
    constructor() {
      // Pre-trained model weights (simplified for demonstration)
      this.weights = {
        rainfall: 0.7,
        waterLevel: 0.8,
        soilSaturation: 0.5,
        temperature: -0.2,
        humidity: 0.3
      };
      this.threshold = {
        low: 0.3,
        moderate: 0.6,
        high: 0.8
      };
    }
    
    // Predict flood risk based on current conditions
    predictFloodRisk(data) {
      // Calculate weighted sum of features
      let score = 0;
      score += (data.rainfall || 0) * this.weights.rainfall;
      score += (data.waterLevel || 0) * this.weights.waterLevel;
      score += (data.soilSaturation || 0) * this.weights.soilSaturation;
      score += (data.temperature || 0) * this.weights.temperature;
      score += (data.humidity || 0) * this.weights.humidity;
      
      // Normalize score between 0 and 1
      score = Math.max(0, Math.min(1, score));
      
      // Determine risk level
      let risk = 'Low';
      if (score >= this.threshold.high) {
        risk = 'High';
      } else if (score >= this.threshold.moderate) {
        risk = 'Moderate';
      }
      
      return {
        score: score,
        risk: risk,
        confidence: 0.85 + (Math.random() * 0.1 - 0.05) // Add slight randomness to confidence
      };
    }
    
    // Predict water level change
    predictWaterLevelChange(currentLevel, rainfall) {
      // Simple model: water rises based on rainfall and current level
      const baseRise = rainfall * 0.5;
      const levelFactor = Math.max(0, 1 - (currentLevel / 100)); // Less rise when already high
      
      return baseRise * levelFactor;
    }
    
    // Generate recommendation based on prediction
    generateRecommendation(risk, location) {
      if (risk === 'High') {
        return `Evacuate immediately from ${location} area. Flood warning in effect.`;
      } else if (risk === 'Moderate') {
        return `Prepare for possible evacuation in low-lying areas near ${location}.`;
      } else {
        return `Monitor conditions in ${location} area. No immediate action required.`;
      }
    }
  }
  
  // Smart routing model
  class SmartRoutingModel {
    constructor() {
      this.floodData = [];
      this.trafficData = [];
    }
    
    // Update with latest flood and traffic data
    updateData(floodData, trafficData) {
      this.floodData = floodData;
      this.trafficData = trafficData;
    }
    
    // Find optimal route based on priority
    findOptimalRoute(start, end, priority = 'balanced') {
      // In a real implementation, this would use a pathfinding algorithm
      // with weights based on the priority
      
      // Simulate different routes based on priority
      let route = {
        time: 0,
        distance: 0,
        safety: 0,
        insight: ''
      };
      
      if (priority === 'fastest') {
        route.time = 20 + Math.floor(Math.random() * 8);
        route.distance = 4.8 + (Math.random() * 0.8);
        route.safety = 5 + Math.floor(Math.random() * 3);
        route.insight = 'This is the fastest route but passes through 2 areas with moderate flood risk.';
      } else if (priority === 'safest') {
        route.time = 28 + Math.floor(Math.random() * 10);
        route.distance = 6.2 + (Math.random() * 1.2);
        route.safety = 9 + Math.floor(Math.random() * 2);
        route.insight = 'This route completely avoids all flood-prone areas but takes longer.';
      } else { // balanced
        route.time = 24 + Math.floor(Math.random() * 6);
        route.distance = 5.2 + (Math.random() * 0.6);
        route.safety = 7 + Math.floor(Math.random() * 2);
        route.insight = 'This route avoids 3 flood-prone areas and 1 road with heavy traffic. Alternative routes available.';
      }
      
      return route;
    }
  }
  
  // Initialize models when document is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize flood prediction model
    const floodModel = new FloodPredictionModel();
    
    // Initialize smart routing model
    const routingModel = new SmartRoutingModel();
    
    // Update prediction card if on data page
    if (document.getElementById('flood-risk-24h')) {
      updateFloodPredictions(floodModel);
      
      // Update predictions every 5 minutes
      setInterval(() => {
        updateFloodPredictions(floodModel);
      }, 5 * 60 * 1000);
    }
    
    // Set up smart routing if on navigation page
    if (document.getElementById('priority-fastest')) {
      setupSmartRouting(routingModel);
    }
  });
  
  // Update flood prediction UI
  function updateFloodPredictions(model) {
    // Get current sensor data (in a real implementation, this would come from your API)
    const currentData = {
      rainfall: 25 + (Math.random() * 10 - 5), // mm in last hour
      waterLevel: 45 + (Math.random() * 20 - 10), // cm
      soilSaturation: 0.7 + (Math.random() * 0.2 - 0.1), // 0-1 scale
      temperature: 28 + (Math.random() * 4 - 2), // Celsius
      humidity: 75 + (Math.random() * 10 - 5) // Percentage
    };
    
    // Get 24h prediction
    const prediction24h = model.predictFloodRisk(currentData);
    
    // Simulate 48h prediction (usually worse in a flood scenario)
    const prediction48h = model.predictFloodRisk({
      ...currentData,
      rainfall: currentData.rainfall * 1.5,
      waterLevel: currentData.waterLevel * 1.2
    });
    
    // Predict water level change
    const waterLevelChange = model.predictWaterLevelChange(currentData.waterLevel, currentData.rainfall);
    
    // Generate recommendation
    const recommendation = model.generateRecommendation(
      prediction24h.risk, 
      'Southwoods Road'
    );
    
    // Update UI
    document.getElementById('confidence-bar').style.width = `${prediction24h.confidence * 100}%`;
    document.getElementById('confidence-bar').nextElementSibling.textContent = `${Math.round(prediction24h.confidence * 100)}%`;
    
    const risk24hElement = document.getElementById('flood-risk-24h');
    risk24hElement.textContent = prediction24h.risk;
    risk24hElement.className = `px-3 py-1 rounded-full ${getRiskClass(prediction24h.risk)}`;
    
    const risk48hElement = document.getElementById('flood-risk-48h');
    risk48hElement.textContent = prediction48h.risk;
    risk48hElement.className = `px-3 py-1 rounded-full ${getRiskClass(prediction48h.risk)}`;
    
    document.getElementById('water-level-prediction').textContent = 
      waterLevelChange > 0 ? `+${waterLevelChange.toFixed(1)}cm` : `${waterLevelChange.toFixed(1)}cm`;
    
    document.getElementById('ml-recommendation').textContent = recommendation;
  }
  
  // Set up smart routing UI and interactions
  function setupSmartRouting(model) {
    // Set up priority buttons
    document.getElementById('priority-fastest').addEventListener('click', function() {
      updatePriorityButtons('fastest');
      updateRouteDisplay(model, 'fastest');
    });
    
    document.getElementById('priority-safest').addEventListener('click', function() {
      updatePriorityButtons('safest');
      updateRouteDisplay(model, 'safest');
    });
    
    document.getElementById('priority-balanced').addEventListener('click', function() {
      updatePriorityButtons('balanced');
      updateRouteDisplay(model, 'balanced');
    });
    
    // Initial route display
    updateRouteDisplay(model, 'fastest');
  }

  // Add these functions to your ml-integration.js file

// Function to assess route risk using ML model
function assessRouteWithML(route, priority) {
    // Get current flood data
    const floodData = getCurrentFloodData();
    
    // Check if route passes through flood-prone areas
    const coordinates = route.geometry.coordinates;
    let floodRiskPoints = 0;
    let hasFlood = false;
    
    // Simulate checking coordinates against flood data
    for (const coord of coordinates) {
      // Check if this coordinate is in a flood-prone area
      for (const floodArea of floodData.floodAreas) {
        const distance = calculateDistance(
          coord[1], coord[0], 
          floodArea.lat, floodArea.lng
        );
        
        if (distance < 0.5) { // Within 500m of flood area
          floodRiskPoints += floodArea.severity;
          if (floodArea.severity > 0.7) {
            hasFlood = true;
          }
        }
      }
    }
    
    // Calculate safety score (0-10)
    const rawSafetyScore = 10 - (floodRiskPoints * 2);
    const safetyScore = Math.max(1, Math.min(10, Math.round(rawSafetyScore)));
    
    // Determine risk level
    let riskLevel = 'LOW';
    if (safetyScore < 4) {
      riskLevel = 'HIGH';
    } else if (safetyScore < 7) {
      riskLevel = 'MODERATE';
    }
    
    // Generate insight based on priority and risk
    let insight = '';
    if (priority === 'safest') {
      insight = `This route prioritizes safety with a score of ${safetyScore}/10.`;
      if (hasFlood) {
        insight += ' Some flood risk areas could not be completely avoided.';
      } else {
        insight += ' All major flood-prone areas are avoided.';
      }
    } else if (priority === 'fastest') {
      insight = `This is the fastest route (${Math.round(route.duration / 60)} min).`;
      if (hasFlood) {
        insight += ' Warning: This route passes through flood-prone areas.';
      }
    } else {
      insight = 'This route balances travel time and safety.';
      if (hasFlood) {
        insight += ' Some moderate flood risk areas may be encountered.';
      }
    }
    
    return {
      hasFlood,
      riskLevel,
      safetyScore,
      insight
    };
  }
  
  // Helper function to get current flood data (simulated)
  function getCurrentFloodData() {
    return {
      floodAreas: [
        { lat: 14.3292, lng: 121.0794, severity: 0.9, name: 'Southwoods Road' },
        { lat: 14.3350, lng: 121.0850, severity: 0.7, name: 'Biñan-Carmona Road' },
        { lat: 14.3400, lng: 121.0700, severity: 0.4, name: 'National Highway' },
        { lat: 14.3320, lng: 121.0730, severity: 0.2, name: 'A. Bonifacio Ave' }
      ]
    };
  }
  
  // Calculate distance between two points in km (Haversine formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  // Helper function to get color class based on risk level
  function getRiskColorClass(riskLevel) {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-600';
      case 'MODERATE':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
  
  // Helper function to get class for safety score
  function getSafetyScoreClass(score) {
    if (score >= 8) {
      return 'font-bold text-green-600';
    } else if (score >= 5) {
      return 'font-bold text-yellow-600';
    } else {
      return 'font-bold text-red-600';
    }
  }
  
  // Function to connect ML to your existing calculateSafeRoute
  function connectMLToExistingRoute() {
    // Hook into the existing calculateSafeRoute function
    const originalCalculateSafeRoute = window.calculateSafeRoute;
    
    if (originalCalculateSafeRoute) {
      window.calculateSafeRoute = async function() {
        // Get selected route priority from ML interface
        let routePriority = 'balanced';
        const priorityRadios = document.getElementsByName('route-priority');
        for (let radio of priorityRadios) {
          if (radio.checked) {
            routePriority = radio.value;
            break;
          }
        }
        
        // Store the priority in a global variable so it can be accessed
        // by the route processing code
        window.selectedRoutePriority = routePriority;
        
        // Call the original function
        await originalCalculateSafeRoute();
        
        // After routes are calculated, update ML-specific UI elements
        if (window.currentRoute && document.getElementById('ml-route-time')) {
          document.getElementById('ml-route-time').textContent = 
            formatDuration(window.currentRoute.duration);
          document.getElementById('ml-route-distance').textContent = 
            (window.currentRoute.distance / 1000).toFixed(1) + ' km';
          document.getElementById('ml-route-safety').textContent = 
            `${window.currentRoute.safetyScore || 5}/10`;
          document.getElementById('ml-route-safety').className = 
            getSafetyScoreClass(window.currentRoute.safetyScore || 5);
          document.getElementById('ml-route-insight').textContent = 
            window.currentRoute.mlInsight || 'Route calculated based on current conditions.';
          
          // Show the ML route results section
          document.getElementById('route-results').style.display = 'block';
        }
      };
    }
  }
  
  // Initialize when document is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Set up ML integration with existing route calculation
    connectMLToExistingRoute();
    
    // Set up route priority radio buttons
    const priorityRadios = document.getElementsByName('route-priority');
    for (let radio of priorityRadios) {
      radio.addEventListener('change', function() {
        if (this.checked) {
          updateRouteRecommendation(this.value);
        }
      });
    }
    
    // Set initial recommendation
    updateRouteRecommendation('balanced');
  });
  
  // Update priority button styles
  function updatePriorityButtons(selected) {
    const buttons = ['fastest', 'safest', 'balanced'];
    
    buttons.forEach(btn => {
      const element = document.getElementById(`priority-${btn}`);
      if (btn === selected) {
        element.className = 'px-3 py-1 bg-blue-600 text-white rounded-md text-sm';
      } else {
        element.className = 'px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm';
      }
    });
  }
  
  // Update route display based on selected priority
  function updateRouteDisplay(model, priority) {
    // Get optimal route
    const route = model.findOptimalRoute('current-location', 'destination', priority);
    
    // Update UI
    document.getElementById('ml-route-time').textContent = `${route.time} min`;
    document.getElementById('ml-route-distance').textContent = `${route.distance.toFixed(1)} km`;
    
    const safetyElement = document.getElementById('ml-route-safety');
    safetyElement.textContent = `${route.safety}/10`;
    
    // Color code safety score
    if (route.safety >= 8) {
      safetyElement.className = 'font-bold text-green-600';
    } else if (route.safety >= 6) {
      safetyElement.className = 'font-bold text-yellow-600';
    } else {
      safetyElement.className = 'font-bold text-red-600';
    }
    
    document.getElementById('ml-route-insight').textContent = route.insight;
  }
  
  // Helper function to get CSS class for risk level
  function getRiskClass(risk) {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Add this function to connect ML recommendations with the route form
function connectMLToRouteForm() {
    // Get form elements
    const routeForm = document.getElementById('route-form');
    const startInput = document.getElementById('start-location');
    const destInput = document.getElementById('destination');
    const routeRecommendation = document.getElementById('route-recommendation');
    const priorityRadios = document.getElementsByName('route-priority');
    
    // Connect priority buttons to radio buttons
    if (document.getElementById('priority-fastest')) {
      document.getElementById('priority-fastest').addEventListener('click', function() {
        setRadioByValue(priorityRadios, 'fastest');
        updateRouteRecommendation('fastest');
      });
      
      document.getElementById('priority-safest').addEventListener('click', function() {
        setRadioByValue(priorityRadios, 'safest');
        updateRouteRecommendation('safest');
      });
      
      document.getElementById('priority-balanced').addEventListener('click', function() {
        setRadioByValue(priorityRadios, 'balanced');
        updateRouteRecommendation('balanced');
      });
    }
    
    // Connect radio buttons to priority buttons
    for (let radio of priorityRadios) {
      radio.addEventListener('change', function() {
        if (this.checked) {
          const priority = this.value;
          updatePriorityButtons(priority);
          updateRouteDisplay(window.routingModel, priority);
          updateRouteRecommendation(priority);
        }
      });
    }
    
    // Handle form submission
    if (routeForm) {
      routeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get selected priority
        let selectedPriority = 'balanced';
        for (let radio of priorityRadios) {
          if (radio.checked) {
            selectedPriority = radio.value;
            break;
          }
        }
        
        // Get start and destination
        const start = startInput.value || 'Current Location';
        const destination = destInput.value || 'Destination';
        
        // Calculate and display route
        calculateAndDisplayRoute(start, destination, selectedPriority);
      });
    }
    
    // Set initial recommendation
    updateRouteRecommendation('balanced');
  }
  
  // Helper function to set radio button by value
  function setRadioByValue(radioGroup, value) {
    for (let radio of radioGroup) {
      if (radio.value === value) {
        radio.checked = true;
        break;
      }
    }
  }
  
  // Update route recommendation based on priority and conditions
  function updateRouteRecommendation(priority) {
    const recommendation = document.getElementById('route-recommendation');
    if (!recommendation) return;
    
    // Get current flood conditions (in a real app, this would come from your API)
    const floodConditions = getCurrentFloodConditions();
    
    if (floodConditions.severity === 'high') {
      recommendation.textContent = 'Due to severe flooding, we strongly recommend using the safest route option.';
      // Auto-select safest if flooding is severe
      if (priority !== 'safest') {
        setRadioByValue(document.getElementsByName('route-priority'), 'safest');
        updatePriorityButtons('safest');
      }
    } else if (floodConditions.severity === 'moderate') {
      if (priority === 'fastest') {
        recommendation.textContent = 'Fastest route available, but includes areas with moderate flood risk.';
      } else if (priority === 'safest') {
        recommendation.textContent = 'This route completely avoids all flood-prone areas but takes longer.';
      } else {
        recommendation.textContent = 'Balanced route avoids most flood-prone areas with reasonable travel time.';
      }
    } else {
      if (priority === 'fastest') {
        recommendation.textContent = 'Fastest route recommended - minimal flooding reported in the area.';
      } else if (priority === 'safest') {
        recommendation.textContent = 'Safest route selected, though minimal flooding is reported.';
      } else {
        recommendation.textContent = 'Balanced route is optimal given current conditions.';
      }
    }
  }
  
  // Get current flood conditions (simulated)
  function getCurrentFloodConditions() {
    // In a real app, this would fetch data from your API
    return {
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'moderate' : 'low',
      affectedAreas: ['Southwoods Road', 'Biñan-Carmona Road'],
      waterLevels: {
        'Southwoods Road': Math.floor(Math.random() * 100),
        'Biñan-Carmona Road': Math.floor(Math.random() * 100),
        'National Highway': Math.floor(Math.random() * 50),
        'A. Bonifacio Ave': Math.floor(Math.random() * 30)
      }
    };
  }
  
  // Calculate and display route on the map
  function calculateAndDisplayRoute(start, destination, priority) {
    console.log(`Calculating ${priority} route from ${start} to ${destination}`);
    
    // Get route from ML model
    const route = window.routingModel.findOptimalRoute(start, destination, priority);
    
    // Update route stats display
    document.getElementById('ml-route-time').textContent = `${route.time} min`;
    document.getElementById('ml-route-distance').textContent = `${route.distance.toFixed(1)} km`;
    document.getElementById('ml-route-safety').textContent = `${route.safety}/10`;
    document.getElementById('ml-route-insight').textContent = route.insight;
    
    // In a real implementation, this would draw the route on the map
    alert(`Route calculated from ${start} to ${destination} with ${priority} priority.\n\nTime: ${route.time} min\nDistance: ${route.distance.toFixed(1)} km\nSafety: ${route.safety}/10`);
  }
  
  // Initialize models when document is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize flood prediction model
    const floodModel = new FloodPredictionModel();
    
    // Initialize smart routing model and make it globally available
    window.routingModel = new SmartRoutingModel();
    
    // Update prediction card if on data page
    if (document.getElementById('flood-risk-24h')) {
      updateFloodPredictions(floodModel);
      
      // Update predictions every 5 minutes
      setInterval(() => {
        updateFloodPredictions(floodModel);
      }, 5 * 60 * 1000);
    }
    
    // Set up smart routing if on navigation page
    if (document.getElementById('priority-fastest')) {
      setupSmartRouting(window.routingModel);
      connectMLToRouteForm();
    }
  });