let hospitals = [];
const searchBtn = document.getElementById('searchBtn');
const zipInput = document.getElementById('zipInput');
const resultsContainer = document.getElementById('resultsContainer');

// Fetch the hospital data from the external JSON file when the app loads
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('hospitals.json');
        hospitals = await response.json();
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p class="text-red-700 text-sm font-medium">Error loading hospital database. Please try refreshing.</p>
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

    const matchedHospitals = hospitals.filter(h => h.zipcode === queryZip);

    if (matchedHospitals.length === 0) {
        resultsContainer.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p class="text-amber-800 text-sm font-medium">No hospitals found directly in zip code ${queryZip}.</p>
                <p class="text-slate-600 text-xs mt-1">Try testing with active zip codes like <strong>10016</strong>, <strong>11373</strong>, <strong>11203</strong>, or <strong>10461</strong>.</p>
            </div>
        `;
        return;
    }

    matchedHospitals.forEach(h => {
        const mapsQuery = encodeURIComponent(`${h.name}, ${h.address}, ${h.boro}, NY ${h.zipcode}`);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

        resultsContainer.innerHTML += `
            <div class="border border-slate-200 p-4 rounded-lg bg-slate-50 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-slate-800">${h.name}</h3>
                    <p class="text-sm text-slate-600 mt-1">${h.address}, ${h.boro} ${h.zipcode}</p>
                    <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-2 font-medium">${h.insurance}</span>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                    <a href="${mapsUrl}" class="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        🗺️ Open in Google Maps
                    </a>
                </div>
            </div>
        `;
    });
}