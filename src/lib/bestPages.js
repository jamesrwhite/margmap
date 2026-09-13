export const MIN_RATINGS = 3;

export function getQualifyingPlaces(restaurants) {
    const locationCounts = new Map();
    const countryCounts = new Map();

    for (const restaurant of restaurants) {
        locationCounts.set(restaurant.Location, (locationCounts.get(restaurant.Location) || 0) + 1);
        countryCounts.set(restaurant.Country, (countryCounts.get(restaurant.Country) || 0) + 1);
    }

    const locations = new Set(
        Array.from(locationCounts.entries())
            .filter(([, count]) => count >= MIN_RATINGS)
            .map(([location]) => location)
    );
    const countries = new Set(
        Array.from(countryCounts.entries())
            .filter(([, count]) => count >= MIN_RATINGS)
            .map(([country]) => country)
    );

    return { locations, countries };
}
