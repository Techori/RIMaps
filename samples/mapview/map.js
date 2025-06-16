// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const API_KEY = '56d2c2af9d93cb0368220fcb9d8b82e81fe27380d16de00861d1adc21e3b4f97';

// Initialize map
const map = L.map('map', {
    zoomControl: false // We'll add custom zoom control
}).setView([0, 0], 2);

// Add custom zoom control
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Add scale control
L.control.scale({
    imperial: false,
    position: 'bottomright'
}).addTo(map);

// Add coordinates display
const coordinatesDisplay = L.control({ position: 'bottomleft' });
coordinatesDisplay.onAdd = function() {
    const div = L.DomUtil.create('div', 'coordinates-display');
    div.innerHTML = 'Lat: 0, Lng: 0, Zoom: 2';
    return div;
};
coordinatesDisplay.addTo(map);

// Update coordinates display on map move
map.on('mousemove', function(e) {
    const { lat, lng } = e.latlng;
    const zoom = map.getZoom();
    coordinatesDisplay.getContainer().innerHTML = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}, Zoom: ${zoom}`;
});

// Global variables
let currentMarker = null;
let routeLayer = null;
let nearbyMarkers = [];
let selectionMarker = null;
let tileLayer = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const getDirectionsButton = document.getElementById('getDirections');
const searchNearbyButton = document.getElementById('searchNearby');
const locationDetails = document.getElementById('locationDetails');
const directionsInfo = document.getElementById('directionsInfo');
const directionsDetails = document.getElementById('directionsDetails');
const selectedLocationInfo = document.getElementById('selectedLocationInfo');

// Event Listeners
searchButton.addEventListener('click', handleSearch);
getDirectionsButton.addEventListener('click', handleDirections);
searchNearbyButton.addEventListener('click', handleNearbySearch);

// Add click event to map for location selection
map.on('click', handleMapClick);

// Load tile metadata
async function loadTileMetadata() {
    try {
        const response = await fetch(`${API_BASE_URL}/tiles/metadata`);

        if (!response.ok) {
            throw new Error('Could not load tile metadata');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error loading tile metadata:', error);
        return null;
    }
}

// Initialize map with tile metadata
async function initializeMap() {
    const metadata = await loadTileMetadata();
    
    // Remove existing tile layer if it exists
    if (tileLayer) {
        map.removeLayer(tileLayer);
    }

    // Create new tile layer with metadata
    tileLayer = L.tileLayer(`${API_BASE_URL}/tiles/{z}/{x}/{y}`, {
        attribution: metadata?.attribution || '© OpenStreetMap contributors',
        maxZoom: metadata?.maxZoom || 18,
        minZoom: metadata?.minZoom || 0,
        tileSize: metadata?.tileSize || 256,
        bounds: metadata?.bounds ? L.latLngBounds(
            [metadata.bounds[1], metadata.bounds[0]],
            [metadata.bounds[3], metadata.bounds[2]]
        ) : undefined,
        // Add event listeners for debugging
        tileloadstart: function(e) {
            console.log('Loading tile:', e.coords);
        },
        tileload: function(e) {
            console.log('Tile loaded:', e.coords);
        },
        tileerror: function(e) {
            console.error('Tile error:', e.coords, e.error);
        }
    }).addTo(map);

    // Test tile loading
    console.log('Testing tile request...');
    fetch(`${API_BASE_URL}/tiles/0/0/0`)
    .then(response => {
        console.log('Tile response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        console.log('Tile loaded successfully, size:', blob.size);
    })
    .catch(error => {
        console.error('Error loading test tile:', error);
    });
}

// Initialize map
initializeMap();

// Handle map click for location selection
async function handleMapClick(e) {
    const { lat, lng } = e.latlng;
    
    // Remove previous selection marker if exists
    if (selectionMarker) {
        map.removeLayer(selectionMarker);
    }

    // Add new marker at clicked location
    selectionMarker = L.marker([lat, lng]).addTo(map);
    
    // Display coordinates immediately
    selectedLocationInfo.innerHTML = `
        <h3>Selected Location</h3>
        <p>Latitude: ${lat.toFixed(6)}</p>
        <p>Longitude: ${lng.toFixed(6)}</p>
        <button id="getAddressBtn" class="btn">Get Address</button>
    `;

    // Add event listener to the Get Address button
    document.getElementById('getAddressBtn').addEventListener('click', () => getAddressFromCoordinates(lat, lng));
}

// Get address from coordinates
async function getAddressFromCoordinates(lat, lng) {
    try {
        const response = await fetch(`${API_BASE_URL}/geocode/reverse?lat=${lat}&lng=${lng}&provider=osm`, {
            headers: {
                'x-api-key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Could not get address details');
        }

        const responseData = await response.json();
        const data = responseData.data;
        
        // Format address details
        const addressDetails = data.raw.addressDetails;
        const formattedAddress = [
            addressDetails.amenity,
            addressDetails.road,
            addressDetails.suburb,
            addressDetails.city,
            addressDetails.state,
            addressDetails.postcode,
            addressDetails.country
        ].filter(Boolean).join(', ');

        // Update the selected location info with address
        selectedLocationInfo.innerHTML = `
            <h3>Selected Location</h3>
            <p>Address: ${formattedAddress}</p>
            <p>Latitude: ${lat.toFixed(6)}</p>
            <p>Longitude: ${lng.toFixed(6)}</p>
            <p>Place ID: ${data.raw.placeId}</p>
            <p>Type: ${data.raw.types || 'Not specified'}</p>
            <button id="getAddressBtn" class="btn">Refresh Address</button>
        `;

        // Show popup
        selectionMarker.bindPopup(formattedAddress).openPopup();

        // Reattach event listener
        document.getElementById('getAddressBtn').addEventListener('click', () => getAddressFromCoordinates(lat, lng));
    } catch (error) {
        console.error('Error getting address details:', error);
        selectedLocationInfo.innerHTML = `
            <h3>Selected Location</h3>
            <p>Latitude: ${lat.toFixed(6)}</p>
            <p>Longitude: ${lng.toFixed(6)}</p>
            <p class="error">Could not get address details</p>
            <button id="getAddressBtn" class="btn">Try Again</button>
        `;
        // Reattach event listener
        document.getElementById('getAddressBtn').addEventListener('click', () => getAddressFromCoordinates(lat, lng));
    }
}

// Search for a location
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
        const response = await fetch(`${API_BASE_URL}/geocode?address=${encodeURIComponent(query)}&provider=osm`, {
            headers: {
                'x-api-key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Location not found');
        }

        const data = await response.json();
        displayLocation(data);
    } catch (error) {
        alert('Error searching location: ' + error.message);
    }
}

// Display location on map
function displayLocation(data) {
    // Clear previous marker
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Add new marker
    const { lat, lng } = data.location;
    currentMarker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 13);

    // Display location details
    locationDetails.innerHTML = `
        <h3>${data.address}</h3>
        <p>Latitude: ${lat}</p>
        <p>Longitude: ${lng}</p>
        <p>Place ID: ${data.placeId}</p>
    `;

    // Show popup
    currentMarker.bindPopup(data.address).openPopup();
}

// Get directions
async function handleDirections() {
    if (!currentMarker) {
        alert('Please search for a location first');
        return;
    }

    const destination = prompt('Enter destination:');
    if (!destination) return;

    try {
        const response = await fetch(
            `${API_BASE_URL}/directions?origin=${currentMarker.getLatLng().lat},${currentMarker.getLatLng().lng}&destination=${encodeURIComponent(destination)}&provider=osm`,
            {
                headers: {
                    'x-api-key': API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error('Could not get directions');
        }

        const data = await response.json();
        displayDirections(data);
    } catch (error) {
        alert('Error getting directions: ' + error.message);
    }
}

// Display directions on map
function displayDirections(data) {
    // Clear previous route
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    // Decode polyline and create route
    const coordinates = L.Polyline.fromEncoded(data.polyline).getLatLngs();
    routeLayer = L.polyline(coordinates, {
        color: 'blue',
        weight: 5,
        opacity: 0.7
    }).addTo(map);

    // Fit map to show entire route
    map.fitBounds(routeLayer.getBounds());

    // Display directions details
    directionsInfo.style.display = 'block';
    directionsDetails.innerHTML = `
        <p>Distance: ${data.distance.text}</p>
        <p>Duration: ${data.duration.text}</p>
        <h3>Steps:</h3>
        <ol>
            ${data.steps.map(step => `
                <li>
                    ${step.instruction}<br>
                    <small>${step.distance.text} - ${step.duration.text}</small>
                </li>
            `).join('')}
        </ol>
    `;
}

// Search for nearby places
async function handleNearbySearch() {
    if (!currentMarker) {
        alert('Please search for a location first');
        return;
    }

    const type = prompt('Enter place type (e.g., restaurant, hotel):');
    if (!type) return;

    try {
        const { lat, lng } = currentMarker.getLatLng();
        const response = await fetch(
            `${API_BASE_URL}/map/nearby?lat=${lat}&lng=${lng}&type=${encodeURIComponent(type)}&provider=osm`,
            {
                headers: {
                    'x-api-key': API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error('Could not find nearby places');
        }

        const data = await response.json();
        displayNearbyPlaces(data);
    } catch (error) {
        alert('Error searching nearby places: ' + error.message);
    }
}

// Display nearby places on map
function displayNearbyPlaces(data) {
    // Clear previous nearby markers
    nearbyMarkers.forEach(marker => map.removeLayer(marker));
    nearbyMarkers = [];

    // Add markers for each place
    data.places.forEach(place => {
        const marker = L.marker([place.location.lat, place.location.lng])
            .bindPopup(`
                <h3>${place.name}</h3>
                <p>${place.address}</p>
                <p>Distance: ${place.distance}</p>
            `)
            .addTo(map);
        nearbyMarkers.push(marker);
    });

    // Create a feature group for the markers
    const group = L.featureGroup(nearbyMarkers);
    map.fitBounds(group.getBounds().pad(0.1));
}

// Error handling
function handleError(error) {
    console.error('Error:', error);
    alert('An error occurred: ' + error.message);
} 