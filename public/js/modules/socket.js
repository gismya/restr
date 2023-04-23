import { fetchRestaurantDetails } from "./fetch-restaurants.js";
export function initSocket(serverUrl, proxyServerUrl) {
  const socket = new WebSocket(serverUrl);

  socket.addEventListener("open", (event) => {
    console.log("Connected to WebSocket server:", event);
  });

  socket.addEventListener("close", (event) => {
    console.log("Disconnected from WebSocket server:", event);
  });

  socket.addEventListener("error", (event) => {
    console.error("WebSocket error:", event);
  });
  socket.addEventListener("message", async (event) => {
    const { action, restaurantId } = JSON.parse(event.data);

    if (action === "match") {
      const restaurant = await fetchRestaurantDetails(
        proxyServerUrl,
        restaurantId
      );
      if (restaurant) {
        const modal = document.querySelector("[data-match-modal]");
        const infoContainer = modal.querySelector(
          "[data-match-restaurant-info]"
        );

        // Display the restaurant information in the modal
        infoContainer.innerHTML = `
              <h3 class="text-xl mb-2">${restaurant.name}</h3>
              <p>${restaurant.location.address1}</p>
              <p>${restaurant.location.city}, ${restaurant.location.state} ${restaurant.location.zip_code}</p>
              <p>Cuisine: ${restaurant.categories[0].title}</p>
              <p>Rating: ${restaurant.rating}/5</p>
            `;

        // Show the modal
        modal.classList.remove("hidden");
      } else {
        alert(`Match found for restaurant ID: ${restaurantId}`);
      }
    }
  });
  return socket;
}
