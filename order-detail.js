const TOKEN_KEY = "robotzio_auth_token";
const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

const getErrorMessage = async (response, fallback) => {
  try {
    const payload = await response.json();
    return payload?.details || payload?.error || fallback;
  } catch (_error) {
    return fallback;
  }
};

const initOrderDetail = () => {
  const root = document.querySelector("[data-page='buyer-order-detail']");
  if (!root) return;

  const statusNode = document.getElementById("order-detail-status");
  const summaryNode = document.getElementById("order-summary");
  const itemsNode = document.getElementById("order-items");
  const cancelBtn = document.getElementById("order-cancel-btn");

  const params = new URLSearchParams(window.location.search);
  const orderId = Number(params.get("orderId") || 0);
  const token = getToken();
  if (!token || !orderId) {
    statusNode.textContent = "Invalid order detail request. Please login and retry.";
    if (cancelBtn) cancelBtn.disabled = true;
    return;
  }

  const load = async () => {
    const response = await fetch(`/api/buyer/orders?orderId=${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      statusNode.textContent = await getErrorMessage(response, "Failed to load order");
      if (cancelBtn) cancelBtn.disabled = true;
      return;
    }
    const payload = await response.json();
    const order = payload.order;
    const items = payload.items || [];
    statusNode.textContent = `Order #${order.id} loaded.`;
    summaryNode.innerHTML = `
      <p class="meta">Status: <span class="badge">${order.status}</span></p>
      <p class="meta">Preference: ${order.preference}</p>
      <p class="meta">Budget: ${order.budget || "-"}</p>
      <p class="meta">Timeline: ${order.timeline || "-"}</p>
      <p class="meta">Contact Time: ${order.contactTime || "-"}</p>
      <p class="meta">Created: ${new Date(order.createdAt).toLocaleString()}</p>
    `;
    itemsNode.innerHTML = items.length
      ? items
          .map(
            (item) => `<article class="card pad merchant-listing-item">
              <div>
                <strong>${item.productName}</strong>
                <p class="meta">Supplier: ${item.supplier}</p>
                <p class="meta">Qty: ${item.qty}</p>
              </div>
              <span class="price">${item.unitPriceText}</span>
            </article>`
          )
          .join("")
      : `<p class="meta">No items found for this order.</p>`;

    if (cancelBtn) cancelBtn.disabled = order.status === "closed";
  };

  cancelBtn?.addEventListener("click", async () => {
    const response = await fetch("/api/buyer/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, action: "cancel" })
    });
    if (!response.ok) {
      statusNode.textContent = await getErrorMessage(response, "Failed to cancel order");
      return;
    }
    statusNode.textContent = `Order #${orderId} cancelled (closed).`;
    load();
  });

  load();
};

initOrderDetail();
