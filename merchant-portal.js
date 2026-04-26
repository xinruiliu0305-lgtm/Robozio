const STORAGE_KEY = "robotzio_merchant_portal_v1";
const TOKEN_KEY = "robotzio_auth_token";

const getDefaultState = () => ({
  profile: {
    merchantId: null,
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    country: "",
    companyType: "manufacturer"
  },
  listings: []
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch (_error) {
    return getDefaultState();
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

const getErrorMessage = async (response, fallback) => {
  try {
    const payload = await response.json();
    return payload?.details || payload?.error || fallback;
  } catch (_error) {
    return fallback;
  }
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

const renderListings = (state, listNode) => {
  const filterTypeNode = document.getElementById("listing-filter-type");
  const filterCategoryNode = document.getElementById("listing-filter-category");
  const filterKeywordNode = document.getElementById("listing-filter-keyword");
  if (!listNode) return;
  const filtered = state.listings.filter((item) => {
    const typePass = !filterTypeNode?.value || item.type === filterTypeNode.value;
    const categoryPass = !filterCategoryNode?.value || item.category === filterCategoryNode.value;
    const keywordPass =
      !filterKeywordNode?.value ||
      item.title.toLowerCase().includes(filterKeywordNode.value.toLowerCase());
    return typePass && categoryPass && keywordPass;
  });
  if (!filtered.length) {
    listNode.innerHTML = `<p class="meta">No products/solutions added yet.</p>`;
    return;
  }
  listNode.innerHTML = filtered
    .map(
      (item, index) => `
        <article class="card pad merchant-listing-item">
          <div>
            <strong>${item.title}</strong>
            <p class="meta">${item.type} | ${item.category}</p>
            <p class="meta">${item.summary}</p>
            <p class="meta">${Array.isArray(item.imageNames) ? item.imageNames.length : 0} image(s)</p>
            ${
              Array.isArray(item.imageNames) && item.imageNames.length
                ? `<div class="listing-image-preview">${item.imageNames
                    .slice(0, 5)
                    .map((url) => `<img src="${url}" alt="Listing image" />`)
                    .join("")}</div>`
                : ""
            }
          </div>
          <button type="button" class="btn btn-alt" data-remove-index="${state.listings.indexOf(item)}" data-listing-id="${item.id || ""}">Remove</button>
        </article>
      `
    )
    .join("");
};

const initMerchantPortal = () => {
  const root = document.querySelector("[data-page='merchant-portal']");
  if (!root) return;

  const state = loadState();

  const profileForm = document.getElementById("merchant-profile-form");
  const listingForm = document.getElementById("merchant-listing-form");
  const listingsNode = document.getElementById("merchant-listings");
  const statusNode = document.getElementById("merchant-status-message");
  const authGate = document.getElementById("merchant-auth-gate");
  const portalApp = document.getElementById("merchant-portal-app");
  const imageInput = listingForm?.elements?.images;
  const imagePreview = document.getElementById("listing-image-preview");
  const filterTypeNode = document.getElementById("listing-filter-type");
  const filterCategoryNode = document.getElementById("listing-filter-category");
  const filterKeywordNode = document.getElementById("listing-filter-keyword");
  let backendReady = true;
  let profileSubmitted = false;

  const setListingFormAvailability = () => {
    if (!listingForm) return;
    const controls = Array.from(listingForm.querySelectorAll("input, select, textarea, button"));
    controls.forEach((el) => {
      el.disabled = !profileSubmitted;
    });
    if (!profileSubmitted && statusNode) {
      statusNode.textContent = "Submit company profile first, then add listings.";
    }
  };

  const syncListingsFromBackend = async () => {
    if (!backendReady || !state.profile.merchantId) return;
    const token = getToken();
    const response = await fetch(`/api/merchant/listings?merchantId=${state.profile.merchantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Failed to load merchant listings"));
    }
    const payload = await response.json();
    state.listings = Array.isArray(payload.listings) ? payload.listings : [];
    saveState(state);
  };

  if (profileForm) {
    Object.entries(state.profile).forEach(([key, value]) => {
      const input = profileForm.elements[key];
      if (input) input.value = value;
    });
    profileForm.addEventListener("submit", (event) => {
      const submitProfile = async () => {
        const data = new FormData(profileForm);
        state.profile = {
          ...state.profile,
          companyName: String(data.get("companyName") || "").trim(),
          contactName: String(data.get("contactName") || "").trim(),
          email: String(data.get("email") || "").trim(),
          phone: String(data.get("phone") || "").trim(),
          country: String(data.get("country") || "").trim(),
          companyType: String(data.get("companyType") || "manufacturer")
        };
        saveState(state);

        if (backendReady) {
          const token = getToken();
          const response = await fetch("/api/merchant/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(state.profile)
          });
          if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Failed to save merchant profile"));
          }
          const payload = await response.json();
          state.profile.merchantId = payload?.merchant?.id || state.profile.merchantId;
          saveState(state);
          await syncListingsFromBackend();
        }
        profileSubmitted = true;
        setListingFormAvailability();
        if (statusNode) statusNode.textContent = "Merchant profile saved.";
      };

      event.preventDefault();
      submitProfile().catch((error) => {
        backendReady = false;
        if (statusNode) statusNode.textContent = `Switched to local mode: ${error.message}`;
      });
    });
  }

  if (listingForm) {
    if (imageInput && imagePreview) {
      imageInput.addEventListener("change", () => {
        const files = Array.from(imageInput.files || []);
        if (files.length > 5) {
          imageInput.value = "";
          imagePreview.innerHTML = "";
          if (statusNode) statusNode.textContent = "Max 5 images allowed.";
          return;
        }
        imagePreview.innerHTML = files
          .map((file) => {
            const src = URL.createObjectURL(file);
            return `<img src="${src}" alt="${file.name}" />`;
          })
          .join("");
      });
    }

    listingForm.addEventListener("submit", (event) => {
      const submitListing = async () => {
        if (!profileSubmitted) {
          if (statusNode) statusNode.textContent = "Please submit company profile first.";
          return;
        }
        const data = new FormData(listingForm);
        const imageFiles = Array.from(data.getAll("images")).filter((file) => file && file.name);
        if (imageFiles.length > 5) {
          if (statusNode) statusNode.textContent = "Max 5 images allowed.";
          return;
        }
        const record = {
          type: String(data.get("listingType") || "Product"),
          title: String(data.get("title") || "").trim(),
          category: String(data.get("category") || "").trim(),
          summary: String(data.get("summary") || "").trim(),
          imageNames: imageFiles.map((file) => file.name).slice(0, 5)
        };
        if (!record.title || !record.category || !record.summary) {
          if (statusNode) statusNode.textContent = "Please complete listing fields before adding.";
          return;
        }

        if (backendReady && state.profile.merchantId) {
          const token = getToken();
          let imageNames = record.imageNames;
          if (imageFiles.length) {
            const encodedImages = await Promise.all(
              imageFiles.slice(0, 5).map(async (file) => ({
                name: file.name,
                dataUrl: await fileToDataUrl(file)
              }))
            );
            const uploadResponse = await fetch("/api/media/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ images: encodedImages })
            });
            if (!uploadResponse.ok) {
              throw new Error(await getErrorMessage(uploadResponse, "Failed to upload images"));
            }
            const uploadPayload = await uploadResponse.json();
            imageNames = (uploadPayload.images || []).map((image) => image.url);
          }
          const response = await fetch("/api/merchant/listings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              merchantId: state.profile.merchantId,
              listingType: record.type,
              title: record.title,
              category: record.category,
              summary: record.summary,
              imageNames
            })
          });
          if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Failed to save listing"));
          }
          await syncListingsFromBackend();
        } else {
          state.listings.push(record);
          saveState(state);
        }

        listingForm.reset();
        if (imagePreview) imagePreview.innerHTML = "";
        renderListings(state, listingsNode);
        if (statusNode) statusNode.textContent = "Listing added. You can add more.";
      };

      event.preventDefault();
      submitListing().catch((error) => {
        backendReady = false;
        if (statusNode) statusNode.textContent = `Listing saved in local mode: ${error.message}`;
      });
    });
  }

  [filterTypeNode, filterCategoryNode, filterKeywordNode].forEach((node) => {
    if (node) node.addEventListener("input", () => renderListings(state, listingsNode));
  });

  if (filterCategoryNode) {
    const categories = [
      "Featured Products",
      "Robot Parts",
      "Robotics Kits",
      "Service Robots",
      "Industrial Robots",
      "Humanoid Robots",
      "Robot Dogs",
      "Delivery Robots",
      "Cleaning Robots",
      "Security Robots",
      "Educational Robots",
      "Robot Rental",
      "Education Solutions",
      "Industrial Solutions",
      "After-sales & Repair",
      "Robot Training",
      "Data Collection",
      "Integration Services"
    ];
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      filterCategoryNode.appendChild(option);
    });
  }

  if (listingsNode) {
    listingsNode.addEventListener("click", (event) => {
      const removeListing = async () => {
        const button = event.target.closest("[data-remove-index]");
        if (!button) return;
        const index = Number(button.getAttribute("data-remove-index"));
        if (!Number.isFinite(index)) return;
        const listingId = Number(button.getAttribute("data-listing-id"));

        if (backendReady && state.profile.merchantId && Number.isInteger(listingId) && listingId > 0) {
          const token = getToken();
          const response = await fetch("/api/merchant/listings", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              merchantId: state.profile.merchantId,
              listingId
            })
          });
          if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Failed to delete listing"));
          }
          await syncListingsFromBackend();
        } else {
          state.listings.splice(index, 1);
          saveState(state);
        }

        renderListings(state, listingsNode);
      };

      const button = event.target.closest("[data-remove-index]");
      if (!button) return;
      removeListing().catch((error) => {
        backendReady = false;
        if (statusNode) statusNode.textContent = `Deletion in local mode: ${error.message}`;
      });
    });
  }

  const boot = async () => {
    const token = getToken();
    if (!token) {
      if (authGate) authGate.style.display = "block";
      if (portalApp) portalApp.style.display = "none";
      return;
    }
    try {
      const meResponse = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meResponse.ok) {
        if (authGate) authGate.style.display = "block";
        if (portalApp) portalApp.style.display = "none";
        return;
      }
      const mePayload = await meResponse.json();
      const role = mePayload?.user?.role || "buyer";
      if (role !== "merchant" && role !== "admin") {
        if (authGate) {
          authGate.style.display = "block";
          authGate.innerHTML = `
            <h2>Seller Account Required</h2>
            <p class="meta">This page is only for sellers. Your current account is buyer type.</p>
            <div class="btn-row">
              <a class="btn btn-primary" href="account.html">Go to Account</a>
              <a class="btn btn-alt" href="support.html">Contact Support</a>
            </div>
          `;
        }
        if (portalApp) portalApp.style.display = "none";
        return;
      }
      if (authGate) authGate.style.display = "none";
      if (portalApp) portalApp.style.display = "block";
      state.profile.email = mePayload?.user?.email || state.profile.email;
      const emailInput = profileForm?.elements?.email;
      if (emailInput) emailInput.readOnly = true;
      if (mePayload?.merchant) {
        state.profile = {
          ...state.profile,
          merchantId: mePayload.merchant.id,
          companyName: mePayload.merchant.companyName || "",
          contactName: mePayload.merchant.contactName || "",
          email: mePayload.merchant.email || state.profile.email,
          phone: mePayload.merchant.phone || "",
          country: mePayload.merchant.country || "",
          companyType: mePayload.merchant.companyType || "manufacturer"
        };
        profileSubmitted = true;
      }
      saveState(state);
      Object.entries(state.profile).forEach(([key, value]) => {
        const input = profileForm?.elements?.[key];
        if (input) input.value = value;
      });
      if (state.profile.merchantId) {
        await syncListingsFromBackend();
      }
    } catch (_error) {
      backendReady = false;
    }
    setListingFormAvailability();
    renderListings(state, listingsNode);
  };

  boot();
};

initMerchantPortal();
