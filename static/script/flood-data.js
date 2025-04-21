// Flood data handling class
class FloodDataHandler {
    constructor() {
        this.map = null;
        this.markers = null;
        this.currentData = [];
        this.initMap();
        this.fetchData();
        
        // Refresh data every 30 seconds
        setInterval(() => this.fetchData(), 30000);
    }
    
    // Initialize the map
    initMap() {
        // Create map centered on Biñan, Philippines
        this.map = L.map('floodMap').setView([14.3036, 121.0781], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
        
        // Create a layer group for markers
        this.markers = L.layerGroup().addTo(this.map);
        
        // Add legend
        this.addLegend();
    }
    
    // Add legend to map
    addLegend() {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.2)';
            
            const severities = ['HIGH', 'MODERATE', 'LOW'];
            const colors = ['#ef4444', '#f59e0b', '#10b981'];
            
            div.innerHTML = '<h4 class="font-bold mb-2">Flood Severity</h4>';
            
            for (let i = 0; i < severities.length; i++) {
                div.innerHTML += 
                    '<div class="flex items-center mb-1">' +
                    `<i style="background: ${colors[i]}; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 5px;"></i>` +
                    `<span>${severities[i]}</span>` +
                    '</div>';
            }
            
            return div;
        };
        
        legend.addTo(this.map);
    }
    
    // Fetch data from API
   // Fetch data from API
   async fetchData() {
    try {
        console.log('Fetching flood data...');
        
        // Update the API URL to point to your actual backend
        const response = await fetch('http://localhost:5000/api/flood-data', {
            // Add timeout to prevent long waiting times when server is down
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.nodes || !Array.isArray(data.nodes)) {
            throw new Error('Invalid data format');
        }
        
        this.currentData = data.nodes;
        this.updateMap();
        this.updateTable();
        this.updateStats();
        
        // Update connection status indicator
        this.updateConnectionStatus(true, "Connected to server");
        
        // Also fetch weather data
        this.fetchWeatherData();
        
        // Hide error message if it was shown
        const errorElement = document.getElementById('data-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching flood data:', error);
        
        // Update connection status indicator
        let errorMessage = 'Could not load flood data. Please try again later.';
        if (error.name === 'AbortError') {
            errorMessage = 'Server connection timed out. Please check if the server is running.';
            this.updateConnectionStatus(false, "Server connection timed out");
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to the server. Please check if the server is running.';
            this.updateConnectionStatus(false, "Server unreachable");
        } else {
            this.updateConnectionStatus(false, "Error: " + error.message);
        }
        
        const errorElement = document.getElementById('data-error');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
        }
    }
}

