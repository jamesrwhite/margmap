import L from 'leaflet';

// Make Leaflet available globally
window.L = L;

let restaurants = [];
let map;
let markers = {};
let markerLayer;
let userMarker;
let userSelectedRestaurant = false;
let selectedRestaurant = null;
let filteredRestaurants = [];
let visibleRestaurants = [];
let detailPhotoRequestToken = 0;

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

function setDetailPhotoState(shellId, containerId, attributionId, markup, attributionMarkup = '', state = 'empty') {
    const shell = document.getElementById(shellId);
    const container = document.getElementById(containerId);
    const attribution = document.getElementById(attributionId);

    shell.classList.toggle('hidden', state === 'empty');
    container.classList.toggle('is-empty', state === 'empty');
    container.classList.toggle('is-loading', state === 'loading');
    container.innerHTML = markup;

    attribution.innerHTML = attributionMarkup;
    attribution.classList.toggle('hidden', attributionMarkup === '');
}

function resetDetailPhotos(message = 'Photo unavailable') {
    const placeholderMarkup = `<div class="detail-photo-placeholder">${message}</div>`;
    setDetailPhotoState('sidebar-detail-photo-shell', 'sidebar-detail-photo', 'sidebar-detail-photo-attribution', placeholderMarkup, '', 'empty');
    setDetailPhotoState('mobile-detail-photo-shell', 'mobile-detail-photo', 'mobile-detail-photo-attribution', placeholderMarkup, '', 'empty');
}

function showDetailPhotoLoading() {
    const placeholderMarkup = '<div class="detail-photo-placeholder">Loading photo...</div>';
    setDetailPhotoState('sidebar-detail-photo-shell', 'sidebar-detail-photo', 'sidebar-detail-photo-attribution', placeholderMarkup, '', 'loading');
    setDetailPhotoState('mobile-detail-photo-shell', 'mobile-detail-photo', 'mobile-detail-photo-attribution', placeholderMarkup, '', 'loading');
}

function buildPhotoAttributionMarkup(authorAttributions = []) {
    if (authorAttributions.length === 0) {
        return '';
    }

    const links = authorAttributions.map((entry) => {
        const displayName = entry.displayName || 'Google Maps';
        if (entry.uri) {
            return `<a href="${entry.uri}" target="_blank" rel="noopener noreferrer">${displayName}</a>`;
        }

        return displayName;
    });

    return `Photo: ${links.join(', ')}`;
}

async function loadDetailPhoto(restaurant, requestToken) {
    if (!restaurant.googlePlaceId) {
        resetDetailPhotos();
        return;
    }

    showDetailPhotoLoading();

    try {
        const response = await fetch(`/api/place-photo/${encodeURIComponent(restaurant.googlePlaceId)}?w=1200&h=900`);
        if (requestToken !== detailPhotoRequestToken || selectedRestaurant !== restaurant) {
            return;
        }

        if (!response.ok) {
            resetDetailPhotos();
            return;
        }

        const payload = await response.json();
        if (!payload.imageUrl) {
            resetDetailPhotos();
            return;
        }

        const imageMarkup = `<img src="${payload.imageUrl}" alt="${restaurant.Name} on Google Maps">`;
        const attributionMarkup = buildPhotoAttributionMarkup(payload.authorAttributions);

        setDetailPhotoState('sidebar-detail-photo-shell', 'sidebar-detail-photo', 'sidebar-detail-photo-attribution', imageMarkup, attributionMarkup, 'photo');
        setDetailPhotoState('mobile-detail-photo-shell', 'mobile-detail-photo', 'mobile-detail-photo-attribution', imageMarkup, attributionMarkup, 'photo');
    } catch (error) {
        if (requestToken !== detailPhotoRequestToken) {
            return;
        }

        resetDetailPhotos();
    }
}

// Mobile menu toggle
function toggleMobileMenu(show) {
    document.getElementById('mobile-menu').classList.toggle('hidden', !show);
    document.getElementById('mobile-filters').classList.toggle('translate-x-full', !show);
}

document.getElementById('mobile-menu-toggle').addEventListener('click', () => toggleMobileMenu(true));
document.getElementById('close-mobile-menu').addEventListener('click', () => toggleMobileMenu(false));
document.getElementById('mobile-menu').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
        toggleMobileMenu(false);
    }
});

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
    ['header-search-input', 'search-input-mobile'],
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

function isMobileView() {
    return window.matchMedia('(max-width: 1023px)').matches;
}

function getRatingColor(rating) {
    const score = parseFloat(rating);
    if (score >= 8) return 'bg-red-100 text-red-800';
    if (score >= 7) return 'bg-orange-100 text-orange-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
}

