// Mobile Menu Toggle
function onToggleMenu() {
    const menu = document.getElementById("menu");
    menu.classList.toggle("hidden");
}

// Load Navigation Dynamically
function loadNavigation() {
    const navPlaceholder = document.getElementById("nav-placeholder");
    if (!navPlaceholder) {
        console.error("Navigation placeholder not found.");
        return;
    }

    fetch("nav.html")
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then(data => {
            navPlaceholder.innerHTML = data;
        })
        .catch(error => {
            console.error("Error loading navigation:", error);
            navPlaceholder.innerHTML = `
                <p class="text-red-500">Failed to load navigation. Please try again later.</p>
            `;
        });
}

// Initialize the Page
function initialize() {
    // Add event listener for mobile menu toggle
    const menuButton = document.querySelector("button[onclick='onToggleMenu()']");
    if (menuButton) {
        menuButton.removeAttribute("onclick");
        menuButton.addEventListener("click", onToggleMenu);
    }

    // Load navigation
    loadNavigation();
}

// Run initialization when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initialize);

// Fetch real-time flood data from ThingSpeak
async function fetchFloodData() {
    const channelID = "2892412"; // Your ThingSpeak Channel ID
    const apiKey = "HHPHA63FZ90965PY"; // Read API Key (if needed)
    
    // URL to get latest entry (JSON format)
    const url = `https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        updateFloodUI(data);
    } catch (error) {
        console.error("Error fetching flood data:", error);
    }
}

// Update the UI with fetched flood data
function updateFloodUI(data) {
    if (!data || !data.field1) {
        console.warn("No valid data received.");
        return;
    }

    document.getElementById("temperature").innerText = `${data.field1} °C`;
    document.getElementById("humidity").innerText = `${data.field2} %`;
    document.getElementById("distance").innerText = `${data.field3} cm`;

    let floodStatus;
    switch (parseInt(data.field4)) {
        case 3: floodStatus = "🚨 HIGH"; break;
        case 2: floodStatus = "⚠️ MEDIUM"; break;
        case 1: floodStatus = "🔵 LOW"; break;
        default: floodStatus = "✅ NORMAL"; break;
    }
    
    document.getElementById("floodStatus").innerText = floodStatus;
}

// Automatically fetch data every 15 seconds
setInterval(fetchFloodData, 15000);

// Run once when the page loads
document.addEventListener("DOMContentLoaded", fetchFloodData);
// for button data card 1
function toggleData() {
    let dataContainer = document.getElementById("realTimeData");
    dataContainer.classList.toggle("hidden");
}

async function fetchHistoricalData() {
    const tableBody = document.getElementById("historyTable");
    const historicalDataDiv = document.getElementById("historicalData");

    try {
        const response = await fetch("https://your-api-endpoint.com/flood-history"); // Replace with your database API
        const data = await response.json();

        tableBody.innerHTML = ""; // Clear previous data

        data.forEach(entry => {
            const row = `<tr class="border border-gray-300">
                <td class="px-4 py-2">${entry.date}</td>
                <td class="px-4 py-2">${entry.location}</td>
                <td class="px-4 py-2">${entry.severity}</td>
                <td class="px-4 py-2">${entry.waterLevel} cm</td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        historicalDataDiv.classList.remove("hidden"); // Show table
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
// for button data card 2
async function fetchHistoricalData() {
    const tableBody = document.getElementById("historyTable");
    const historicalDataDiv = document.getElementById("historicalData");

    try {
        const response = await fetch("https://your-api-endpoint.com/flood-history"); // Replace with your database API
        const data = await response.json();

        tableBody.innerHTML = ""; // Clear previous data

        data.forEach(entry => {
            const row = `<tr class="border border-gray-300">
                <td class="px-4 py-2">${entry.date}</td>
                <td class="px-4 py-2">${entry.location}</td>
                <td class="px-4 py-2">${entry.severity}</td>
                <td class="px-4 py-2">${entry.waterLevel} cm</td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        historicalDataDiv.classList.remove("hidden"); // Show table
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
// to display real-time flood trends
async function fetchChartData() {
    const response = await fetch("https://your-api-endpoint.com/flood-history");
    const data = await response.json();

    const labels = data.map(entry => entry.date);
    const floodLevels = data.map(entry => entry.waterLevel);

    const ctx = document.getElementById('floodChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Flood Water Level (cm)",
                data: floodLevels,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.2)",
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
fetchChartData(); // Call function on page load
// toggle historical data button
function toggleHistoricalData() {
    const historicalData = document.getElementById("historicalData");
    historicalData.classList.toggle("hidden");
}
//affected areas
async function fetchAffectedAreas() {
    try {
        const response = await fetch("your-api-endpoint"); // Replace with actual API
        const data = await response.json();

        return data.affectedAreas || []; // Adjust based on API structure
    } catch (error) {
        console.error("Error fetching affected areas:", error);
        return [];
    }
}

async function toggleAffectedAreas() {
    const affectedContainer = document.getElementById("affectedAreas");
    const affectedList = document.getElementById("affectedList");

    if (affectedContainer.classList.contains("hidden")) {
        affectedList.innerHTML = "";

        const affectedData = await fetchAffectedAreas(); 

        if (affectedData.length === 0) {
            affectedList.innerHTML = "<li>No affected areas found.</li>";
        } else {
            affectedData.forEach(area => {
                const listItem = document.createElement("li");
                listItem.textContent = area;
                affectedList.appendChild(listItem);
            });
        }

        affectedContainer.classList.remove("hidden");
    } else {
        affectedContainer.classList.add("hidden");
    }
}
// init map 
let map; // Declare map variable globally to avoid reloading

function initMap() {
    if (map) return; // Prevent reloading if map already initialized

    // Define center of the map (default location)
    const mapCenter = { lat: 14.5995, lng: 120.9842 }; // Example: Manila

    // Initialize the map
    map = new google.maps.Map(document.getElementById("map"), {
        center: mapCenter,
        zoom: 12, 
    });

    // Example affected areas (replace with API data)
    const affectedAreas = [
        { name: "Area 1", lat: 14.6091, lng: 121.0223 },
        { name: "Area 2", lat: 14.5606, lng: 121.0163 },
        { name: "Area 3", lat: 14.6560, lng: 121.0289 }
    ];

    // Add markers to the map
    affectedAreas.forEach(area => {
        new google.maps.Marker({
            position: { lat: area.lat, lng: area.lng },
            map,
            title: area.name,
        });
    });

    // Show the map when the button is clicked
    document.getElementById("map").style.display = "block";
}

// Function to fetch and update real-time flood data
function fetchRealTimeData() {
    fetch('/flood_data')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];  // Get the most recent data

                // Update real-time data fields
                document.getElementById('temperature').textContent = latestData.temperature || 'No data';
                document.getElementById('humidity').textContent = latestData.humidity || 'No data';
                document.getElementById('distance').textContent = latestData.waterLevel || 'No data';  // Assuming water level as distance
                document.getElementById('floodStatus').textContent = latestData.floodSeverity || 'No data';
            }
        })
        .catch(error => console.error('Error fetching real-time data:', error));
}

// Function to toggle visibility of real-time data
function toggleData() {
    const dataContainer = document.getElementById('realTimeData');
    dataContainer.classList.toggle('hidden');
}

// Function to fetch historical data and populate the table
function fetchHistoricalData() {
    fetch('/flood_data')  // Assuming historical data is the same as flood_data
        .then(response => response.json())
        .then(data => {
            let historyTableBody = document.getElementById('historyTable');
            historyTableBody.innerHTML = '';  // Clear existing table rows

            data.forEach(item => {
                let row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 px-4 py-2">${item.date || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2">${item.location || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2">${item.floodSeverity || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2">${item.waterLevel || 'N/A'}</td>
                `;
                historyTableBody.appendChild(row);
            });

            // Generate a chart (optional)
            const ctx = document.getElementById('floodChart').getContext('2d');
            const floodChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.date),  // Date as X-axis labels
                    datasets: [{
                        label: 'Water Level',
                        data: data.map(item => item.waterLevel),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false
                    }]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Date' } },
                        y: { title: { display: true, text: 'Water Level' } }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching historical data:', error));
}

// Function to initialize Google Maps
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },  // Set to your desired location
        zoom: 8
    });

    // Example of adding a marker (can be modified based on real data)
    const marker = new google.maps.Marker({
        position: { lat: -34.397, lng: 150.644 },
        map: map,
        title: "Flood Affected Area"
    });

    document.getElementById('map').style.display = 'block';  // Show map
}

