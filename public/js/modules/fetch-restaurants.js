export async function fetchRestaurants(
  proxyServerUrl,
  latitude,
  longitude,
  options,
  offset = 0
) {
  const { radius, price, openNow } = options;
  try {
    const response = await fetch(
      `${proxyServerUrl}/restaurants?latitude=${latitude}&longitude=${longitude}&radius=${radius}&price=${price}&open_now=${openNow}&offset=${offset}`
    );
    const data = await response.json();
    return data.businesses;
  } catch (error) {
    console.error("Error fetching Yelp data:", error);
    return [];
  }
}

export async function fetchRestaurantDetails(proxyServerUrl, restaurantId) {
  try {
    const response = await fetch(
      `${proxyServerUrl}/restaurant-details?id=${restaurantId}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Yelp data:", error);
    return null;
  }
}
