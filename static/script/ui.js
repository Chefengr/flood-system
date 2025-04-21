// Mobile Menu Toggle
document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
    document.getElementById("mobile-menu").classList.toggle("hidden");
  });
  
  // Map Toggle Functionality
  document.getElementById("show-google-map")?.addEventListener("click", () => {
    document.getElementById("googleMap").classList.add("active");
    document.getElementById("osmMap").classList.remove("active");
    
    // Update button styles
    document.getElementById("show-google-map").classList.replace("bg-gray-300", "bg-blue-600");
    document.getElementById("show-google-map").classList.replace("text-gray-800", "text-white");
    document.getElementById("show-osm-map").classList.replace("bg-blue-600", "bg-gray-300");
    document.getElementById("show-osm-map").classList.replace("text-white", "text-gray-800");
  });
  
  document.getElementById("show-osm-map")?.addEventListener("click", () => {
    document.getElementById("osmMap").classList.add("active");
    document.getElementById("googleMap").classList.remove("active");
    
    // Update button styles
    document.getElementById("show-osm-map").classList.replace("bg-gray-300", "bg-blue-600");
    document.getElementById("show-osm-map").classList.replace("text-gray-800", "text-white");
    document.getElementById("show-google-map").classList.replace("bg-blue-600", "bg-gray-300");
    document.getElementById("show-google-map").classList.replace("text-white", "text-gray-800");
  });
  
  // Route Calculation Button
  document.getElementById("calculate-route")?.addEventListener("click", () => {
    alert("Route calculation will be implemented in route-optimization.js");
  });