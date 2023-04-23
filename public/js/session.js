import { initSocket } from "./modules/socket.js";
import { fetchRestaurants } from "./modules/fetch-restaurants.js";
import { setQueryParameters, generateRandomId } from "./modules/utils.js";
import { getCoordinates } from "./modules/geolocation.js";
const host = "localhost:3000";
const wsServerUrl = `ws://${host}`;
const proxyServerUrl = `http://${host}`;

const urlParams = new URLSearchParams(window.location.search);

const sessionId = urlParams.get("id") ?? generateRandomId();
const options = {
  radius: urlParams.get("radius") ?? "1000",
  price: urlParams.get("price") ?? "",
  openNow: urlParams.get("open_now") === "0",
};
let restaurants = [];
let restaurantsFetched = 0;

setQueryParameters({ id: sessionId });

const { latitude, longitude } = await getCoordinates();

// Connect to the WebSocket server
const socket = initSocket(wsServerUrl, proxyServerUrl);
const restaurantCard = document.querySelector("[data-restaurant-card]");
// Update the event listener for WebSocket messages

showRandomRestaurant(restaurantCard);

function getRestaurantAndUserId() {
  return {
    restaurantId: restaurantCard.dataset.restaurantId,
    // Generate a random user ID
    userId: generateRandomId(),
  };
}
// Function to display a random restaurant
async function showRandomRestaurant() {
  if (restaurants.length === 0) {
    restaurants = await await fetchRestaurants(
      proxyServerUrl,
      latitude,
      longitude,
      options,
      restaurantsFetched
    );
    restaurantsFetched += 20;
    if (restaurants.length === 0) {
      alert("No more restaurants to display.");
      return;
    }
  }

  const randomIndex = Math.floor(Math.random() * restaurants.length);
  const restaurant = restaurants[randomIndex];

  // Update the card with the new restaurant information
  restaurantCard.dataset.restaurantId = restaurant.id;
  restaurantCard.querySelector("[data-restaurant-name]").textContent =
    restaurant.name;
  restaurantCard.querySelector("[data-restaurant-address]").textContent =
    restaurant.location.address1;
  restaurantCard.querySelector(
    "[data-restaurant-cuisine]"
  ).textContent = `${restaurant.categories[0].title}`;

  // Set rating with Yelp stars
  const ratingStars = getYelpStars(restaurant.rating);
  restaurantCard.querySelector("[data-restaurant-rating]").innerHTML =
    ratingStars;

  // Set review count
  restaurantCard.querySelector(
    "[data-restaurant-review-count]"
  ).textContent = `(${restaurant.review_count} reviews)`;

  // Set price level
  restaurantCard.querySelector(
    "[data-restaurant-cuisine]"
  ).textContent += ` | Price: ${restaurant.price}`;

  restaurantCard.querySelector("[data-restaurant-image]").src =
    restaurant.image_url;

  // Remove the displayed restaurant from the list
  restaurants.splice(randomIndex, 1);
}
function getYelpStars(rating) {
  const imageName = rating.toString().replace(".5", "_half");
  return `<img src="images/stars/small_${imageName}.png" srcset="images/stars/small_${imageName}@2x.png 2x, images/stars/small_${imageName}@3x.png 3x" alt="${rating} Stars">`;
}

// Button click handler
function onVote(vote) {
  if (vote === "yes") {
    const { restaurantId, userId } = getRestaurantAndUserId();
    socket.send(
      JSON.stringify({ action: "vote", restaurantId, userId, sessionId })
    );
  }
  // Show a random restaurant after clicking "Yes" or "No"
  showRandomRestaurant();
}

interact(restaurantCard)
  .draggable({
    inertia: true,
    restrict: {
      restriction: "parent",
      endOnly: true,
    },
    onmove: dragMoveListener,
    onend: dragEndListener,
  })
  .styleCursor(false);

function dragMoveListener(event) {
  const target = event.target;
  const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
  const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

  target.style.transform = `translate(${x}px, ${y}px)`;

  target.setAttribute("data-x", x);
  target.setAttribute("data-y", y);
}

function dragEndListener(event) {
  const target = event.target;
  const x = parseFloat(target.getAttribute("data-x")) || 0;

  // Threshold for triggering a vote
  const voteThreshold = window.innerWidth * 0.1;

  if (x > voteThreshold) {
    // Vote "Yes" if the card was dragged to the right beyond the threshold
    onVote("yes");
  } else if (x < -voteThreshold) {
    // Vote "No" if the card was dragged to the left beyond the threshold
    onVote("no");
  }

  // Reset the card position
  target.style.transform = "translate(0px, 0px)";
  target.setAttribute("data-x", 0);
  target.setAttribute("data-y", 0);
}

// Attach event listeners to the "Yes" and "No" buttons
document
  .querySelector('[data-action="yes"]')
  .addEventListener("click", () => onVote("yes"));
document
  .querySelector('[data-action="no"]')
  .addEventListener("click", () => onVote("no"));