setInterval(() => {
    fetch('/get-latest-data')
        .then(res => res.json())
        .then(data => {
            document.getElementById('liveData').textContent = data.sensor_data;
        })
        .catch(err => {
            console.error("Failed to fetch sensor data:", err);
        });
}, 2000); // fetch every 2 seconds
//forLeaflet map initialization:

document.addEventListener("DOMContentLoaded", function () {
    const map = L.map("osmMap").setView([14.5995, 120.9842], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    L.marker([14.5995, 120.9842]).addTo(map)
      .bindPopup("You are here!")
      .openPopup();
  });

  
  let map, directionsService, directionsRenderer;

  function initMap() {
    const binan = { lat: 14.3420, lng: 121.0803 };

    map = new google.maps.Map(document.getElementById("googleMap"), {
      zoom: 13,
      center: binan,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    // Enable Places autocomplete
    new google.maps.places.Autocomplete(document.getElementById('start'));
    new google.maps.places.Autocomplete(document.getElementById('end'));
  }

  function calculateRoute() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
      if (status === 'OK') {
        // Check response.routes[0].legs[0].steps and compare with flood zones
        if (isRouteFloodFree(response)) {
          directionsRenderer.setDirections(response);
        } else {
          alert("Warning: Suggested route includes flooded areas. Recalculating...");
          // Here you can trigger a function to re-route
        }
      } else {
        alert("Directions request failed: " + status);
      }
    });
  }

  function isRouteFloodFree(response) {
    // 🔧 This is where you implement flood checking
    // You would compare route coordinates with flood zone data from your DB or API
    // For now, return true as placeholder
    return true;
  }