function updateStats(restaurantsForStats = restaurants) {
    const count = restaurantsForStats.length;
    const countries = new Set(restaurantsForStats.map(r => r.Country));
    const totalRestaurants = restaurants.length;

    document.getElementById('total-count').textContent = count;
    document.getElementById('total-count-context').textContent = `of ${totalRestaurants} total spots`;
    document.getElementById('country-count').textContent = countries.size;
    document.getElementById('results-count').textContent = `${count} shown`;
    document.getElementById('results-count-mobile').textContent = `${count} shown`;

    if (count === 0) {
        document.getElementById('avg-rating').textContent = '—';
        document.getElementById('top-restaurant').textContent = 'No matches';
        return;
    }

    const avgRating = (restaurantsForStats.reduce((sum, r) => sum + parseFloat(r.mScore), 0) / count).toFixed(1);
    const topRestaurant = restaurantsForStats.reduce((top, r) =>
        parseFloat(r.mScore) > parseFloat(top.mScore) ? r : top
    );

    document.getElementById('avg-rating').textContent = avgRating;
    document.getElementById('top-restaurant').textContent = `${topRestaurant.Name} (${topRestaurant.mScore})`;

    // Populate country filter
    const countryFilter = document.getElementById('country-filter');
    const currentValue = countryFilter.value;
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    Array.from(new Set(restaurants.map(r => r.Country))).sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
    countryFilter.value = currentValue;
}

