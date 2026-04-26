const TOKEN_KEY = "robotzio_auth_token";
const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

const initCart = () => {
  const root = document.querySelector("[data-page='buyer-cart']");
  if (!root) return;

  const listNode = document.getElementById("buyer-cart-items");
  const statusNode = document.getElementById("buyer-cart-status");
  const selectedNode = document.getElementById("cart-selected-products");
  const clearBtn = document.getElementById("clear-cart-btn");

  const token = getToken();
  if (!token) {
    if (statusNode) statusNode.textContent = "Please login as buyer to manage cart.";
    return;
  }

  const render = (items) => {
    if (!listNode) return;
    if (!items.length) {
      listNode.innerHTML = `<p class="meta">No products in cart yet.</p>`;
      if (selectedNode) selectedNode.textContent = "Selected products: 0";
      return;
    }
    listNode.innerHTML = items
      .map(
        (item) => `<div class="line-item">
          <div class="mini-thumb placeholder-media">Image</div>
          <div>
            <strong>${item.productName}</strong>
            <p class="meta">Requested Qty: ${item.qty} | Supplier: ${item.supplier}</p>
          </div>
          <div class="price">${item.unitPriceText}</div>
          <button class="btn btn-alt" data-delete-cart="${item.id}">Remove</button>
        </div>`
      )
      .join("");
    if (selectedNode) selectedNode.textContent = `Selected products: ${items.length}`;
  };

  const loadCart = async () => {
    const response = await fetch("/api/buyer/cart", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      if (statusNode) statusNode.textContent = "Failed to load cart. Buyer login required.";
      return;
    }
    const payload = await response.json();
    render(payload.items || []);
    if (statusNode) statusNode.textContent = "Cart synced.";
  };

  listNode?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-cart]");
    if (!button) return;
    const itemId = Number(button.getAttribute("data-delete-cart"));
    await fetch("/api/buyer/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ itemId })
    });
    loadCart();
  });

  clearBtn?.addEventListener("click", async () => {
    await fetch("/api/buyer/cart", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadCart();
  });

  loadCart();
};

initCart();
