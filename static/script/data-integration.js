/**
 * FloodSafe Data Integration
 * This script handles the integration of OpenStreetMap and OpenWeather API
 * for the FloodSafe system's data visualization page.
 * and TomTom API for traffic data.
 * It includes functionalities for displaying real-time weather data,
 * historical flood data, and traffic conditions on a map.
 * It also includes a flood report form for users to submit flood reports.
 */

// API Keys
const OPENWEATHER_API_KEY = '305823d8d175b68df2d3b86e973728bf';
const TOMTOM_API_KEY = 'wBYXJLAVGcQ4WpJTNBu5i2q8GguIOafG'; // Replace with your actual TomTom API key

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    const map = initMap();
    
    // Fetch weather data
    fetchWeatherData();
    
    // Initialize flood chart
    initFloodChart();
    
    // Setup flood report form
    setupFloodReportForm();
    
    // Simulate traffic data updates
    simulateTrafficUpdates();
    
    // Refresh data periodically
    setInterval(fetchWeatherData, 600000); // Update weather every 10 minutes
    setInterval(simulateTrafficUpdates, 300000); // Update traffic every 5 minutes
});

// Initialize OpenStreetMap
function initMap() {
    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return null;
    
    // Initialize the map centered on Biñan City
    const map = L.map('map').setView([14.3292, 121.0794], 13);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add scale control
    L.control.scale().addTo(map);
    
    // Add flood data to map
    addFloodDataToMap(map);
    
    // Add traffic layer to map
    addTrafficLayerToMap(map);
    
    // Store map in global scope for access by other functions
    window.map = map;
    
    return map;
}

