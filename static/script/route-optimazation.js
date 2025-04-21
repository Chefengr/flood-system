// Google Maps Initialization
function initGoogleMap() {
  const map = new google.maps.Map(document.getElementById("googleMap"), {
    center: { lat: 14.3420, lng: 121.0803 }, // Default: Biñan City, Philippines
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false
  });

  // Add sample flood markers
  new google.maps.Marker({
    position: { lat: 14.345, lng: 121.085 },
    map,
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      scaledSize: new google.maps.Size(32, 32)
    },
    title: "Flood Risk Zone (High)"
  });

  // Initialize Autocomplete
  new google.maps.places.Autocomplete(document.getElementById("start"));
  new google.maps.places.Autocomplete(document.getElementById("end"));

  // Store map reference globally
  window.googleMap = map;
  window.googleDirectionsService = new google.maps.DirectionsService();
  window.googleDirectionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false
  });
}

// Leaflet (OpenStreetMap) Initialization
function initOSMMap() {
  const map = L.map('osmMap').setView([14.3420, 121.0803], 14);
  
  // Add OSM Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Add custom flood marker
  const floodIcon = L.divIcon({
    className: 'flood-marker',
    html: '<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>'
  });

  L.marker([14.345, 121.085], { icon: floodIcon })
    .addTo(map)
    .bindPopup("<b>Flood Risk Zone</b><br>High danger area");

  // Store map reference globally
  window.osmMap = map;
  window.osmRouteLayer = L.layerGroup().addTo(map);
}

// Initialize both maps
document.addEventListener("DOMContentLoaded", () => {
  initOSMMap(); // Leaflet loads immediately
  // Google Maps loads via async callback (initGoogleMap)

  // Set up route calculation form
  setupRouteForm();
  
  // Initialize ML model
  initMLModel();
});

// Set up route calculation form
function setupRouteForm() {
  const routeForm = document.getElementById('route-form');
  if (routeForm) {
      routeForm.addEventListener('submit', function(e) {
          e.preventDefault();
          calculateRoute();
      });
  }

  // Set up route priority radio buttons
  const priorityRadios = document.getElementsByName('route-priority');
  for (let radio of priorityRadios) {
      radio.addEventListener('change', function() {
          if (this.checked) {
              updateRouteRecommendation(this.value);
          }
      });
  }
}

// Calculate route based on form inputs
async function calculateRoute() {
  const startInput = document.getElementById('start').value;
  const endInput = document.getElementById('end').value;

  if (!startInput || !endInput) {
      showNotification("Please enter both start and destination locations", "error");
      return;
  }

  try {
      showNotification("Calculating safest route...", "info");
      
      // Get selected route priority
      let routePriority = 'balanced';
      const priorityRadios = document.getElementsByName('route-priority');
      for (let radio of priorityRadios) {
          if (radio.checked) {
              routePriority = radio.value;
              break;
          }
      }

      // Determine which map is active
      const useGoogleMaps = document.getElementById('googleMap').style.display !== 'none';
      
      if (useGoogleMaps) {
          // Calculate route using Google Maps
          await calculateGoogleRoute(startInput, endInput, routePriority);
      } else {
          // Calculate route using OpenStreetMap
          await calculateOSMRoute(startInput, endInput, routePriority);
      }
      
      // Show route results
      document.getElementById('route-results').style.display = 'block';
      
      showNotification("Route calculated successfully", "success");
  } catch (error) {
      console.error("Route calculation error:", error);
      showNotification("Could not calculate route: " + error.message, "error");
  }
}

// Calculate route using Google Maps
async function calculateGoogleRoute(start, end, priority) {
  return new Promise((resolve, reject) => {
      const directionsService = window.googleDirectionsService;
      const directionsRenderer = window.googleDirectionsRenderer;
      
      directionsService.route({
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true
      }, (response, status) => {
          if (status === 'OK') {
              // Process routes with ML
              const routes = processRoutesWithML(response.routes, priority);
              
              // Sort routes based on priority
              sortRoutesByPriority(routes, priority);
              
              // Display the first route
              directionsRenderer.setDirections(response);
              directionsRenderer.setRouteIndex(0);
              
              // Update route stats display
              updateRouteStats(routes[0]);
              
              resolve(routes);
          } else {
              reject(new Error("Directions request failed due to " + status));
          }
      });
  });
}

