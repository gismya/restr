function submitOptions() {
  const radius = document.querySelector('[data-variable="radius"]').value;
  const priceInputs = document.querySelectorAll(
    '[data-variable="price"]:checked'
  );
  const openNow = document.querySelector('[data-variable="open-now"]').checked;

  const price = Array.from(priceInputs, (input) => input.value);

  const queryParams = new URLSearchParams();
  queryParams.set("radius", radius);
  queryParams.set("price", price.join(","));
  queryParams.set("open_now", openNow ? true : false);

  window.location.href = `/session?${queryParams.toString()}`;
}

document
  .querySelector("[data-radius-slider]")
  .addEventListener("input", (e) => {
    document.querySelector(
      "[data-radius-value]"
    ).textContent = `${e.target.value} meters`;
  });
document
  .querySelector("[data-submit-button]")
  .addEventListener("click", submitOptions);