// Add flood data to the map using Leaflet
function addFloodDataToMap(map) {
    // In a real implementation, this data would come from your backend API
    const floodData = [
        {
            position: [14.3292, 121.0794],
            severity: 'severe',
            water_level: 45,
            location: 'A. Bonifacio Ave near City Hall'
        },
        {
            position: [14.3350, 121.0770],
            severity: 'moderate',
            water_level: 30,
            location: 'Biñan-Carmona Road Junction'
        },
        {
            position: [14.3400, 121.0750],
            severity: 'minor',
            water_level: 20,
            location: 'Southwoods Road near Pavilion Mall'
        }
    ];
    
    // Add flood markers to the map
    floodData.forEach(point => {
        // Set marker color based on severity
        const markerColor = 
            point.severity === 'severe' ? 'red' :
            point.severity === 'moderate' ? 'orange' : 'blue';
        
        // Create circle marker
        const marker = L.circleMarker(point.position, {
            radius: point.water_level / 2, // Size based on water level
            color: 'white',
            weight: 2,
            fillColor: markerColor,
            fillOpacity: 0.6
        }).addTo(map);
        
        // Add popup with information
        const severityClass = 
            point.severity === 'severe' ? 'text-red-700' :
            point.severity === 'moderate' ? 'text-yellow-700' : 'text-blue-700';
        
        const popupContent = `
            <div class="text-sm">
                <div class="font-bold ${severityClass} capitalize">${point.severity} Flooding</div>
                <div>${point.location}</div>
                <div>Water Level: ${point.water_level} cm</div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });
    
    // Add a legend for flood severity
    const floodLegend = L.control({position: 'bottomleft'});

    floodLegend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend bg-white p-2 rounded shadow');
        div.innerHTML = `
            <div class="text-sm font-bold mb-1">Flood Severity</div>
            <div class="flex items-center mb-1">
                <span class="w-3 h-3 inline-block bg-blue-500 rounded-full mr-1"></span>
                <span class="text-xs">Minor</span>
            </div>
            <div class="flex items-center mb-1">
                <span class="w-3 h-3 inline-block bg-orange-500 rounded-full mr-1"></span>
                <span class="text-xs">Moderate</span>
            </div>
            <div class="flex items-center">
                <span class="w-3 h-3 inline-block bg-red-500 rounded-full mr-1"></span>
                <span class="text-xs">Severe</span>
            </div>
        `;
        return div;
    };
    
    floodLegend.addTo(map);
}

// Add traffic layer to the map using OpenStreetMap data
function addTrafficLayerToMap(map) {
    // For a real implementation, you would need to use a traffic data API
    // Here we'll simulate traffic by coloring major roads
    
    // Define major roads in Biñan City
    const majorRoads = [
        {
            name: 'National Highway',
            path: [
                [14.3292, 121.0794],
                [14.3350, 121.0770],
                [14.3400, 121.0750]
            ],
            congestion: 'low' // low, moderate, heavy, severe
        },
        {
            name: 'A. Bonifacio Ave',
            path: [
                [14.3292, 121.0794],
                [14.3320, 121.0800],
                [14.3350, 121.0810]
            ],
            congestion: 'moderate'
        },
        {
            name: 'Biñan-Carmona Road',
            path: [
                [14.3350, 121.0770],
                [14.3380, 121.0750],
                [14.3410, 121.0730]
            ],
            congestion: 'heavy'
        },
        {
            name: 'Southwoods Road',
            path: [
                [14.3400, 121.0750],
                [14.3430, 121.0730],
                [14.3460, 121.0710]
            ],
            congestion: 'moderate'
        }
    ];
    
    // Add each road to the map
    majorRoads.forEach(road => {
        // Set line color based on congestion
        const lineColor = 
            road.congestion === 'low' ? '#4ade80' :
            road.congestion === 'moderate' ? '#facc15' :
            road.congestion === 'heavy' ? '#f87171' : '#ef4444';
        
        // Create polyline
        const roadLine = L.polyline(road.path, {
            color: lineColor,
            weight: 5,
            opacity: 0.7
        }).addTo(map);
        
        // Add popup with road name and congestion
        roadLine.bindPopup(`
            <div>
                <div class="font-bold">${road.name}</div>
                <div class="capitalize">Traffic: ${road.congestion}</div>
            </div>
        `);
    });
    
    // Add a legend for traffic
    const trafficLegend = L.control({position: 'bottomright'});
    
    trafficLegend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend bg-white p-2 rounded shadow');
        div.innerHTML = `
            <div class="text-sm font-bold mb-1">Traffic</div>
            <div class="flex items-center mb-1">
                <span class="w-4 h-2 inline-block bg-green-500 mr-1"></span>
                <span class="text-xs">Low</span>
            </div>
            <div class="flex items-center mb-1">
                <span class="w-4 h-2 inline-block bg-yellow-500 mr-1"></span>
                <span class="text-xs">Moderate</span>
            </div>
            <div class="flex items-center mb-1">
                <span class="w-4 h-2 inline-block bg-red-400 mr-1"></span>
                <span class="text-xs">Heavy</span>
            </div>
            <div class="flex items-center">
                <span class="w-4 h-2 inline-block bg-red-600 mr-1"></span>
                <span class="text-xs">Severe</span>
            </div>
        `;
        return div;
    };
    
    trafficLegend.addTo(map);
}

// Use TomTom Traffic API to get real traffic data
function simulateTrafficUpdates() {
    // Use TomTom Traffic API to get real traffic data
    fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${TOMTOM_API_KEY}&point=14.3292,121.0794&unit=KMPH&thickness=2`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.flowSegmentData) {
                updateTrafficWithRealData(data.flowSegmentData);
            } else {
                throw new Error('Invalid data structure from TomTom API');
            }
        })
        .catch(error => {
            console.error("Error fetching traffic data:", error);
            // Fall back to random simulation if API fails
            updateTrafficWithSimulatedData();
        });
        
    // Update the timestamp
    const updateTimeElement = document.getElementById('traffic-update-time');
    if (updateTimeElement) {
        const now = new Date();
        updateTimeElement.textContent = `Updated: ${now.toLocaleTimeString()}`;
    }
}