// Calculate route using OpenStreetMap (OSRM)
async function calculateOSMRoute(start, end, priority) {
  try {
      // First, geocode the addresses to get coordinates
      const startCoords = await geocodeAddress(start);
      const endCoords = await geocodeAddress(end);
      
      if (!startCoords || !endCoords) {
          throw new Error("Could not geocode addresses");
      }
      
      // Get OSRM route with alternatives
      const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/` +
          `${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?` +
          `overview=full&geometries=geojson&alternatives=true`
      );

      const routeData = await response.json();

      if (routeData.code !== "Ok") {
          throw new Error(routeData.message || "Routing failed");
      }

      // Process routes with ML
      const routes = processOSRMRoutesWithML(routeData.routes, priority);
      
      // Sort routes based on priority
      sortRoutesByPriority(routes, priority);
      
      // Display the first route on the map
      displayOSMRoute(routes[0]);
      
      // Update route stats display
      updateRouteStats(routes[0]);
      
      return routes;
  } catch (error) {
      console.error("OSM route calculation error:", error);
      throw error;
  }
}

// Display OSM route on the map
function displayOSMRoute(route) {
  // Clear existing routes
  window.osmRouteLayer.clearLayers();
  
  // Create a GeoJSON object from the route geometry
  const routeGeoJSON = {
      type: "Feature",
      properties: {},
      geometry: route.geometry
  };
  
  // Add the route to the map
  const routeLine = L.geoJSON(routeGeoJSON, {
      style: {
          color: "#3b82f6",
          weight: 6,
          opacity: 0.7
      }
  }).addTo(window.osmRouteLayer);
  
  // Fit the map to the route bounds
  window.osmMap.fitBounds(routeLine.getBounds());
  
  // Add start and end markers
  const coords = route.geometry.coordinates;
  const startCoord = coords[0];
  const endCoord = coords[coords.length - 1];
  
  L.marker([startCoord[1], startCoord[0]], {
      icon: L.divIcon({
          className: 'start-marker',
          html: '<div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
      })
  }).addTo(window.osmRouteLayer).bindPopup("Start");
  
  L.marker([endCoord[1], endCoord[0]], {
      icon: L.divIcon({
          className: 'end-marker',
          html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
      })
  }).addTo(window.osmRouteLayer).bindPopup("Destination");
}

// Update route stats display
function updateRouteStats(route) {
  document.getElementById('ml-route-time').textContent = formatDuration(route.duration);
  document.getElementById('ml-route-distance').textContent = (route.distance / 1000).toFixed(1) + ' km';
  
  const safetyElement = document.getElementById('ml-route-safety');
  safetyElement.textContent = `${route.safetyScore}/10`;
  
  // Color code safety score
  if (route.safetyScore >= 8) {
      safetyElement.className = 'font-bold text-green-600';
  } else if (route.safetyScore >= 6) {
      safetyElement.className = 'font-bold text-yellow-600';
  } else {
      safetyElement.className = 'font-bold text-red-600';
  }
  
  document.getElementById('ml-route-insight').textContent = route.mlInsight;
}

// Format duration in seconds to a human-readable string
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
      return `${hours}h ${minutes}m`;
  } else {
      return `${minutes} min`;
  }
}

// Geocode address to coordinates
async function geocodeAddress(address) {
  try {
      // For demo purposes, we'll use a simple geocoding API
      // In production, you might want to use a more robust service
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
          return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
          };
      }
      return null;
  } catch (error) {
      console.error("Geocoding error:", error);
      return null;
  }
}

// Show notification
function showNotification(message, type) {
  // Implement your notification system here
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Example implementation with alert (replace with your UI notification)
  if (type === 'error') {
      alert(message);
  }
}

// ML Model Integration
// -------------------

// Initialize ML model
function initMLModel() {
  // In a real implementation, this might load a pre-trained model
  // For now, we'll just set up a simple model
  window.floodModel = new FloodPredictionModel();
  window.routingModel = new SmartRoutingModel();
  
  // Update initial recommendation
  updateRouteRecommendation('balanced');
}

// Simple ML model for flood prediction
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
      
      // Load flood data
      this.loadFloodData();
  }
  
  // Load flood data from API
  async loadFloodData() {
      try {
          const response = await fetch('/api/flood-data');
          this.floodData = await response.json();
      } catch (error) {
          console.error("Error loading flood data:", error);
          // Use default data if API fails
          this.floodData = this.getDefaultFloodData();
      }
  }
  
  // Get default flood data
  getDefaultFloodData() {
      return {
          nodes: [
              {
                  node_id: "NODE_001",
                  temperature: 31.0,
                  humidity: 71.0,
                  water_level: 5.0,
                  severity: "HIGH",
                  flood_status: "SEVERE",
                  location: { lat: 14.345, lng: 121.085 }
              }
          ]
      };
  }
  
  // Get flood risk for a specific location
  getFloodRiskAtLocation(lat, lng) {
      // Find the closest node
      let closestNode = null;
      let minDistance = Infinity;
      
      for (const node of this.floodData?.nodes || []) {
          if (node.location) {
              const distance = calculateDistance(lat, lng, node.location.lat, node.location.lng);
              if (distance < minDistance) {
                  minDistance = distance;
                  closestNode = node;
              }
          }
      }
      
      // If no node is found or it's too far away, return low risk
      if (!closestNode || minDistance > 5) { // 5km threshold
          return { risk: 'LOW', score: 0.1 };
      }
      
      // Convert severity to score
      let riskScore = 0;
      switch (closestNode.severity) {
          case 'HIGH':
              riskScore = 0.9;
              break;
          case 'MODERATE':
              riskScore = 0.5;
              break;
          case 'LOW':
              riskScore = 0.2;
              break;
          default:
              riskScore = 0.1;
      }
      
      // Adjust score based on distance (closer = higher risk)
      riskScore = riskScore * (1 - Math.min(1, minDistance / 5));
      
      // Determine risk level
      let risk = 'LOW';
      if (riskScore >= this.threshold.high) {
          risk = 'HIGH';
      } else if (riskScore >= this.threshold.moderate) {
          risk = 'MODERATE';
      }
      
      return { risk, score: riskScore };
  }
}

// Smart routing model
class SmartRoutingModel {
  constructor() {
      this.floodData = [];
      this.trafficData = [];
  }
  
  // Assess route safety
  assessRouteSafety(route) {
      // In a real implementation, this would analyze the route against flood data
      // For now, we'll use a simplified approach
      
      // Get coordinates from route
      let coordinates = [];
      if (route.geometry && route.geometry.coordinates) {
          // OSRM format
          coordinates = route.geometry.coordinates.map(coord => ({ lng: coord[0], lat: coord[1] }));
      } else if (route.overview_polyline && route.overview_polyline.points) {
          // Google Maps format
          coordinates = this.decodePolyline(route.overview_polyline.points);
      }
      
      // Check each point along the route for flood risk
      let totalRisk = 0;
      let highRiskPoints = 0;
      let floodModel = window.floodModel;
      
      for (let i = 0; i < coordinates.length; i += Math.max(1, Math.floor(coordinates.length / 10))) {
          const coord = coordinates[i];
          const risk = floodModel.getFloodRiskAtLocation(coord.lat, coord.lng);
          
          totalRisk += risk.score;
          if (risk.risk === 'HIGH') {
              highRiskPoints++;
          }
      }
      
      // Calculate average risk
      const avgRisk = totalRisk / (Math.floor(coordinates.length / 10) || 1);
      
      // Calculate safety score (0-10)
      const safetyScore = Math.max(1, Math.min(10, Math.round(10 - (avgRisk * 10))));
      
      // Determine if route has flood
      const hasFlood = highRiskPoints > 0;
      
      // Determine risk level
      let riskLevel = 'LOW';
      if (avgRisk >= 0.7) {
          riskLevel = 'HIGH';
      } else if (avgRisk >= 0.3) {
          riskLevel = 'MODERATE';
      }
      
      return {
          safetyScore,
          hasFlood,
          riskLevel,
          highRiskPoints
      };
  }
  
  // Decode Google Maps polyline
  decodePolyline(encoded) {
      const points = [];
      let index = 0, lat = 0, lng = 0;
      
      while (index < encoded.length) {
          let b, shift = 0, result = 0;
          
          do {
              b = encoded.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
          } while (b >= 0x20);
          
          const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lat += dlat;
          
          shift = 0;
          result = 0;
          
          do {
              b = encoded.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
          } while (b >= 0x20);
          
          const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lng += dlng;
          
          points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
      }
      
      return points;
  }
}

// Process Google Maps routes with ML
function processRoutesWithML(routes, priority) {
  return routes.map(route => {
      // Assess route safety
      const safetyAssessment = window.routingModel.assessRouteSafety(route);
      
      // Add ML properties to the route
      route.safetyScore = safetyAssessment.safetyScore;
      route.hasFlood = safetyAssessment.hasFlood;
      route.riskLevel = safetyAssessment.riskLevel;
      
      // Generate insight based on priority and risk
      route.mlInsight = generateRouteInsight(route, priority, safetyAssessment);
      
      // Add duration in seconds for consistent comparison
      route.duration = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
      route.distance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
      
      return route;
  });
}

// Process OSRM routes with ML
function processOSRMRoutesWithML(routes, priority) {
  return routes.map(route => {
      // Convert OSRM route to a format compatible with our ML model
      const processedRoute = {
          geometry: route.geometry,
          duration: route.duration,
          distance: route.distance,
          legs: route.legs || [{ steps: [] }]
      };
      
      // Assess route safety
      const safetyAssessment = window.routingModel.assessRouteSafety(processedRoute);
      
      // Add ML properties to the route
      processedRoute.safetyScore = safetyAssessment.safetyScore;
      processedRoute.hasFlood = safetyAssessment.hasFlood;
      processedRoute.riskLevel = safetyAssessment.riskLevel;
      
      // Generate insight based on priority and risk
      processedRoute.mlInsight = generateRouteInsight(processedRoute, priority, safetyAssessment);
      
      return processedRoute;
  });
}

// Generate insight for a route
function generateRouteInsight(route, priority, safetyAssessment) {
  let insight = '';
  
  if (priority === 'safest') {
      insight = `This route prioritizes safety with a score of ${route.safetyScore}/10.`;
      if (safetyAssessment.hasFlood) {
          insight += ' Some flood risk areas could not be completely avoided.';
      } else {
          insight += ' All major flood-prone areas are avoided.';
      }
  } else if (priority === 'fastest') {
      insight = `This is the fastest route (${formatDuration(route.duration)}).`;
      if (safetyAssessment.hasFlood) {
          insight += ' Warning: This route passes through flood-prone areas.';
      }
  } else {
      insight = 'This route balances travel time and safety.';
      if (safetyAssessment.hasFlood) {
          insight += ' Some moderate flood risk areas may be encountered.';
      }
  }
  
  return insight;
}

// Sort routes based on priority
function sortRoutesByPriority(routes, priority) {
  if (priority === 'safest') {
      // Sort by safety score (highest first)
      routes.sort((a, b) => b.safetyScore - a.safetyScore);
  } else if (priority === 'fastest') {
      // Sort by duration (lowest first)
      routes.sort((a, b) => a.duration - b.duration);
  } else {
      // Balanced - use a weighted score of safety and duration
      routes.sort((a, b) => {
          const aScore = (a.safetyScore * 5) - (a.duration / 60);
          const bScore = (b.safetyScore * 5) - (b.duration / 60);
          return bScore - aScore;
      });
  }
  
  return routes;
}

// Update route recommendation based on priority and conditions
function updateRouteRecommendation(priority) {
  const recommendation = document.getElementById('route-recommendation');
  if (!recommendation) return;
  
  // Get current flood conditions
  const floodConditions = getCurrentFloodConditions();
  
  if (floodConditions.severity === 'high') {
      recommendation.textContent = 'Due to severe flooding, we strongly recommend using the safest route option.';
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
  // For now, we'll use the data from the most recent NodeMCU reading
  const floodData = window.floodModel?.floodData?.nodes || [];
  
  if (floodData.length === 0) {
      return { severity: 'low' };
  }
  
  // Find the highest severity
  let highestSeverity = 'low';
  for (const node of floodData) {
      if (node.severity === 'HIGH') {
          highestSeverity = 'high';
          break;
      } else if (node.severity === 'MODERATE' && highestSeverity !== 'high') {
          highestSeverity = 'moderate';
      }
  }
  
  return { severity: highestSeverity };
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

// Fetch nearby floods (original functionality preserved)
async function fetchNearbyFloods(lat, lng, radius) {
  try {
      const response = await fetch(`/api/nearby-floods?lat=${lat}&lng=${lng}&radius=${radius}`);
      return await response.json();
  } catch (error) {
      console.error("Error fetching nearby floods:", error);
      return [];
  }
}