import L from 'leaflet';

// Make Leaflet available globally
window.L = L;

let restaurants = [];
let map;
let markers = {};
let markerLayer;
let userSelectedRestaurant = false;

// Restaurant rating attributes
const RATING_ATTRIBUTES = ['Crust', 'Dough', 'Sauce', 'Cheese', 'Basil', 'Sliced', 'Sloppiness', 'Saltiness', 'Oiliness'];

function getRestaurantAttributes(restaurant) {
    return RATING_ATTRIBUTES.map(name => ({ name, value: restaurant[name] }));
}

function generateRatingsHtml(attributes) {
    return attributes.map(attr => {
        const value = parseInt(attr.value);
        const percentage = (value / 10) * 100;
        return `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">${attr.name}</span>
                    <span class="text-sm font-medium text-gray-700">${attr.value}/10</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Mobile menu toggle
function toggleMobileMenu(show) {
    document.getElementById('mobile-menu').classList.toggle('hidden', !show);
    document.getElementById('mobile-filters').classList.toggle('translate-x-full', !show);
}

document.getElementById('mobile-menu-toggle').addEventListener('click', () => toggleMobileMenu(true));
document.getElementById('close-mobile-menu').addEventListener('click', () => toggleMobileMenu(false));

// Sync mobile and desktop filter inputs
function syncFilters(sourceId, targetId) {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (source && target) {
        target.value = source.value;
    }
}

// Set up filter input listeners
const filterInputs = [
    ['search-input', 'search-input-mobile'],
    ['country-filter', 'country-filter-mobile'],
    ['sort-by', 'sort-by-mobile'],
    ['rating-min', 'rating-min-mobile']
];

filterInputs.forEach(([desktopId, mobileId]) => {
    const desktopEl = document.getElementById(desktopId);
    const mobileEl = document.getElementById(mobileId);
    if (desktopEl) desktopEl.addEventListener('change', () => syncFilters(desktopId, mobileId));
    if (desktopEl) desktopEl.addEventListener('input', () => syncFilters(desktopId, mobileId));
    if (mobileEl) mobileEl.addEventListener('change', () => syncFilters(mobileId, desktopId));
    if (mobileEl) mobileEl.addEventListener('input', () => syncFilters(mobileId, desktopId));
});

// Sync rating display
function syncRatingDisplay(sourceId) {
    const val = document.getElementById(sourceId).value;
    const formattedVal = parseFloat(val).toFixed(1) + '+';
    document.getElementById('rating-display').textContent = formattedVal;
    document.getElementById('rating-display-mobile').textContent = formattedVal;
    document.getElementById('rating-min').value = val;
    document.getElementById('rating-min-mobile').value = val;
}

document.getElementById('rating-min').addEventListener('input', () => syncRatingDisplay('rating-min'));
document.getElementById('rating-min-mobile').addEventListener('input', () => syncRatingDisplay('rating-min-mobile'));

async function loadCSV() {
    try {
        const response = await fetch('./data/ratings.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading JSON:', error);
        return [];
    }
}

function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}

function parsePrice(priceStr) {
    return parseFloat(priceStr.replace('£', ''));
}

function getRatingColor(rating) {
    const score = parseFloat(rating);
    if (score >= 8) return 'bg-red-100 text-red-800';
    if (score >= 7) return 'bg-orange-100 text-orange-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
}

function updateStats() {
    const count = restaurants.length;
    const avgRating = (restaurants.reduce((sum, r) => sum + parseFloat(r.mScore), 0) / count).toFixed(1);
    const topRestaurant = restaurants.reduce((top, r) =>
        parseFloat(r.mScore) > parseFloat(top.mScore) ? r : top
    );
    const countries = new Set(restaurants.map(r => r.Country));

    document.getElementById('total-count').textContent = count;
    document.getElementById('avg-rating').textContent = avgRating;
    document.getElementById('top-restaurant').textContent = `${topRestaurant.Name} (${topRestaurant.mScore})`;
    document.getElementById('country-count').textContent = countries.size;

    // Populate country filter
    const countryFilter = document.getElementById('country-filter');
    const currentValue = countryFilter.value;
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    Array.from(countries).sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
    countryFilter.value = currentValue;
}

function renderRestaurants(filteredRestaurants) {
    const list = document.getElementById('restaurants-list');
    const mobileList = document.getElementById('restaurants-list-mobile');
    list.innerHTML = '';
    mobileList.innerHTML = '';

    filteredRestaurants.forEach(restaurant => {
        const createListItem = () => {
            const div = document.createElement('div');
            div.className = 'p-3 hover:bg-gray-50 cursor-pointer transition';
            div.onclick = () => {
                focusOnRestaurant(restaurant);
                toggleMobileMenu(false);
            };

            div.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <div class="font-medium text-gray-900 text-sm">${restaurant.Name}</div>
                    <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${getRatingColor(restaurant.mScore)}">
                        ${restaurant.mScore}
                    </span>
                </div>
                <div class="text-xs text-gray-600">${restaurant.Location}, ${restaurant.Country}</div>
                <div class="text-xs text-gray-500 mt-1">${restaurant.Date} • ${restaurant.Price}</div>
            `;
            return div;
        };

        list.appendChild(createListItem());
        mobileList.appendChild(createListItem());
    });

    // Update map to show only filtered restaurants
    updateMapMarkers(filteredRestaurants);
}