function renderRestaurants(restaurantsToRender) {
    const list = document.getElementById('restaurants-list');
    const mobileList = document.getElementById('restaurants-list-mobile');
    list.innerHTML = '';
    mobileList.innerHTML = '';

    if (restaurantsToRender.length === 0) {
        const isFilterEmptyState = filteredRestaurants.length === 0;
        const emptyStateMarkup = `
            <div class="empty-state">
                <p class="empty-state-title">${isFilterEmptyState ? 'No restaurants match these filters.' : 'No restaurants are visible in this map view.'}</p>
                <p class="empty-state-copy">${isFilterEmptyState ? 'Try a lower minimum score, a broader search, or reset the filters.' : 'Pan or zoom the map to bring restaurants back into view.'}</p>
                ${isFilterEmptyState ? '<button type="button" class="empty-state-button" data-clear-filters>Clear Filters</button>' : ''}
            </div>
        `;
        list.innerHTML = emptyStateMarkup;
        mobileList.innerHTML = emptyStateMarkup;
        if (isFilterEmptyState) {
            list.querySelector('[data-clear-filters]').addEventListener('click', clearFilters);
            mobileList.querySelector('[data-clear-filters]').addEventListener('click', clearFilters);
        }
        return;
    }

    restaurantsToRender.forEach(restaurant => {
        const createListItem = () => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'restaurant-list-item w-full p-3 hover:bg-gray-50 cursor-pointer transition text-left';
            button.onclick = () => {
                focusOnRestaurant(restaurant);
                toggleMobileMenu(false);
            };

            button.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <div class="font-medium text-gray-900 text-sm">${restaurant.Name}</div>
                    <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${getRatingColor(restaurant.mScore)}">
                        ${restaurant.mScore}
                    </span>
                </div>
                <div class="text-xs text-gray-600">${restaurant.Location}, ${restaurant.Country}</div>
                <div class="text-xs text-gray-500 mt-1">${restaurant.Date} • ${restaurant.Price}</div>
            `;
            return button;
        };

        list.appendChild(createListItem());
        mobileList.appendChild(createListItem());
    });
}

function getViewportRestaurants(restaurantsToCheck = filteredRestaurants) {
    if (!map || restaurantsToCheck.length === 0) {
        return restaurantsToCheck;
    }

    const bounds = map.getBounds();
    return restaurantsToCheck.filter((restaurant) => {
        const lat = parseFloat(restaurant.Lat);
        const lon = parseFloat(restaurant.Lon);

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return false;
        }

        return bounds.contains([lat, lon]);
    });
}

function syncViewportRestaurants() {
    visibleRestaurants = getViewportRestaurants(filteredRestaurants);

    if (selectedRestaurant && !visibleRestaurants.some((restaurant) => restaurant.Name === selectedRestaurant.Name && restaurant.Lat === selectedRestaurant.Lat && restaurant.Lon === selectedRestaurant.Lon)) {
        hideDetailViews();
    }

    updateStats(visibleRestaurants);
    renderRestaurants(visibleRestaurants);
}

function focusOnRestaurant(restaurant) {
    const lat = parseFloat(restaurant.Lat);
    const lon = parseFloat(restaurant.Lon);

    if (lat && lon && map) {
        // Set flag to prevent auto-recentering
        userSelectedRestaurant = true;
        selectedRestaurant = restaurant;

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

            if (isMobileView()) {
                showDetailInSidebar(restaurant);
                return;
            }

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

            marker.on('click', () => {
                selectedRestaurant = restaurant;
                userSelectedRestaurant = true;
                if (isMobileView()) {
                    map.closePopup();
                    showDetailInSidebar(restaurant);
                }
            });

            // Open detail view when popup is opened on desktop
            if (!isMobileView()) {
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

                marker.on('popupopen', () => {
                    showDetailInSidebar(restaurant);
                });
            }

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
    selectedRestaurant = restaurant;
    detailPhotoRequestToken += 1;
    loadDetailPhoto(restaurant, detailPhotoRequestToken);
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
    selectedRestaurant = null;
    detailPhotoRequestToken += 1;
    resetDetailPhotos();
    if (map) map.closePopup();
}

function clearFilters() {
    const defaults = {
        search: '',
        country: '',
        sortBy: 'rating-desc',
        ratingMin: '0'
    };

    document.getElementById('header-search-input').value = defaults.search;
    document.getElementById('search-input-mobile').value = defaults.search;
    document.getElementById('country-filter').value = defaults.country;
    document.getElementById('country-filter-mobile').value = defaults.country;
    document.getElementById('sort-by').value = defaults.sortBy;
    document.getElementById('sort-by-mobile').value = defaults.sortBy;
    document.getElementById('rating-min').value = defaults.ratingMin;
    document.getElementById('rating-min-mobile').value = defaults.ratingMin;
    syncRatingDisplay('rating-min');
    filterAndSort();
}

function updateClearFilterButtons() {
    const searchTerm = document.getElementById('header-search-input').value.trim();
    const countryFilter = document.getElementById('country-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    const ratingMin = document.getElementById('rating-min').value;

    const hasActiveFilters = searchTerm !== ''
        || countryFilter !== ''
        || sortBy !== 'rating-desc'
        || ratingMin !== '0';

    document.getElementById('clear-filters').classList.toggle('hidden', !hasActiveFilters);
    document.getElementById('clear-filters-mobile').classList.toggle('hidden', !hasActiveFilters);
}

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function getDistanceKm(fromLat, fromLon, toLat, toLon) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(toLat - fromLat);
    const dLon = toRadians(toLon - fromLon);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLon / 2) ** 2;
    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function setLocationStatus(message) {
    document.getElementById('location-status-mobile').textContent = message;
}

function showUserLocation(lat, lon) {
    if (!map) return;

    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.circleMarker([lat, lon], {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: '#2563eb',
            fillOpacity: 1
        }).addTo(map);
    }
}

function locateUser() {
    if (!navigator.geolocation) {
        setLocationStatus('Geolocation is not available in this browser.');
        return;
    }

    setLocationStatus('Finding your location...');

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        showUserLocation(latitude, longitude);
        map.setView([latitude, longitude], 11, {
            animate: true,
            duration: 0.5
        });

        const candidates = filteredRestaurants.length > 0 ? filteredRestaurants : restaurants;
        let nearestRestaurant = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        candidates.forEach((restaurant) => {
            const lat = parseFloat(restaurant.Lat);
            const lon = parseFloat(restaurant.Lon);
            if (Number.isNaN(lat) || Number.isNaN(lon)) return;

            const distance = getDistanceKm(latitude, longitude, lat, lon);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestRestaurant = restaurant;
            }
        });

        if (nearestRestaurant) {
            const miles = nearestDistance * 0.621371;
            setLocationStatus(`Nearest visible spot: ${nearestRestaurant.Name} (${miles.toFixed(1)} mi)`);
        } else {
            setLocationStatus('Location found, but no restaurants are available in the current view.');
        }
    }, () => {
        setLocationStatus('Location access was denied. Check browser permissions and try again.');
    }, {
        enableHighAccuracy: true,
        timeout: 10000
    });
}

function filterAndSort() {
    const countryFilter = document.getElementById('country-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    const headerSearch = document.getElementById('header-search-input').value.toLowerCase().trim();
    const mobileSearch = document.getElementById('search-input-mobile').value.toLowerCase().trim();
    const searchTerm = headerSearch || mobileSearch;
    const ratingMin = parseFloat(document.getElementById('rating-min').value);

    updateClearFilterButtons();

    let filtered = restaurants;
    userSelectedRestaurant = false;

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(r =>
            r.Name.toLowerCase().includes(searchTerm) ||
            r.Location.toLowerCase().includes(searchTerm) ||
            r.Country.toLowerCase().includes(searchTerm)
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

    filteredRestaurants = filtered;
    if (selectedRestaurant && !filtered.some((restaurant) => restaurant.Name === selectedRestaurant.Name && restaurant.Lat === selectedRestaurant.Lat && restaurant.Lon === selectedRestaurant.Lon)) {
        hideDetailViews();
    }

    updateMapMarkers(filteredRestaurants);
    syncViewportRestaurants();
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        maxZoom: 20,
        minZoom: 1,
        subdomains: 'abcd',
        noWrap: true
    }).addTo(map);

    // Create a layer group for markers
    markerLayer = L.layerGroup().addTo(map);

    map.on('moveend', () => {
        syncViewportRestaurants();
    });
}

// Initialize
async function init() {
    restaurants = await loadCSV();
    await initMap();
    filterAndSort();
}

init();

// Event listeners - Desktop
document.getElementById('header-search-input').addEventListener('input', filterAndSort);
document.getElementById('header-locate-me').addEventListener('click', locateUser);
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
document.getElementById('rating-min-mobile').addEventListener('input', () => {
    syncRatingDisplay('rating-min-mobile');
    filterAndSort();
});
document.getElementById('clear-filters').addEventListener('click', clearFilters);
document.getElementById('clear-filters-mobile').addEventListener('click', clearFilters);
document.getElementById('locate-me-mobile').addEventListener('click', locateUser);

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
