let hospitals = [];
const searchBtn = document.getElementById('searchBtn');
const zipInput = document.getElementById('zipInput');
const resultsContainer = document.getElementById('resultsContainer');

// Approximate center coordinates for common NYC zip codes used as a fallback lookup
const zipCoords = {
    "10001": { lat: 40.7505, lon: -73.9934 },
    "10016": { lat: 40.7441, lon: -73.9774 },
    "10028": { lat: 40.7762, lon: -73.9532 },
    "10029": { lat: 40.7904, lon: -73.9436 },
    "11201": { lat: 40.6934, lon: -73.9897 },
    "11203": { lat: 40.6521, lon: -73.9355 },
    "11373": { lat: 40.7383, lon: -73.8849 },
    "10461": { lat: 40.8447, lon: -73.8378 },
    "10301": { lat: 40.6353, lon: -74.0954 }
};

// Haversine formula to calculate distance in miles between two coordinate sets
function getDistanceFromLatLonInMiles(lat1, lon1, lat2, lon2) {
    const R = 3959; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fetch live hospital data with coordinates from the NYC Open Data API on startup
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const apiUrl = 'https://data.cityofnewyork.us/resource/ji82-xba5.json?$where=lower(factype)%20LIKE%20%25hospital%25&$limit=200';
        const response = await fetch(apiUrl);
        const rawData = await response.json();

        hospitals = rawData.map(facility => ({
            name: facility.facname,
            address: facility.address || 'Address unavailable',
            boro: facility.boro || 'NYC',
            zipcode: facility.zipcode ? facility.zipcode.toString().trim() : '',
            lat: parseFloat(facility.latitude || facility.lat),
            lon: parseFloat(facility.longitude || facility.lon),
            insurance: "Accepts Medicaid & Medicare"
        })).filter(h => !isNaN(h.lat) && !isNaN(h.lon));

    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p class="text-red-700 text-sm font-medium">Error loading live city data. Please try refreshing.</p>
            </div>
        `;
    }
});

searchBtn.addEventListener('click', performSearch);
zipInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const queryZip = zipInput.value.trim();
    resultsContainer.innerHTML = '';

    if (queryZip.length !== 5 || isNaN(queryZip)) {
        resultsContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p class="text-red-700 text-sm font-medium">Please enter a valid 5-digit numeric NYC zip code.</p>
            </div>
        `;
        return;
    }

    // Step 1: Look for exact zip code matches first
    let matchedHospitals = hospitals.filter(h => h.zipcode === queryZip);
    let isFallback = false;

    // Step 2: If none found, calculate the nearest hospitals using coordinates
    if (matchedHospitals.length === 0 && zipCoords[queryZip]) {
        isFallback = true;
        const targetCoord = zipCoords[queryZip];
        
        const hospitalsWithDistance = hospitals.map(h => ({
            ...h,
            distance: getDistanceFromLatLonInMiles(targetCoord.lat, targetCoord.lon, h.lat, h.lon)
        }));

        // Sort from closest to furthest and take top 3
        hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
        matchedHospitals = hospitalsWithDistance.slice(0, 3);
    }

    if (matchedHospitals.length === 0) {
        resultsContainer.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p class="text-amber-800 text-sm font-medium">No hospitals found near zip code ${queryZip}.</p>
                <p class="text-slate-600 text-xs mt-1">Try major hubs like <strong>10016</strong>, <strong>11373</strong>, or <strong>11203</strong>.</p>
            </div>
        `;
        return;
    }

    if (isFallback) {
        resultsContainer.innerHTML += `
            <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                <p class="text-blue-800 text-xs font-medium">No hospital directly in ${queryZip}. Showing the <strong>nearest hospitals</strong> instead:</p>
            </div>
        `;
    }

    matchedHospitals.forEach(h => {
        const mapsQuery = encodeURIComponent(`${h.name}, ${h.address}, ${h.boro}, NY ${h.zipcode}`);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
        const distanceText = h.distance ? `<span class="text-xs text-blue-600 font-semibold block mt-1">📍 Approx. ${h.distance.toFixed(1)} miles away</span>` : '';

        resultsContainer.innerHTML += `
            <div class="border border-slate-200 p-4 rounded-lg bg-slate-50 shadow-sm flex flex-col justify-between mb-3">
                <div>
                    <h3 class="font-bold text-slate-800">${h.name}</h3>
                    <p class="text-sm text-slate-600 mt-1">${h.address}, ${h.boro} ${h.zipcode}</p>
                    ${distanceText}
                    <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-2 font-medium">${h.insurance}</span>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                    <a href="${mapsUrl}" target="_blank" class="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        🗺️ Open in Google Maps
                    </a>
                </div>
            </div>
        `;
    });
}