function focusOnRestaurant(restaurant) {
    const lat = parseFloat(restaurant.Lat);
    const lon = parseFloat(restaurant.Lon);

    if (lat && lon && map) {
        // Set flag to prevent auto-recentering
        userSelectedRestaurant = true;

        // First, close any open popups
        map.closePopup();

        // Force an immediate, non-animated pan first to ensure we move
        map.panTo([lat, lon], { animate: false });

        // Then set view with proper zoom
        setTimeout(() => {
            map.setView([lat, lon], 12, {
                animate: true,
                duration: 0.5
            });

            // Open the marker popup if it exists
            const markerId = `${restaurant.Name}-${lat}-${lon}`;
            if (markers[markerId]) {
                setTimeout(() => {
                    markers[markerId].openPopup();
                }, 600);
            }
        }, 10);
    }
}

function updateMapMarkers(filteredRestaurants) {
    if (!map || !markerLayer) return;

    // Clear existing markers
    markerLayer.clearLayers();
    markers = {};

    const bounds = [];

    // Add markers for filtered restaurants
    filteredRestaurants.forEach(restaurant => {
        const lat = parseFloat(restaurant.Lat);
        const lon = parseFloat(restaurant.Lon);

        if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
            const rating = parseFloat(restaurant.mScore);
            let color = '#6b7280'; // gray
            if (rating >= 8) color = '#ef4444'; // red
            else if (rating >= 7) color = '#f97316'; // orange
            else if (rating >= 6) color = '#eab308'; // yellow

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-badge" style="background-color: ${color};">${rating}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([lat, lon], {
                icon: icon,
                zIndexOffset: Math.round(rating * 100)
            }).addTo(markerLayer);

            marker.bindPopup(`
                <div class="popup-container">
                    <div class="popup-title">${restaurant.Name}</div>
                    <div class="popup-grid">
                        <div>
                            <div class="popup-label">Overall Rating</div>
                            <div class="popup-value">${restaurant.mScore}</div>
                        </div>
                        <div>
                            <div class="popup-label">Price</div>
                            <div class="popup-value">${restaurant.Price}</div>
                        </div>
                        <div class="popup-location-full">
                            <div class="popup-location-label">Location</div>
                            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.Name + ' ' + restaurant.Location + ' ' + restaurant.Country)}" target="_blank" rel="noopener noreferrer" class="popup-location-value" style="color: #2563eb; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                <svg style="width: 14px; height: 14px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span>${restaurant.Location}, ${restaurant.Country}</span>
                            </a>
                        </div>
                    </div>
                </div>
            `, { maxWidth: 250 });

            // Open detail view when popup is opened
            marker.on('popupopen', () => {
                showDetailInSidebar(restaurant);
            });

            // Store marker reference
            const markerId = `${restaurant.Name}-${lat}-${lon}`;
            markers[markerId] = marker;

            bounds.push([lat, lon]);
        }
    });

    // Fit map to show all filtered markers (only if user hasn't manually selected)
    if (!userSelectedRestaurant && bounds.length > 0) {
        if (bounds.length === 1) {
            map.setView(bounds[0], 10);
        } else {
            map.fitBounds(bounds, {
                padding: [80, 80],
                animate: false
            });
        }
    }
}

