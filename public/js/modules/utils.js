export function setQueryParameters(parameters) {
  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }

  window.history.replaceState({}, "", url.toString());
}
export function generateRandomId() {
  return Math.random().toString(36).slice(2, 11);
}
