const TOKEN_KEY = "robotzio_auth_token";
const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

const initCheckout = () => {
  const root = document.querySelector("[data-page='buyer-checkout']");
  if (!root) return;

  const token = getToken();
  const statusNode = document.getElementById("checkout-status");
  const productsNode = document.getElementById("checkout-products");
  const suppliersNode = document.getElementById("checkout-suppliers");
  const submitBtn = document.getElementById("submit-order-btn");

  if (!token) {
    if (statusNode) statusNode.textContent = "Please login as buyer first.";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  let cartItems = [];

  const loadCart = async () => {
    const response = await fetch("/api/buyer/cart", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      if (statusNode) statusNode.textContent = "Unable to load cart.";
      return;
    }
    const payload = await response.json();
    cartItems = payload.items || [];
    const supplierCount = new Set(cartItems.map((item) => item.supplier)).size;
    if (productsNode) productsNode.textContent = `Requested products: ${cartItems.length}`;
    if (suppliersNode) suppliersNode.textContent = `Suppliers involved: ${supplierCount} merchants`;
    if (!cartItems.length && statusNode) statusNode.textContent = "Cart is empty.";
  };

  submitBtn?.addEventListener("click", async () => {
    if (!cartItems.length) {
      if (statusNode) statusNode.textContent = "Please add products to cart before submitting.";
      return;
    }
    const preference = document.querySelector("input[name='pay']:checked")?.value || "purchase";
    const budget = document.getElementById("checkout-budget")?.value || "";
    const timeline = document.getElementById("checkout-timeline")?.value || "";
    const contactTime = document.getElementById("checkout-contact-time")?.value || "";
    const response = await fetch("/api/buyer/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ preference, budget, timeline, contactTime })
    });
    if (!response.ok) {
      if (statusNode) statusNode.textContent = "Failed to submit order.";
      return;
    }
    const payload = await response.json();
    window.location.href = `thank-you.html?orderId=${payload.orderId}`;
  });

  loadCart();
};

initCheckout();