// Handle real traffic data from TomTom API
function updateTrafficWithRealData(flowData) {
    // Map of road IDs to their corresponding TomTom segment IDs
    const roadSegmentMap = {
        'traffic-road1': 0, // A. Bonifacio Ave
        'traffic-road2': 1, // Biñan-Carmona Road
        'traffic-road3': 2, // National Highway
        'traffic-road4': 3  // Southwoods Road
    };
    
    // Calculate congestion percentage based on current speed vs free flow speed
    const currentSpeed = flowData.currentSpeed || 0;
    const freeFlowSpeed = flowData.freeFlowSpeed || 60;
    let congestionPercent = Math.min(100, Math.max(0, Math.round((1 - (currentSpeed / freeFlowSpeed)) * 100)));
    
    // For demonstration, we'll distribute this congestion differently across roads
    const roadCongestion = {
        'traffic-road1': Math.min(100, congestionPercent + Math.floor(Math.random() * 20) - 10),
        'traffic-road2': Math.min(100, congestionPercent + Math.floor(Math.random() * 30)),
        'traffic-road3': Math.min(100, congestionPercent - Math.floor(Math.random() * 20)),
        'traffic-road4': Math.min(100, congestionPercent + Math.floor(Math.random() * 10) - 5)
    };
    
    // Update each road's traffic display
    let totalCongestion = 0;
    
    for (const [roadId, congestion] of Object.entries(roadCongestion)) {
        totalCongestion += congestion;
        updateRoadTrafficDisplay(roadId, congestion);
    }
    
    // Update overall traffic condition
    const avgCongestion = totalCongestion / Object.keys(roadCongestion).length;
    updateOverallTrafficCondition(avgCongestion);
}

// Helper function to update individual road displays
function updateRoadTrafficDisplay(roadId, congestionPercent) {
    const roadElement = document.getElementById(roadId);
    const valueElement = document.getElementById(`${roadId}-value`);
    
    if (roadElement) {
        roadElement.style.width = `${congestionPercent}%`;
        
        // Update color based on congestion level
        if (congestionPercent < 30) {
            roadElement.className = 'bg-green-500 h-2.5 rounded-full';
        } else if (congestionPercent < 70) {
            roadElement.className = 'bg-yellow-500 h-2.5 rounded-full';
        } else {
            roadElement.className = 'bg-red-500 h-2.5 rounded-full';
        }
    }
    
    // Update the percentage text if the element exists
    if (valueElement) {
        valueElement.textContent = `${congestionPercent}%`;
    }
    
    // Also update the color indicator dot next to the road name
    const roadNameContainer = roadElement?.closest('.flex.items-center.justify-between')?.querySelector('.flex.items-center');
    if (roadNameContainer) {
        const colorDot = roadNameContainer.querySelector('.w-2.h-2.rounded-full');
        if (colorDot) {
            if (congestionPercent < 30) {
                colorDot.className = 'w-2 h-2 rounded-full bg-green-500 mr-2';
            } else if (congestionPercent < 70) {
                colorDot.className = 'w-2 h-2 rounded-full bg-yellow-500 mr-2';
            } else {
                colorDot.className = 'w-2 h-2 rounded-full bg-red-500 mr-2';
            }
        }
    }
}

// Helper function to update the overall traffic condition
function updateOverallTrafficCondition(avgCongestion) {
    const conditionElement = document.getElementById('traffic-condition');
    
    if (conditionElement) {
        if (avgCongestion < 30) {
            conditionElement.textContent = 'Low';
            conditionElement.className = 'px-3 py-1 rounded-full bg-green-100 text-green-800';
        } else if (avgCongestion < 70) {
            conditionElement.textContent = 'Moderate';
            conditionElement.className = 'px-3 py-1 rounded-full bg-yellow-100 text-yellow-800';
        } else {
            conditionElement.textContent = 'Heavy';
            conditionElement.className = 'px-3 py-1 rounded-full bg-red-100 text-red-800';
        }
    }
}

// Fallback function for when the API fails
function updateTrafficWithSimulatedData() {
    const roads = ['traffic-road1', 'traffic-road2', 'traffic-road3', 'traffic-road4'];
    let totalTraffic = 0;
    
    roads.forEach(roadId => {
        const trafficLevel = Math.floor(Math.random() * 100);
        totalTraffic += trafficLevel;
        updateRoadTrafficDisplay(roadId, trafficLevel);
    });
    
    // Update overall traffic condition
    const avgTraffic = totalTraffic / roads.length;
    updateOverallTrafficCondition(avgTraffic);
}

