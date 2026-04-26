const TOKEN_KEY = "robotzio_auth_token";

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const getErrorMessage = async (response, fallback) => {
  try {
    const payload = await response.json();
    return payload?.details || payload?.error || fallback;
  } catch (_error) {
    return fallback;
  }
};

const initAccountAuth = () => {
  const root = document.querySelector("[data-page='account-auth']");
  if (!root) return;

  const loginPanel = document.getElementById("login-panel");
  const merchantDashboard = document.getElementById("merchant-dashboard");
  const buyerDashboard = document.getElementById("buyer-dashboard");
  const loginForm = document.getElementById("login-form");
  const loginStatusNode = document.getElementById("login-status");
  const accountListingForm = document.getElementById("account-listing-form");
  const accountListingsNode = document.getElementById("account-listings");
  const companyReadonlyNode = document.getElementById("company-readonly");
  const logoutBtn = document.getElementById("logout-btn");
  const buyerLogoutBtn = document.getElementById("buyer-logout-btn");
  const statusNode = document.getElementById("account-status");
  const buyerStatusNode = document.getElementById("buyer-status");
  const buyerStatsNode = buyerDashboard?.querySelector(".stats");
  const buyerOrdersNode = document.getElementById("buyer-orders");
  const summaryNode = document.getElementById("account-summary");
  let merchantId = null;
  let canManageListings = false;

  const renderListings = (listings) => {
    if (!accountListingsNode) return;
    if (!Array.isArray(listings) || listings.length === 0) {
      accountListingsNode.innerHTML = `<p class="meta">No listings yet.</p>`;
      return;
    }
    accountListingsNode.innerHTML = listings
      .map(
        (item) => `<article class="card pad merchant-listing-item">
          <div>
            <strong>${item.title}</strong>
            <p class="meta">${item.type} | ${item.category}</p>
            <p class="meta">${item.summary}</p>
          </div>
          <button class="btn btn-alt" data-delete-listing="${item.id}">Remove</button>
        </article>`
      )
      .join("");
  };

  const renderSummary = (data) => {
    if (!summaryNode) return;
    const userId = data?.user?.id ?? "-";
    const merchantStatus = data?.merchant?.onboardingStatus ?? "No merchant profile";
    const listings = data?.merchant?.listingCount ?? 0;
    summaryNode.innerHTML = `
      <article class="card pad"><h3>${userId}</h3><p class="meta">User ID</p></article>
      <article class="card pad"><h3>${merchantStatus}</h3><p class="meta">Merchant Status</p></article>
      <article class="card pad"><h3>${listings}</h3><p class="meta">Listings</p></article>
    `;
  };

  const renderBuyerOrders = (orders) => {
    if (!buyerOrdersNode) return;
    if (!Array.isArray(orders) || !orders.length) {
      buyerOrdersNode.innerHTML = `<p class="meta">No orders yet.</p>`;
      return;
    }
    buyerOrdersNode.innerHTML = orders
      .map(
        (order) => `<article class="card pad merchant-listing-item">
          <div>
            <strong>Order #${order.id}</strong>
            <p class="meta">Status: ${order.status}</p>
            <p class="meta">Preference: ${order.preference}</p>
          </div>
          <div class="btn-row">
            <a class="btn btn-alt" href="order-detail.html?orderId=${order.id}">Details</a>
            ${
              order.status !== "closed"
                ? `<button class="btn btn-alt" data-cancel-order="${order.id}">Cancel</button>`
                : `<span class="badge">Closed</span>`
            }
          </div>
        </article>`
      )
      .join("");
  };

  const loadMe = async () => {
    const token = getToken();
    if (!token) {
      if (statusNode) statusNode.textContent = "Not logged in.";
      if (loginStatusNode) loginStatusNode.textContent = "Please sign in with your account.";
      if (loginPanel) loginPanel.style.display = "block";
      if (merchantDashboard) merchantDashboard.style.display = "none";
      if (buyerDashboard) buyerDashboard.style.display = "none";
      renderSummary(null);
      return;
    }
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      clearToken();
      if (statusNode) statusNode.textContent = "Session expired. Please login again.";
      if (loginStatusNode) loginStatusNode.textContent = "Session expired. Please login again.";
      if (loginPanel) loginPanel.style.display = "block";
      if (merchantDashboard) merchantDashboard.style.display = "none";
      if (buyerDashboard) buyerDashboard.style.display = "none";
      renderSummary(null);
      return;
    }
    const payload = await response.json();
    const role = payload?.user?.role || "buyer";
    if (loginPanel) loginPanel.style.display = "none";
    if (merchantDashboard) merchantDashboard.style.display = role === "merchant" || role === "admin" ? "block" : "none";
    if (buyerDashboard) buyerDashboard.style.display = role === "buyer" ? "block" : "none";
    if (statusNode) statusNode.textContent = `Logged in as ${payload.user?.email || ""}`;
    if (buyerStatusNode) buyerStatusNode.textContent = `Logged in as buyer: ${payload.user?.email || ""}`;
    if (buyerStatsNode && role === "buyer") {
      const cartCount = payload?.buyer?.cartCount || 0;
      const orderCount = payload?.buyer?.orderCount || 0;
      buyerStatsNode.innerHTML = `
        <article class="card pad"><h3>${orderCount}</h3><p class="meta">Orders</p></article>
        <article class="card pad"><h3>${orderCount}</h3><p class="meta">Open Quotes</p></article>
        <article class="card pad"><h3>${cartCount}</h3><p class="meta">Cart Items</p></article>
      `;
    }
    renderSummary(payload);
    if (role === "buyer") {
      merchantId = null;
      canManageListings = false;
      renderListings([]);
      const ordersResponse = await fetch("/api/buyer/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ordersResponse.ok) {
        const ordersPayload = await ordersResponse.json();
        renderBuyerOrders(ordersPayload.orders || []);
      } else {
        renderBuyerOrders([]);
      }
      return;
    }
    merchantId = payload?.merchant?.id || null;
    canManageListings = Boolean(merchantId);
    if (accountListingForm) {
      Array.from(accountListingForm.querySelectorAll("input, select, textarea, button"))
        .forEach((el) => {
          el.disabled = !canManageListings;
        });
    }
    if (companyReadonlyNode) {
      if (payload?.merchant) {
        companyReadonlyNode.innerHTML = `
          Company: ${payload.merchant.companyName}<br />
          Contact: ${payload.merchant.contactName || "-"}<br />
          Email: ${payload.merchant.email || "-"}<br />
          Phone: ${payload.merchant.phone || "-"}<br />
          Country: ${payload.merchant.country || "-"}<br />
          Company Type: ${payload.merchant.companyType || "-"}
        `;
      } else {
        companyReadonlyNode.textContent = "No company profile submitted yet. Please complete it in Merchant Portal.";
      }
    }
    if (merchantId) {
      const token = getToken();
      const secureListingResponse = await fetch(`/api/merchant/listings?merchantId=${merchantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (secureListingResponse.ok) {
        const listingPayload = await secureListingResponse.json();
        renderListings(listingPayload.listings || []);
      } else {
        renderListings([]);
      }
    } else {
      renderListings([]);
    }
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = loginForm.querySelector("button[type='submit']");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing In...";
      }
      if (loginStatusNode) loginStatusNode.textContent = "Signing in...";
      try {
        const data = new FormData(loginForm);
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(data.get("email") || "").trim(),
            password: String(data.get("password") || "")
          })
        });
        if (!response.ok) {
          const message = await getErrorMessage(response, "Login failed");
          if (loginStatusNode) loginStatusNode.textContent = message;
          return;
        }
        const payload = await response.json();
        setToken(payload.token);
        if (statusNode) statusNode.textContent = `Login successful. Welcome ${payload.user?.fullName || ""}.`;
        if (loginStatusNode) loginStatusNode.textContent = "Login successful.";
        loginForm.reset();
        await loadMe();
      } catch (_error) {
        if (loginStatusNode) {
          loginStatusNode.textContent = "Login service unavailable. If you are on Netlify static hosting, backend /api may not be connected.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Sign In";
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const token = getToken();
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      clearToken();
      if (statusNode) statusNode.textContent = "Logged out.";
      if (loginPanel) loginPanel.style.display = "block";
      if (merchantDashboard) merchantDashboard.style.display = "none";
      if (buyerDashboard) buyerDashboard.style.display = "none";
      renderSummary(null);
      renderListings([]);
      renderBuyerOrders([]);
    });
  }

  if (buyerLogoutBtn) {
    buyerLogoutBtn.addEventListener("click", async () => {
      const token = getToken();
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      clearToken();
      if (loginPanel) loginPanel.style.display = "block";
      if (merchantDashboard) merchantDashboard.style.display = "none";
      if (buyerDashboard) buyerDashboard.style.display = "none";
      renderBuyerOrders([]);
    });
  }

  if (accountListingForm) {
    accountListingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!canManageListings || !merchantId) {
        if (statusNode) statusNode.textContent = "Please submit company profile first in Merchant Portal.";
        return;
      }
      const data = new FormData(accountListingForm);
      const response = await fetch("/api/merchant/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          merchantId,
          listingType: String(data.get("listingType") || "Product"),
          title: String(data.get("title") || "").trim(),
          category: String(data.get("category") || "").trim(),
          summary: String(data.get("summary") || "").trim(),
          imageNames: []
        })
      });
      if (!response.ok) {
        if (statusNode) statusNode.textContent = await getErrorMessage(response, "Failed to add listing");
        return;
      }
      accountListingForm.reset();
      await loadMe();
    });
  }

  if (accountListingsNode) {
    accountListingsNode.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-delete-listing]");
      if (!button || !merchantId) return;
      const listingId = Number(button.getAttribute("data-delete-listing"));
      const response = await fetch("/api/merchant/listings", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ merchantId, listingId })
      });
      if (!response.ok) {
        if (statusNode) statusNode.textContent = await getErrorMessage(response, "Failed to delete listing");
        return;
      }
      await loadMe();
    });
  }

  if (buyerOrdersNode) {
    buyerOrdersNode.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-cancel-order]");
      if (!button) return;
      const orderId = Number(button.getAttribute("data-cancel-order"));
      const token = getToken();
      if (!token || !orderId) return;
      const response = await fetch("/api/buyer/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, action: "cancel" })
      });
      if (!response.ok) {
        if (buyerStatusNode) buyerStatusNode.textContent = await getErrorMessage(response, "Failed to cancel order");
        return;
      }
      if (buyerStatusNode) buyerStatusNode.textContent = `Order #${orderId} cancelled.`;
      await loadMe();
    });
  }

  loadMe();
};

initAccountAuth();
