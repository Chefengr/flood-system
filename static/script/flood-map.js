// In your flood-map.js, update the class to work with your Flask API
class FloodDetectionSystem {
    constructor() {
        this.map = null;
        this.markers = L.layerGroup();
        this.currentData = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.settings = {
            refreshInterval: 30000,
            initialCoordinates: [14.3435, 121.0836], // Biñan City
            initialZoom: 13,
            colors: {
                severe: '#ef4444',    // red-500
                high: '#f97316',     // orange-500
                moderate: '#f59e0b', // yellow-500
                low: '#10b981',      // green-500
                unknown: '#6b7280'    // gray-500
            }
        };
    }
  
    async init() {
        this.initMap();
        this.initEventListeners();
        await this.loadData();
        this.startAutoRefresh();
    }
  
    initMap() {
        this.map = L.map('map-container').setView(this.settings.initialCoordinates, this.settings.initialZoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
        
        this.markers = L.layerGroup().addTo(this.map);
        this.addLegend();
        
        // Handle map resize
        window.addEventListener('resize', () => {
            this.map.invalidateSize();
            if (this.markers.getLayers().length > 0) {
                this.map.fitBounds(this.markers.getBounds().pad(0.2));
            }
        });
    }
  
    initEventListeners() {
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.currentPage = 1;
            this.loadData();
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('#prev-page')) {
                this.prevPage();
            }
            if (e.target.matches('#next-page')) {
                this.nextPage();
            }
        });
    }
  
    async loadData(page = 1) {
        try {
            this.showLoadingState();
            this.currentPage = page;
            
            const sensorResponse = await fetch(`http://localhost:5000/api/sensor-data?page=${currentPage}&per_page=${itemsPerPage}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data');
            }
            
            this.currentData = result.data.map(item => ({
                node_id: item.node_id,
                water_level: item.water_level,
                temperature: item.temperature,
                humidity: item.humidity,
                severity: item.severity,
                flood_status: item.flood_status,
                timestamp: item.timestamp,
                latitude: item.latitude || 14.3435 + (Math.random() * 0.01 - 0.005),
                longitude: item.longitude || 121.0807 + (Math.random() * 0.01 - 0.005)
            }));
            
            this.totalPages = result.pagination?.pages || 1;
            
            this.updateMap();
            this.updateDataTable();
            this.updateDashboard();
            this.updatePaginationControls();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorState(error.message);
        } finally {
            this.hideLoadingState();
        }
    }
  
    updateMap() {
        this.markers.clearLayers();
        
        this.currentData.forEach(sensor => {
            const marker = L.circleMarker(
                [sensor.latitude, sensor.longitude],
                this.getMarkerStyle(sensor)
            );
            
            marker.bindPopup(this.createPopupContent(sensor));
            this.markers.addLayer(marker);
        });
        
        if (this.markers.getLayers().length > 0) {
            this.map.fitBounds(this.markers.getBounds().pad(0.2));
        }
    }
  
    getMarkerStyle(sensor) {
        const severity = sensor.severity?.toLowerCase() || 'unknown';
        const isFlooding = sensor.flood_status === 'True';
        
        return {
            radius: 8,
            fillColor: isFlooding ? this.settings.colors.severe : this.settings.colors[severity],
            color: '#ffffff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
    }
  
    createPopupContent(sensor) {
        return `
            <div class="flood-popup">
                <strong>Node ${sensor.node_id}</strong><br>
                Water Level: ${sensor.water_level} cm<br>
                Temp: ${sensor.temperature}°C<br>
                Humidity: ${sensor.humidity}%<br>
                Status: <span style="color: ${sensor.flood_status === 'True' ? '#ef4444' : '#10b981'}">
                    ${sensor.flood_status === 'True' ? 'FLOODING' : 'Normal'}
                </span><br>
                Last Update: ${this.formatTimestamp(sensor.timestamp)}
            </div>
        `;
    }
  
    updateDataTable() {
        const tbody = document.getElementById('sensor-data-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.currentData.map(sensor => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">${sensor.node_id}</td>
                <td class="px-4 py-3">${sensor.water_level} cm</td>
                <td class="px-4 py-3">${sensor.temperature}°C</td>
                <td class="px-4 py-3">${sensor.humidity}%</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${
                        sensor.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                        sensor.severity === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }">
                        ${sensor.severity}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${
                        sensor.flood_status === 'True' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }">
                        ${sensor.flood_status === 'True' ? 'Flooding' : 'Normal'}
                    </span>
                </td>
                <td class="px-4 py-3">${this.formatTimestamp(sensor.timestamp)}</td>
            </tr>
        `).join('') || `
            <tr>
                <td colspan="7" class="px-4 py-4 text-center text-gray-500">
                    No sensor data available
                </td>
            </tr>
        `;
    }
  
    updateDashboard() {
        const stats = this.calculateStats();
        
        document.getElementById('active-nodes').textContent = 
            new Set(this.currentData.map(sensor => sensor.node_id)).size;
        document.getElementById('highest-reading').textContent = 
            stats.maxWaterLevel.toFixed(1);
        document.getElementById('average-level').textContent = 
            stats.avgWaterLevel.toFixed(1);
        document.getElementById('last-update').textContent = 
            this.formatTimestamp(this.currentData[0]?.timestamp);
    }
  
    calculateStats() {
        const stats = {
            maxWaterLevel: 0,
            totalWaterLevel: 0,
            count: 0
        };
        
        this.currentData.forEach(sensor => {
            const waterLevel = parseFloat(sensor.water_level);
            if (!isNaN(waterLevel)) {
                stats.maxWaterLevel = Math.max(stats.maxWaterLevel, waterLevel);
                stats.totalWaterLevel += waterLevel;
                stats.count++;
            }
        });
        
        stats.avgWaterLevel = stats.count > 0 ? stats.totalWaterLevel / stats.count : 0;
        return stats;
    }
  
    updatePaginationControls() {
        const container = document.getElementById('pagination-controls');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex items-center gap-4">
                <button id="prev-page" ${this.currentPage <= 1 ? 'disabled' : ''}
                    class="px-3 py-1 rounded-lg ${this.currentPage > 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}"
                    ${this.currentPage <= 1 ? 'disabled' : ''}>
                    Previous
                </button>
                
                <span class="text-sm">
                    Page ${this.currentPage} of ${this.totalPages}
                </span>
                
                <button id="next-page" ${this.currentPage >= this.totalPages ? 'disabled' : ''}
                    class="px-3 py-1 rounded-lg ${this.currentPage < this.totalPages ? 'bg-blue-600 text-white' : 'bg-gray-200'}"
                    ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        `;
    }
  
    prevPage() {
        if (this.currentPage > 1) {
            this.loadData(this.currentPage - 1);
        }
    }
  
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.loadData(this.currentPage + 1);
        }
    }
  
    addLegend() {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend bg-white p-3 rounded-lg shadow-md');
            div.innerHTML = `
                <h4 class="font-bold mb-2">Legend</h4>
                <div class="flex items-center mb-1">
                    <span class="legend-icon danger"></span>
                    <span>Flooding</span>
                </div>
                <div class="flex items-center mb-1">
                    <span class="legend-icon warning"></span>
                    <span>High Risk</span>
                </div>
                <div class="flex items-center">
                    <span class="legend-icon normal"></span>
                    <span>Normal</span>
                </div>
            `;
            return div;
        };
        
        legend.addTo(this.map);
    }
  
    formatTimestamp(timestamp) {
        if (!timestamp) return '--';
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
        }
    }
  
    showLoadingState() {
        document.getElementById('loading-indicator')?.classList.remove('hidden');
    }
  
    hideLoadingState() {
        document.getElementById('loading-indicator')?.classList.add('hidden');
    }
  
    showErrorState(message) {
        const container = document.getElementById('error-container');
        if (container) {
            container.innerHTML = `<p>${message}</p>`;
            container.classList.remove('hidden');
            setTimeout(() => container.classList.add('hidden'), 5000);
        }
    }
  
    startAutoRefresh() {
        this.refreshInterval = setInterval(
            () => this.loadData(this.currentPage),
            this.settings.refreshInterval
        );
    }
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.floodSystem = new FloodDetectionSystem();
    window.floodSystem.init();
  });