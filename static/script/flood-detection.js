class FloodDetectionSystem {
    constructor() {
        this.currentData = [];
        this.currentPage = 1;
        this.map = null;
        this.markers = [];
        this.chart = null;
        this.initMap();
        this.initChart();
        this.updateSensorData();
    }

    // 1. Initialize Map (with fallback for null coordinates)
    initMap() {
        // Default to Biñan City coordinates if no sensor locations available
        this.map = L.map('map-container').setView([14.3333, 121.0833], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Add legend
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend bg-white p-2 rounded shadow');
            div.innerHTML = `
                <h4 class="font-bold mb-1">Flood Status</h4>
                <div><i class="legend-icon danger"></i> Danger</div>
                <div><i class="legend-icon warning"></i> Warning</div>
                <div><i class="legend-icon normal"></i> Normal</div>
            `;
            return div;
        };
        legend.addTo(this.map);
    }

    // 2. Update Map Markers (with null checks)
    updateMapMarkers() {
        // Clear existing markers
        if (this.markers) {
            this.markers.forEach(marker => this.map.removeLayer(marker));
            this.markers = [];
        }

        // Filter out sensors without coordinates
        const locatedSensors = this.currentData.filter(sensor => 
            sensor.latitude !== null && sensor.longitude !== null
        );

        if (locatedSensors.length === 0) {
            // Show warning if no sensors have coordinates
            const warning = L.popup()
                .setLatLng([14.3333, 121.0833])
                .setContent('<div class="text-red-500">No sensor locations available</div>')
                .openOn(this.map);
            return;
        }

        // Create marker cluster group
        const markerCluster = L.markerClusterGroup();
        
        // Add new markers
        locatedSensors.forEach(sensor => {
            const marker = L.circleMarker(
                [sensor.latitude, sensor.longitude],
                {
                    radius: 8,
                    fillColor: this.getStatusColor(sensor.status),
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }
            ).bindPopup(`
                <div class="flood-popup p-2">
                    <b>${sensor.node_id}</b><br>
                    Water: ${sensor.water_level} m<br>
                    Temp: ${sensor.temperature}°C<br>
                    Status: ${sensor.status.toLowerCase()}
                </div>
            `);
            
            markerCluster.addLayer(marker);
            this.markers.push(marker);
        });

        this.map.addLayer(markerCluster);
        this.map.fitBounds(markerCluster.getBounds());
    }

    getStatusColor(status) {
        const statusLower = (status || '').toLowerCase();
        const colors = {
            'danger': '#dc2626',
            'warning': '#ea580c',
            'normal': '#16a34a'
        };
        return colors[statusLower] || '#888';
    }

    // 3. Handle Pagination
    setupPagination(paginationInfo) {
        const paginationDiv = document.getElementById('pagination-controls');
        if (!paginationDiv) return;

        paginationDiv.innerHTML = `
            <button class="px-4 py-2 rounded-lg ${paginationInfo.current_page <= 1 ? 
                'bg-gray-200 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200'}" 
                ${paginationInfo.current_page <= 1 ? 'disabled' : ''} 
                onclick="floodSystem.changePage(${paginationInfo.current_page - 1})">
                Previous
            </button>
            <span class="px-4">
                Page ${paginationInfo.current_page} of ${paginationInfo.total_pages}
            </span>
            <button class="px-4 py-2 rounded-lg ${paginationInfo.current_page >= paginationInfo.total_pages ? 
                'bg-gray-200 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200'}"
                ${paginationInfo.current_page >= paginationInfo.total_pages ? 'disabled' : ''}
                onclick="floodSystem.changePage(${paginationInfo.current_page + 1})">
                Next
            </button>
        `;
    }

    changePage(newPage) {
        this.currentPage = newPage;
        this.updateSensorData();
    }

    // 4. Data Visualization Chart (with zero-value handling)
    initChart() {
        const ctx = document.getElementById('sensor-chart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y || 0}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        type: 'time',
                        time: {
                            tooltipFormat: 'MMM d, h:mm a'
                        }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Water Level (m)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Temperature (°C)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        const parseFloatSafe = (val) => parseFloat(val) || 0;

        const waterLevels = {
            label: 'Water Level',
            data: this.currentData.map(d => ({
                x: new Date(d.last_update),
                y: parseFloatSafe(d.water_level)
            })),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            yAxisID: 'y'
        };

        const temperatures = {
            label: 'Temperature',
            data: this.currentData.map(d => ({
                x: new Date(d.last_update),
                y: parseFloatSafe(d.temperature)
            })),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            yAxisID: 'y1'
        };

        this.chart.data.datasets = [waterLevels, temperatures];
        this.chart.update();
    }

    // 5. Update Data Table (with enhanced formatting)
    updateDataTable() {
        const tbody = document.getElementById('sensor-data-body');
        if (!tbody) return;

        if (!this.currentData || this.currentData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-4 text-center text-gray-500">
                        No sensor data available
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.currentData.map(sensor => {
            // Format last_update to be more readable
            const lastUpdate = sensor.last_update ? 
                new Date(sensor.last_update).toLocaleString() : 
                'N/A';

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">${sensor.node_id || 'N/A'}</td>
                    <td class="px-4 py-3">${sensor.water_level || '0'} m</td>
                    <td class="px-4 py-3">${sensor.temperature || '0'}°C</td>
                    <td class="px-4 py-3">${sensor.humidity || '0'}%</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs ${
                            sensor.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                            sensor.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }">
                            ${sensor.severity || 'UNKNOWN'}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs ${
                            sensor.status === 'DANGER' ? 'bg-red-100 text-red-800' :
                            sensor.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }">
                            ${sensor.status ? sensor.status.toLowerCase() : 'normal'}
                        </span>
                    </td>
                    <td class="px-4 py-3">${lastUpdate}</td>
                </tr>
            `;
        }).join('');
    }

    // 6. Main Data Fetcher (with enhanced error handling)
    async updateSensorData() {
        try {
            document.getElementById('loading-indicator').classList.remove('hidden');
            document.getElementById('error-container').classList.add('hidden');
            
            const sensorResponse = await fetch(`http://localhost:5000/api/sensor-data?page=${currentPage}&per_page=${itemsPerPage}`);

            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.data || !Array.isArray(result.data)) {
                throw new Error("Invalid data format received");
            }

            this.currentData = result.data;
            this.updateDataTable();
            this.updateMapMarkers();
            this.updateChart();
            
            if (result.pagination) {
                this.setupPagination(result.pagination);
            }
            
        } catch (error) {
            console.error("Failed to update sensor data:", error);
            this.showError(`Data load failed: ${error.message}`);
        } finally {
            document.getElementById('loading-indicator').classList.add('hidden');
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.querySelector('p').textContent = message;
            errorContainer.classList.remove('hidden');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.floodSystem = new FloodDetectionSystem();
    
    // Set up refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        floodSystem.updateSensorData();
    });
    
    // Auto-refresh every 60 seconds
    setInterval(() => floodSystem.updateSensorData(), 60000);
});