// Fetch real-time weather data from OpenWeatherMap
async function fetchWeatherData() {
    const BINAN_COORDS = { lat: 14.3292, lon: 121.0794 };
    
    try {
        // Fetch current weather
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${BINAN_COORDS.lat}&lon=${BINAN_COORDS.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            throw new Error(`Weather API error: ${currentResponse.status}`);
        }
        
        const currentData = await currentResponse.json();
        
        // Update current weather UI
        updateCurrentWeather(currentData);
        
        // Fetch 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${BINAN_COORDS.lat}&lon=${BINAN_COORDS.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (!forecastResponse.ok) {
            throw new Error(`Forecast API error: ${forecastResponse.status}`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Update forecast UI
        updateForecast(forecastData);
        
        return { current: currentData, forecast: forecastData };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        // Use demo data if API fails
        updateWithDemoWeatherData();
        return null;
    }
}

// Update current weather UI with real data
function updateCurrentWeather(data) {
    // Update temperature and description
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');
    
    if (tempElement && descElement) {
        tempElement.textContent = `${Math.round(data.main.temp)}°C`;
        descElement.textContent = data.weather[0].description;
    }
    
    // Update weather icon
    const iconElement = document.getElementById('weather-icon');
    if (iconElement) {
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.innerHTML = `<img src="${iconUrl}" alt="${data.weather[0].description}" class="w-16 h-16">`;
    }
    
    // Update additional weather data
    const humidityElement = document.getElementById('weather-humidity');
    const windElement = document.getElementById('weather-wind');
    const rainElement = document.getElementById('weather-rain');
    
    if (humidityElement) {
        humidityElement.textContent = `${data.main.humidity}%`;
    }
    
    if (windElement) {
        // Convert m/s to km/h
        windElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    }
    
    if (rainElement) {
        // Handle rainfall data (if available)
        const rainfall = data.rain && data.rain['1h'] ? data.rain['1h'] : 0;
        rainElement.textContent = `${rainfall} mm`;
    }
    
    // Update timestamp
    const updatedElement = document.getElementById('weather-updated');
    if (updatedElement) {
        const now = new Date();
        updatedElement.textContent = `Updated at ${now.toLocaleTimeString()}`;
    }
    
    // Check if weather conditions indicate potential flooding
    checkFloodRisk(data);
}

// Update forecast UI with real data
function updateForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    if (!forecastContainer) return;
    
    forecastContainer.innerHTML = '';
    
    // Get one forecast per day (noon time)
    const dailyForecasts = [];
    const processedDates = new Set();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip if we already have this date or if it's today
        if (processedDates.has(dateStr)) return;
        if (dailyForecasts.length >= 5) return;
        
        processedDates.add(dateStr);
        dailyForecasts.push(item);
    });
    
    // Create forecast items
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
        const temp = Math.round(forecast.main.temp);
        
        const forecastItem = document.createElement('div');
        forecastItem.innerHTML = `
            <div class="text-sm font-medium">${dayName}</div>
            <img src="${iconUrl}" alt="${forecast.weather[0].description}" class="w-8 h-8 mx-auto my-1">
            <div class="text-sm">${temp}°</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Use demo data if API fails
function updateWithDemoWeatherData() {
    // Demo current weather
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');
    const iconElement = document.getElementById('weather-icon');
    const humidityElement = document.getElementById('weather-humidity');
    const windElement = document.getElementById('weather-wind');
    const rainElement = document.getElementById('weather-rain');
    const updatedElement = document.getElementById('weather-updated');
    
    if (tempElement) tempElement.textContent = '29°C';
    if (descElement) descElement.textContent = 'Partly cloudy';
    if (iconElement) iconElement.innerHTML = '<img src="https://openweathermap.org/img/wn/02d@2x.png" alt="Partly cloudy" class="w-16 h-16">';
    if (humidityElement) humidityElement.textContent = '75%';
    if (windElement) windElement.textContent = '12 km/h';
    if (rainElement) rainElement.textContent = '0 mm';
    
    if (updatedElement) {
        const now = new Date();
        updatedElement.textContent = `Demo data (${now.toLocaleTimeString()})`;
    }
    
    // Demo forecast
    const forecastContainer = document.getElementById('forecast-container');
    if (!forecastContainer) return;
    
    forecastContainer.innerHTML = '';
    
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const icons = ['01d', '02d', '10d', '01d', '02d'];
    const temps = [30, 31, 28, 29, 30];
    
    daysOfWeek.forEach((day, index) => {
        const forecastItem = document.createElement('div');
        forecastItem.innerHTML = `
            <div class="text-sm font-medium">${day}</div>
            <img src="https://openweathermap.org/img/wn/${icons[index]}.png" alt="Weather icon" class="w-8 h-8 mx-auto my-1">
            <div class="text-sm">${temps[index]}°</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Check if current weather conditions indicate potential flooding