// Add this new method to show connection status
updateConnectionStatus(isConnected, message) {
    const statusElement = document.getElementById('server-status');
    if (statusElement) {
        statusElement.innerHTML = isConnected 
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg class="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                ${message}
               </span>`
            : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <svg class="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                ${message}
               </span>`;
    }
    
    // Also update NodeMCU connection status if we have that element
    const nodeStatusElement = document.getElementById('nodemcu-status');
    if (nodeStatusElement) {
        // If we can't connect to server, we can't know NodeMCU status
        if (!isConnected) {
            nodeStatusElement.innerHTML = 
                `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <svg class="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                    Unknown
                </span>`;
        } else {
            // Check if we have any recent data from NodeMCU (within last 2 minutes)
            const hasRecentData = this.currentData.some(node => {
                if (!node.timestamp) return false;
                const dataTime = new Date(node.timestamp);
                const now = new Date();
                const diffMinutes = (now - dataTime) / (1000 * 60);
                return diffMinutes < 2; // Data is less than 2 minutes old
            });
            
            nodeStatusElement.innerHTML = hasRecentData
                ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg class="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                    Connected
                   </span>`
                : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg class="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                    No recent data
                   </span>`;
        }
    }
}
    // Fetch weather data from OpenWeatherMap API
    async fetchWeatherData() {
        try {
            // Replace YOUR_API_KEY with your actual OpenWeatherMap API key
            const apiKey = '305823d8d175b68df2d3b86e973728bf';  // Get this from openweathermap.org
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Bi%C3%B1an,PH&units=metric&appid=${apiKey}`);
            
            if (!response.ok) {
                throw new Error(`Weather API error! Status: ${response.status}`);
            }
            
            const weatherData = await response.json();
            
            // Update weather information on your page
            const weatherElement = document.getElementById('weather-info');
            if (weatherElement) {
                weatherElement.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow-md">
                        <h3 class="font-bold text-lg mb-2">Current Weather in Biñan</h3>
                        <div class="flex items-center mb-2">
                            <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" 
                                 alt="${weatherData.weather[0].description}" 
                                 class="w-12 h-12 mr-2">
                            <span class="text-xl">${weatherData.main.temp.toFixed(1)}°C</span>
                        </div>
                        <div class="text-gray-700">${weatherData.weather[0].description}</div>
                        <div class="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <span class="text-gray-600">Humidity:</span>
                                <span class="font-medium">${weatherData.main.humidity}%</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Wind:</span>
                                <span class="font-medium">${weatherData.wind.speed} m/s</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            const weatherElement = document.getElementById('weather-info');
            if (weatherElement) {
                weatherElement.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow-md">
                        <h3 class="font-bold text-lg mb-2">Weather Data</h3>
                        <p class="text-gray-600">Unable to load weather information</p>
                    </div>
                `;
            }
        }
    }
    
    
    // Update map with markers
    updateMap() {
        // Clear existing markers
        this.markers.clearLayers();
        
        // Add a marker for each node
        this.currentData.forEach(node => {
            // Skip if no location data
            if (!node.latitude || !node.longitude) return;
            
            const lat = parseFloat(node.latitude);
            const lng = parseFloat(node.longitude);
            
            // Skip if invalid coordinates
            if (isNaN(lat) || isNaN(lng)) return;
            
            // Determine marker color based on severity
            let markerColor = '#10b981'; // Default: low/green
            if (node.severity === 'HIGH') {
                markerColor = '#ef4444'; // Red
            } else if (node.severity === 'MODERATE') {
                markerColor = '#f59e0b'; // Yellow/orange
            }
            
            // Create marker
            L.circleMarker([lat, lng], {
                radius: 10,
                fillColor: markerColor,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(this.createPopupContent(node))
              .addTo(this.markers);
        });
        
        // If we have markers, fit the map to show all of them
        if (this.markers.getLayers().length > 0) {
            const group = L.featureGroup(this.markers.getLayers());
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    // Create popup content for a marker
    createPopupContent(node) {
        // Format timestamp
        const timestamp = node.timestamp 
            ? new Date(node.timestamp).toLocaleString() 
            : 'Unknown';
        
        return `
            <div class="flood-popup">
                <h3 class="font-bold text-lg">${node.node_id}</h3>
                <div class="grid grid-cols-2 gap-2 mt-2">
                    <div>
                        <span class="text-gray-600">Water Level:</span>
                        <span class="font-medium">${node.water_level} cm</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Status:</span>
                        <span class="font-medium" style="color: ${this.getSeverityColor(node.severity)}">
                            ${node.flood_status}
                        </span>
                    </div>
                    <div>
                        <span class="text-gray-600">Temperature:</span>
                        <span class="font-medium">${node.temperature}°C</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Humidity:</span>
                        <span class="font-medium">${node.humidity}%</span>
                    </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    Last updated: ${timestamp}
                </div>
            </div>
        `;
    }
    
    // Update data table
    updateTable() {
        const tableBody = document.getElementById('flood-data-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (this.currentData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-2 text-center text-gray-500">
                        No data available
                    </td>
                </tr>
            `;
            return;
        }
        
        // Add a row for each node
        this.currentData.forEach(node => {
            const row = document.createElement('tr');
            
            // Determine status color
            let statusColor = 'text-green-600';
            if (node.severity === 'HIGH' || node.flood_status === 'SEVERE') {
                statusColor = 'text-red-600';
            } else if (node.severity === 'MODERATE' || node.flood_status === 'WARNING') {
                statusColor = 'text-yellow-600';
            }
            
            // Format timestamp
            const timestamp = node.timestamp 
                ? new Date(node.timestamp).toLocaleString() 
                : 'Unknown';
            
            row.innerHTML = `
                <td class="px-4 py-2 border-b">${node.node_id}</td>
                <td class="px-4 py-2 border-b">${node.water_level} cm</td>
                <td class="px-4 py-2 border-b">${node.temperature}°C</td>
                <td class="px-4 py-2 border-b">${node.humidity}%</td>
                <td class="px-4 py-2 border-b ${statusColor} font-medium">${node.flood_status}</td>
                <td class="px-4 py-2 border-b text-sm">${timestamp}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Update statistics
    updateStats() {
        // Count nodes by severity
        let highCount = 0;
        let moderateCount = 0;
        let highestWaterLevel = 0;
        let totalWaterLevel = 0;
        
        this.currentData.forEach(node => {
            if (node.severity === 'HIGH') {
                highCount++;
            } else if (node.severity === 'MODERATE') {
                moderateCount++;
            }
            
            const waterLevel = parseFloat(node.water_level);
            if (!isNaN(waterLevel)) {
                highestWaterLevel = Math.max(highestWaterLevel, waterLevel);
                totalWaterLevel += waterLevel;
            }
        });
        
        const avgWaterLevel = this.currentData.length > 0 
            ? totalWaterLevel / this.currentData.length 
            : 0;
        
        // Update the stats display
        document.getElementById('high-count').textContent = highCount;
        document.getElementById('moderate-count').textContent = moderateCount;
        document.getElementById('highest-water').textContent = `${highestWaterLevel.toFixed(1)} cm`;
        document.getElementById('avg-water').textContent = `${avgWaterLevel.toFixed(1)} cm`;
    }
    
    // Get color for severity
    getSeverityColor(severity) {
        const colors = {
            'HIGH': '#ef4444',
            'MODERATE': '#f59e0b',
            'LOW': '#10b981'
        };
        return colors[severity] || '#999';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FloodDataHandler();
});