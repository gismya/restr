import { setQueryParameters } from "./utils.js";
export async function getCoordinates() {
  const urlParams = new URLSearchParams(window.location.search);
  const latitude = urlParams.get("latitude");
  const longitude = urlParams.get("longitude");

  if (latitude && longitude) {
    return { latitude, longitude };
  } else {
    return updateCoordinatesInURL();
  }
}
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}
async function updateCoordinatesInURL() {
  try {
    const { latitude, longitude } = await getUserLocation();
    setQueryParameters({
      latitude: latitude,
      longitude: longitude,
    });
    return { latitude, longitude };
  } catch (error) {
    console.error("Error getting user location:", error);
    // fallback coordinates, Stockholm
    const defaultLatitude = "59.3293";
    const defaultLongitude = "18.0686";
    setQueryParameters({
      latitude: defaultLatitude,
      longitude: defaultLongitude,
    });
    return { latitude: defaultLatitude, longitude: defaultLongitude };
  }
}