function checkFloodRisk(weatherData) {
    // Factors that contribute to flood risk:
    // 1. Heavy rainfall
    // 2. High humidity
    // 3. Low pressure system
    
    let floodRisk = 'Low';
    let riskFactors = [];
    
    // Check rainfall (if available)
    const rainfall = weatherData.rain && weatherData.rain['1h'] ? weatherData.rain['1h'] : 0;
    if (rainfall > 10) {
        floodRisk = 'High';
        riskFactors.push('Heavy rainfall');
    } else if (rainfall > 5) {
        floodRisk = Math.max(floodRisk === 'High' ? 2 : 1, 1);
        riskFactors.push('Moderate rainfall');
    }
    
    // Check humidity
    if (weatherData.main.humidity > 90) {
        floodRisk = floodRisk === 'High' ? 'High' : 'Moderate';
        riskFactors.push('High humidity');
    }
    
    // Check atmospheric pressure (low pressure often associated with rain)
    if (weatherData.main.pressure < 1000) {
        floodRisk = floodRisk === 'High' ? 'High' : 'Moderate';
        riskFactors.push('Low pressure system');
    }
    
    // Update UI with flood risk if we have a weather-alert element
    const alertElement = document.getElementById('weather-alert');
    if (alertElement) {
        if (floodRisk === 'High') {
            alertElement.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-3 rounded mt-4">
                    <div class="font-bold text-red-700">High Flood Risk</div>
                    <div class="text-sm">${riskFactors.join(', ')}</div>
                </div>
            `;
            alertElement.style.display = 'block';
        } else if (floodRisk === 'Moderate') {
            alertElement.innerHTML = `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mt-4">
                    <div class="font-bold text-yellow-700">Moderate Flood Risk</div>
                    <div class="text-sm">${riskFactors.join(', ')}</div>
                </div>
            `;
            alertElement.style.display = 'block';
        } else {
            alertElement.style.display = 'none';
        }
    }
    
    return { risk: floodRisk, factors: riskFactors };
}

// Initialize historical flood data chart
function initFloodChart() {
    const ctx = document.getElementById('floodChart');
    if (!ctx) return;
    
    // Generate dates for the past 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    // Sample flood level data (in cm)
    // In a real implementation, this would come from your backend
    const floodLevels = [15, 20, 35, 45, 30, 25, 20];
    
    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Flood Level (cm)',
                data: floodLevels,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Water Level (cm)'
                    }
                }
            }
        }
    });
}

// Handle flood report form submission
function setupFloodReportForm() {
    const form = document.getElementById('floodReportForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const location = document.getElementById('location').value;
        const floodLevel = document.getElementById('floodLevel').value;
        const description = document.getElementById('description').value;
        
        // In a real app, this would send data to your backend
        console.log('Flood report submitted:', { location, floodLevel, description });
        
        // Show success message
        showNotification('Thank you for your report! It will help others navigate safely.');
        
        // Reset form
        this.reset();
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
    }`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add event listener for detailed traffic view
document.getElementById('view-traffic-details')?.addEventListener('click', function() {
    // This would open a detailed traffic view
    // For now, we'll just center the map on Biñan City and zoom in
    if (window.map) {
        window.map.setView([14.3292, 121.0794], 14);
        alert('Detailed traffic view is being developed. The map has been centered on Biñan City.');
    }
});