function showDetailInSidebar(restaurant) {
    const ratingsHtml = generateRatingsHtml(getRestaurantAttributes(restaurant));
    const location = `${restaurant.Location}, ${restaurant.Country}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.Name + ' ' + restaurant.Location + ' ' + restaurant.Country)}`;

    // Update both desktop and mobile views
    const updates = [
        ['sidebar-detail-name', 'mobile-detail-name', restaurant.Name],
        ['sidebar-detail-rating', 'mobile-detail-rating', restaurant.mScore],
        ['sidebar-detail-price', 'mobile-detail-price', restaurant.Price],
        ['sidebar-detail-date', 'mobile-detail-date', restaurant.Date]
    ];

    updates.forEach(([desktopId, mobileId, value]) => {
        document.getElementById(desktopId).textContent = value;
        document.getElementById(mobileId).textContent = value;
    });

    // Update location links
    const desktopLocationLink = document.getElementById('sidebar-detail-location');
    desktopLocationLink.href = googleMapsUrl;
    desktopLocationLink.querySelector('span').textContent = location;

    const mobileLocationLink = document.getElementById('mobile-detail-location');
    mobileLocationLink.href = googleMapsUrl;
    mobileLocationLink.querySelector('span').textContent = location;

    document.getElementById('sidebar-detail-ratings').innerHTML = ratingsHtml;
    document.getElementById('mobile-detail-ratings').innerHTML = ratingsHtml;

    // Toggle views
    document.getElementById('sidebar-main-content').classList.add('hidden');
    document.getElementById('sidebar-detail-view').classList.remove('hidden');
    document.getElementById('mobile-detail-view').classList.remove('hidden');
    document.getElementById('map').classList.add('mobile-detail-open');
}

function hideDetailViews() {
    document.getElementById('sidebar-main-content').classList.remove('hidden');
    document.getElementById('sidebar-detail-view').classList.add('hidden');
    document.getElementById('mobile-detail-view').classList.add('hidden');
    document.getElementById('map').classList.remove('mobile-detail-open');
    if (map) map.closePopup();
}

function filterAndSort() {
    const countryFilter = document.getElementById('country-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const ratingMin = parseFloat(document.getElementById('rating-min').value);

    let filtered = restaurants;

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(r =>
            r.Name.toLowerCase().includes(searchTerm) ||
            r.Location.toLowerCase().includes(searchTerm)
        );
    }

    // Filter by minimum rating
    if (ratingMin > 0) {
        filtered = filtered.filter(r => {
            const rating = parseFloat(r.mScore);
            return rating >= ratingMin;
        });
    }
    // Filter by country
    if (countryFilter) {
        filtered = filtered.filter(r => r.Country === countryFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'rating-desc':
                return parseFloat(b.mScore) - parseFloat(a.mScore);
            case 'rating-asc':
                return parseFloat(a.mScore) - parseFloat(b.mScore);
            case 'date-desc':
                return parseDate(b.Date) - parseDate(a.Date);
            case 'date-asc':
                return parseDate(a.Date) - parseDate(b.Date);
            case 'price-desc':
                return parsePrice(b.Price) - parsePrice(a.Price);
            case 'price-asc':
                return parsePrice(a.Price) - parsePrice(b.Price);
            default:
                return 0;
        }
    });

    renderRestaurants(filtered);
    updateMapMarkers(filtered);
}

async function initMap() {
    map = L.map('map', {
        worldCopyJump: false,
        maxBounds: [[-60, -180], [85, 180]],
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.25,
        zoomDelta: 0.25
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 19,
        minZoom: 1,
        subdomains: 'abcd',
        noWrap: true
    }).addTo(map);

    // Create a layer group for markers
    markerLayer = L.layerGroup().addTo(map);
}

// Initialize
async function init() {
    restaurants = await loadCSV();
    await initMap();
    updateStats();
    filterAndSort();
}

init();

// Event listeners - Desktop
document.getElementById('search-input').addEventListener('input', filterAndSort);
document.getElementById('country-filter').addEventListener('change', filterAndSort);
document.getElementById('sort-by').addEventListener('change', filterAndSort);
document.getElementById('rating-min').addEventListener('input', () => {
    syncRatingDisplay('rating-min');
    filterAndSort();
});

// Event listeners - Mobile
document.getElementById('search-input-mobile').addEventListener('input', filterAndSort);
document.getElementById('country-filter-mobile').addEventListener('change', filterAndSort);
document.getElementById('sort-by-mobile').addEventListener('change', filterAndSort);

// Populate mobile country filter
function populateMobileCountryFilter() {
    const mobileSelect = document.getElementById('country-filter-mobile');
    const desktopSelect = document.getElementById('country-filter');
    mobileSelect.innerHTML = desktopSelect.innerHTML;
}

// Watch for desktop country filter updates and sync
const observer = new MutationObserver(populateMobileCountryFilter);
observer.observe(document.getElementById('country-filter'), { childList: true });

// Close detail views
document.getElementById('close-sidebar-detail').addEventListener('click', hideDetailViews);
document.getElementById('close-mobile-detail').addEventListener('click', hideDetailViews);
