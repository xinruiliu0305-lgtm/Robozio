const TOKEN_KEY = "robotzio_auth_token";
const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

const initAdmin = () => {
  const root = document.querySelector("[data-page='admin-console']");
  if (!root) return;

  const statusNode = document.getElementById("admin-status");
  const statsNode = document.getElementById("admin-stats");
  const merchantsNode = document.getElementById("admin-merchants");
  const usersNode = document.getElementById("admin-users");
  const listingsNode = document.getElementById("admin-listings");
  const paymentsNode = document.getElementById("admin-payments");
  const mediaNode = document.getElementById("admin-media");
  const buyerOrdersNode = document.getElementById("admin-buyer-orders");

  const token = getToken();
  if (!token) {
    statusNode.textContent = "Please login with an admin account first.";
    return;
  }

  const renderMerchants = (items) => {
    merchantsNode.innerHTML = items
      .map(
        (item) => `
          <article class="card pad admin-item">
            <div>
              <strong>${item.company_name}</strong>
              <p class="meta">${item.email}</p>
              <p class="meta">Status: ${item.onboarding_status}</p>
            </div>
            <div class="btn-row">
              <button class="btn btn-alt" data-merchant-id="${item.id}" data-status="active">Set Active</button>
              <button class="btn btn-alt" data-merchant-id="${item.id}" data-status="suspended">Suspend</button>
            </div>
          </article>
        `
      )
      .join("");
  };

  const renderUsers = (items) => {
    usersNode.innerHTML = items
      .map(
        (item) => `
          <article class="card pad admin-item">
            <strong>${item.full_name}</strong>
            <p class="meta">${item.email}</p>
            <p class="meta">Role: ${item.role}</p>
          </article>
        `
      )
      .join("");
  };

  const renderListings = (items) => {
    listingsNode.innerHTML = items
      .map(
        (item) => `
          <article class="card pad admin-item">
            <strong>${item.title}</strong>
            <p class="meta">${item.listing_type} | ${item.category}</p>
            <p class="meta">${item.company_name}</p>
          </article>
        `
      )
      .join("");
  };

  const renderPayments = (items) => {
    paymentsNode.innerHTML = items
      .map(
        (item) => `
          <article class="card pad admin-item">
            <strong>${item.company_name}</strong>
            <p class="meta">${item.payment_type} | ${item.payment_status}</p>
            <p class="meta">${item.currency.toUpperCase()} ${(item.amount_minor / 100).toLocaleString()}</p>
          </article>
        `
      )
      .join("");
  };

  const renderMedia = (items) => {
    mediaNode.innerHTML = items
      .map(
        (item) => `
          <article class="card pad admin-media-item">
            <img src="${item.url}" alt="${item.listingTitle}" />
            <strong>${item.listingTitle}</strong>
            <p class="meta">${item.companyName}</p>
            <button class="btn btn-alt" data-media-delete="true" data-listing-id="${item.listingId}" data-url="${item.url}">Delete Image</button>
          </article>
        `
      )
      .join("");
  };

  const renderBuyerOrders = (items) => {
    buyerOrdersNode.innerHTML = items
      .map(
        (item) => `
          <article class="card pad admin-item">
            <div>
              <strong>Order #${item.id}</strong>
              <p class="meta">${item.email}</p>
              <p class="meta">Status: ${item.status} | Preference: ${item.preference}</p>
            </div>
            <div class="btn-row">
              <button class="btn btn-alt" data-order-id="${item.id}" data-order-status="processing">processing</button>
              <button class="btn btn-alt" data-order-id="${item.id}" data-order-status="quoted">quoted</button>
              <button class="btn btn-alt" data-order-id="${item.id}" data-order-status="closed">closed</button>
            </div>
          </article>
        `
      )
      .join("");
  };

  const loadMedia = async () => {
    const response = await fetch("/api/media/admin-list", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;
    const payload = await response.json();
    renderMedia(payload.media || []);
  };

  const loadOverview = async () => {
    const response = await fetch("/api/admin/overview", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      statusNode.textContent = "Access denied or failed to load admin data.";
      return;
    }
    const payload = await response.json();
    statusNode.textContent = "Admin access granted.";
    statsNode.innerHTML = `
      <article class="card pad"><h3>${payload.stats.users}</h3><p class="meta">Users</p></article>
      <article class="card pad"><h3>${payload.stats.merchants}</h3><p class="meta">Merchants</p></article>
      <article class="card pad"><h3>${payload.stats.listings}</h3><p class="meta">Listings</p></article>
      <article class="card pad"><h3>${payload.stats.payments}</h3><p class="meta">Payments</p></article>
      <article class="card pad"><h3>${payload.stats.buyerOrders || 0}</h3><p class="meta">Buyer Orders</p></article>
    `;
    renderMerchants(payload.merchants || []);
    renderUsers(payload.users || []);
    renderListings(payload.listings || []);
    renderPayments(payload.payments || []);
    renderBuyerOrders(payload.buyerOrders || []);
    loadMedia();
  };

  merchantsNode.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-merchant-id]");
    if (!button) return;
    const merchantId = Number(button.getAttribute("data-merchant-id"));
    const onboardingStatus = button.getAttribute("data-status");
    const response = await fetch("/api/admin/merchant-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ merchantId, onboardingStatus })
    });
    if (!response.ok) {
      statusNode.textContent = "Failed to update merchant status.";
      return;
    }
    statusNode.textContent = "Merchant status updated.";
    loadOverview();
  });

  mediaNode.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-media-delete]");
    if (!button) return;
    const listingId = Number(button.getAttribute("data-listing-id"));
    const url = button.getAttribute("data-url");
    const response = await fetch("/api/media/admin-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ listingId, url })
    });
    if (!response.ok) {
      statusNode.textContent = "Failed to delete image.";
      return;
    }
    statusNode.textContent = "Image deleted.";
    loadMedia();
  });

  buyerOrdersNode.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-order-id]");
    if (!button) return;
    const orderId = Number(button.getAttribute("data-order-id"));
    const status = button.getAttribute("data-order-status");
    const response = await fetch("/api/admin/buyer-order-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, status })
    });
    if (!response.ok) {
      statusNode.textContent = "Failed to update buyer order status.";
      return;
    }
    statusNode.textContent = "Buyer order status updated.";
    loadOverview();
  });

  loadOverview();
};

initAdmin();
