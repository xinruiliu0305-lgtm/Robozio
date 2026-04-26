const navData = [
  {
    label: "Home",
    href: "index.html"
  },
  {
    label: "Robots",
    href: "products.html",
    children: [
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
      "Educational Robots"
    ]
  },
  {
    label: "Solutions",
    href: "solutions.html",
    children: [
      { label: "Robot Rental", href: "solution-rental.html" },
      { label: "Education Solutions", href: "solution-education.html" },
      { label: "Industrial Solutions", href: "solution-industrial.html" },
      { label: "After-sales & Repair", href: "solution-after-sales-repair.html" },
      { label: "Robot Training", href: "solution-training.html" },
      { label: "Data Collection", href: "solution-data-collection.html" },
      { label: "Integration Services", href: "solution-integration.html" }
    ]
  },
  {
    label: "Join as Merchant",
    href: "merchant-portal.html",
    children: ["Merchant Benefits", "Listing Fees", "Featured Placement", "Apply Now"]
  },
  {
    label: "Support",
    href: "support.html"
  },
  {
    label: "Partnership",
    href: "partnership.html"
  },
  {
    label: "About Us",
    href: "about.html"
  }
];

function buildHeader() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const isActiveNav = (href) => {
    if (!href) return false;
    const normalizedHref = href.split("?")[0];
    if (normalizedHref === "solutions.html" && currentPath.startsWith("solution-")) {
      return true;
    }
    if (normalizedHref === "index.html") {
      return currentPath === "" || currentPath === "index.html";
    }
    return currentPath === normalizedHref;
  };

  const items = navData.map((item) => {
    const activeClass = isActiveNav(item.href) ? " active" : "";
    if (!item.children || item.children.length === 0) {
      return `
      <li class="nav-item${activeClass}">
        <a href="${item.href}">${item.label}</a>
      </li>
    `;
    }
    const childItems = item.children.map((child) => {
      if (typeof child === "string") {
        return { label: child, href: "products.html" };
      }
      return child;
    });
    const splitIndex = Math.ceil(childItems.length / 2);
    const leftCol = childItems.slice(0, splitIndex).map((child) => `<li><a href="${child.href}">${child.label}</a></li>`).join("");
    const rightCol = childItems.slice(splitIndex).map((child) => `<li><a href="${child.href}">${child.label}</a></li>`).join("");
    return `
      <li class="nav-item${activeClass}">
        <a href="${item.href}">${item.label}</a>
        <div class="dropdown mega-menu">
          <h4>${item.label}</h4>
          <div class="mega-columns">
            <ul>${leftCol}</ul>
            <ul>${rightCol}</ul>
          </div>
        </div>
      </li>
    `;
  }).join("");

  return `
    <header class="top">
      <div class="container header-row">
        <a class="logo" href="index.html">Robot<span>Zio</span></a>
        <button class="mobile-nav-toggle icon-chip" type="button" data-mobile-nav-toggle>Menu</button>
        <nav class="main-nav"><ul class="nav">${items}</ul></nav>
        <form class="search compact" method="get" action="search.html">
          <input name="q" placeholder="Search robotics products and solutions..." />
        </form>
        <div class="head-actions">
          <a class="icon-chip" href="search.html" aria-label="Search">Search</a>
          <a class="icon-chip" href="cart.html" aria-label="Cart">Cart</a>
          <a class="icon-chip" href="account.html" aria-label="Account">Account</a>
          <select class="select-chip" aria-label="Language selector"><option>EN</option><option>AR</option></select>
          <a class="btn btn-primary list-btn" href="merchant-portal.html">List Your Products</a>
        </div>
      </div>
      <div class="mobile-nav-drawer" data-mobile-nav-drawer>
        <div class="container">
          <ul class="mobile-nav-list">${items}</ul>
        </div>
      </div>
    </header>
  `;
}

function buildFooter() {
  return `
    <footer class="footer">
      <div class="container foot-grid">
        <div>
          <h4>Categories</h4>
          <ul>
            <li><a href="category.html?group=robots">Robots</a></li>
            <li><a href="category.html?group=parts">Robot Parts</a></li>
            <li><a href="category.html?group=professional">Professional Robots</a></li>
            <li><a href="category.html?group=solutions">Industry Solutions</a></li>
            <li><a href="featured.html">Featured Products</a></li>
            <li><a href="partnership.html">Partnership</a></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><a href="support.html">Maintenance Request</a></li>
            <li><a href="support.html">Repair Booking</a></li>
            <li><a href="support.html">Warranty Claim</a></li>
          </ul>
        </div>
        <div>
          <h4>About Us</h4>
          <ul>
            <li><a href="about.html">About RobotZio</a></li>
            <li><a href="partnership.html">Partnerships</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li>Dubai, UAE</li>
            <li>+971 4 000 0000</li>
            <li>hello@robotzio.com</li>
          </ul>
        </div>
      </div>
    </footer>
  `;
}

function mountShared() {
  const h = document.querySelector("[data-shared='header']");
  const f = document.querySelector("[data-shared='footer']");
  if (h) h.innerHTML = buildHeader();
  if (f) f.innerHTML = buildFooter();
}

function wireModal() {
  const modal = document.querySelector("[data-modal]");
  const open = document.querySelector("[data-open-modal]");
  const close = document.querySelector("[data-close-modal]");
  if (!modal || !open || !close) return;
  open.addEventListener("click", () => modal.classList.add("show"));
  close.addEventListener("click", () => modal.classList.remove("show"));
}

function wireMobileNav() {
  const toggle = document.querySelector("[data-mobile-nav-toggle]");
  const drawer = document.querySelector("[data-mobile-nav-drawer]");
  if (!toggle || !drawer) return;
  toggle.addEventListener("click", () => {
    drawer.classList.toggle("show");
  });
}

function initProductFilters() {
  const page = document.querySelector("[data-page='products']");
  if (!page) return;

  const form = document.getElementById("product-filters");
  const resetButton = document.getElementById("reset-filters");
  const cards = Array.from(document.querySelectorAll(".product-item"));
  const results = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-products-message");
  const minPriceInput = document.getElementById("min-price");
  const maxPriceInput = document.getElementById("max-price");
  const minPriceValue = document.getElementById("min-price-value");
  const maxPriceValue = document.getElementById("max-price-value");
  const selectedPriceRange = document.getElementById("selected-price-range");
  if (!form || cards.length === 0 || !results || !emptyState) return;

  const formatAed = (value) => `AED ${Math.round(value).toLocaleString()}`;
  const parsePrice = (text) => {
    if (!text) return null;
    const match = text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
  };

  const detectedPrices = cards
    .map((card) => parsePrice(card.querySelector(".price")?.textContent || ""))
    .filter((value) => Number.isFinite(value));
  const detectedMin = detectedPrices.length ? Math.floor(Math.min(...detectedPrices)) : 0;
  const detectedMax = detectedPrices.length ? Math.ceil(Math.max(...detectedPrices)) : 100000;

  if (minPriceInput && maxPriceInput) {
    minPriceInput.min = String(detectedMin);
    minPriceInput.max = String(detectedMax);
    maxPriceInput.min = String(detectedMin);
    maxPriceInput.max = String(detectedMax);
    minPriceInput.value = String(detectedMin);
    maxPriceInput.value = String(detectedMax);
  }

  const renderPriceUi = () => {
    if (!minPriceInput || !maxPriceInput) return;
    const min = Number(minPriceInput.value);
    const max = Number(maxPriceInput.value);
    if (minPriceValue) minPriceValue.textContent = formatAed(min);
    if (maxPriceValue) maxPriceValue.textContent = formatAed(max);
    if (selectedPriceRange) selectedPriceRange.textContent = `${formatAed(min)} - ${formatAed(max)}`;
  };

  const syncUrl = (selectedCategories, selectedAvailability, selectedSupplierType, selectedBrands, selectedProductTypes, minPrice, maxPrice) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("useCase");
    params.delete("availability");
    params.delete("supplierType");
    params.delete("brand");
    params.delete("productType");
    params.delete("minPrice");
    params.delete("maxPrice");

    selectedCategories.forEach((value) => params.append("useCase", value));
    selectedAvailability.forEach((value) => params.append("availability", value));
    selectedSupplierType.forEach((value) => params.append("supplierType", value));
    selectedBrands.forEach((value) => params.append("brand", value));
    selectedProductTypes.forEach((value) => params.append("productType", value));
    if (minPrice > detectedMin) params.set("minPrice", String(minPrice));
    if (maxPrice < detectedMax) params.set("maxPrice", String(maxPrice));

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  };

  const applyFilters = (updateUrl = false) => {
    const selectedCategories = Array.from(form.querySelectorAll("input[name='useCase']:checked")).map((el) => el.value);
    const selectedAvailability = Array.from(form.querySelectorAll("input[name='availability']:checked")).map((el) => el.value);
    const selectedSupplierType = Array.from(form.querySelectorAll("input[name='supplierType']:checked")).map((el) => el.value);
    const selectedBrands = Array.from(form.querySelectorAll("input[name='brand']:checked")).map((el) => el.value);
    const selectedProductTypes = Array.from(form.querySelectorAll("input[name='productType']:checked")).map((el) => el.value);
    const minPrice = minPriceInput ? Number(minPriceInput.value) : detectedMin;
    const maxPrice = maxPriceInput ? Number(maxPriceInput.value) : detectedMax;
    const isPriceFilterActive = minPrice > detectedMin || maxPrice < detectedMax;

    let visibleCount = 0;
    cards.forEach((card) => {
      const category = card.dataset.category || "";
      const availability = card.dataset.availability || "";
      const supplierType = card.dataset.supplierType || "";
      const brand = card.dataset.brand || "";
      const productType = card.dataset.productType || "";
      const cardPrice = parsePrice(card.querySelector(".price")?.textContent || "");

      const categoryPass = selectedCategories.length === 0 || selectedCategories.includes(category);
      const availabilityPass = selectedAvailability.length === 0 || selectedAvailability.includes(availability);
      const supplierTypePass = selectedSupplierType.length === 0 || selectedSupplierType.includes(supplierType);
      const brandPass = selectedBrands.length === 0 || selectedBrands.includes(brand);
      const productTypePass = selectedProductTypes.length === 0 || selectedProductTypes.includes(productType);
      const pricePass = !isPriceFilterActive || (cardPrice !== null && cardPrice >= minPrice && cardPrice <= maxPrice);

      const isVisible = categoryPass && availabilityPass && supplierTypePass && brandPass && productTypePass && pricePass;
      card.style.display = isVisible ? "" : "none";
      if (isVisible) visibleCount += 1;
    });

    results.textContent = `Showing ${visibleCount} product${visibleCount === 1 ? "" : "s"}`;
    emptyState.style.display = visibleCount === 0 ? "block" : "none";
    renderPriceUi();
    if (updateUrl) syncUrl(selectedCategories, selectedAvailability, selectedSupplierType, selectedBrands, selectedProductTypes, minPrice, maxPrice);
  };

  const hydrateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const categories = params.getAll("useCase");
    const availability = params.getAll("availability");
    const supplierTypes = params.getAll("supplierType");
    const brands = params.getAll("brand");
    const productTypes = params.getAll("productType");
    const minPriceParam = Number(params.get("minPrice"));
    const maxPriceParam = Number(params.get("maxPrice"));

    categories.forEach((value) => {
      const checkbox = form.querySelector(`input[name="useCase"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });

    availability.forEach((value) => {
      const checkbox = form.querySelector(`input[name="availability"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });

    supplierTypes.forEach((value) => {
      const checkbox = form.querySelector(`input[name="supplierType"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });
    brands.forEach((value) => {
      const checkbox = form.querySelector(`input[name="brand"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });
    productTypes.forEach((value) => {
      const checkbox = form.querySelector(`input[name="productType"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });

    if (minPriceInput && Number.isFinite(minPriceParam)) {
      minPriceInput.value = String(Math.max(detectedMin, Math.min(minPriceParam, detectedMax)));
    }
    if (maxPriceInput && Number.isFinite(maxPriceParam)) {
      maxPriceInput.value = String(Math.max(detectedMin, Math.min(maxPriceParam, detectedMax)));
    }
  };

  form.addEventListener("change", () => applyFilters(true));
  const syncPriceInputs = (changed) => {
    if (!minPriceInput || !maxPriceInput) return;
    let min = Number(minPriceInput.value);
    let max = Number(maxPriceInput.value);
    if (changed === "min" && min > max) max = min;
    if (changed === "max" && max < min) min = max;
    minPriceInput.value = String(min);
    maxPriceInput.value = String(max);
    applyFilters(true);
  };
  if (minPriceInput) minPriceInput.addEventListener("input", () => syncPriceInputs("min"));
  if (maxPriceInput) maxPriceInput.addEventListener("input", () => syncPriceInputs("max"));
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      form.reset();
      if (minPriceInput) minPriceInput.value = String(detectedMin);
      if (maxPriceInput) maxPriceInput.value = String(detectedMax);
      applyFilters(true);
    });
  }

  hydrateFromUrl();
  applyFilters(false);
}

function initHeroRotator() {
  const section = document.querySelector("[data-hero-rotator]");
  if (!section) return;
  const slides = Array.from(section.querySelectorAll(".hero-slide"));
  const dots = Array.from(section.querySelectorAll(".hero-dot"));
  if (slides.length < 2) return;
  let active = 0;

  const setActiveSlide = (index) => {
    slides[active].classList.remove("active");
    if (dots[active]) dots[active].classList.remove("active");
    active = index;
    slides[active].classList.add("active");
    if (dots[active]) dots[active].classList.add("active");
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => setActiveSlide(index));
  });

  setInterval(() => {
    setActiveSlide((active + 1) % slides.length);
  }, 5000);
}

function mountAiAssistant() {
  const existing = document.querySelector("[data-ai-assistant]");
  if (existing) return;

  const assistant = document.createElement("div");
  assistant.setAttribute("data-ai-assistant", "true");
  assistant.className = "ai-assistant";
  assistant.innerHTML = `
    <button class="ai-trigger" type="button" aria-label="Open AI Assistant" data-ai-trigger>
      <span class="ai-trigger-icon">AI</span>
    </button>
    <section class="ai-panel" data-ai-panel>
      <header class="ai-header">
        <strong>RobotZio AI Assistant</strong>
        <button class="ai-close" type="button" aria-label="Close assistant" data-ai-close>Close</button>
      </header>
      <div class="ai-body" data-ai-body>
        <article class="ai-msg ai-msg-bot">
          Hello, I can help you with products, RFQ, merchant listing, and support requests.
        </article>
      </div>
      <div class="ai-quick-actions">
        <button type="button" class="ai-chip" data-ai-prompt="I need robot recommendations for hospitality.">Hospitality robots</button>
        <button type="button" class="ai-chip" data-ai-prompt="How can I submit an RFQ?">Submit RFQ</button>
        <button type="button" class="ai-chip" data-ai-prompt="How do I join as a merchant?">Join as merchant</button>
      </div>
      <form class="ai-input-row" data-ai-form>
        <input name="message" placeholder="Ask anything about RobotZio..." required />
        <button type="submit">Send</button>
      </form>
    </section>
  `;

  document.body.appendChild(assistant);

  const trigger = assistant.querySelector("[data-ai-trigger]");
  const panel = assistant.querySelector("[data-ai-panel]");
  const close = assistant.querySelector("[data-ai-close]");
  const form = assistant.querySelector("[data-ai-form]");
  const body = assistant.querySelector("[data-ai-body]");
  const chips = Array.from(assistant.querySelectorAll(".ai-chip"));

  const addMessage = (text, role) => {
    const msg = document.createElement("article");
    msg.className = `ai-msg ${role === "user" ? "ai-msg-user" : "ai-msg-bot"}`;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  };

  const getFallbackReply = (input) => {
    const message = input.toLowerCase();
    if (message.includes("merchant") || message.includes("seller") || message.includes("join")) {
      return "To join as a merchant, open the Join as Merchant page. Prepare your company profile, product categories, and catalog link, then submit the merchant form.";
    }
    if (message.includes("rfq") || message.includes("quote")) {
      return "You can submit RFQ from the homepage Smart RFQ section or from product detail pages. Include use case, budget range, region, and deployment timeline for faster matching.";
    }
    if (message.includes("support") || message.includes("repair")) {
      return "For technical support, repair, or warranty, open the Support page and submit the support form. Requests are sent directly to the RobotZio support inbox.";
    }
    if (message.includes("price") || message.includes("cost")) {
      return "Most products use Request Quote because prices depend on configuration, service scope, and deployment region. Share your requirements and RobotZio will match suitable suppliers.";
    }
    return "I can help with product discovery, RFQ, merchant onboarding, and support workflows. Ask me your use case and I can guide you to the right next step.";
  };

  const getOpenAiReply = async (input) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    if (!response.ok) {
      throw new Error(`AI request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data?.reply || getFallbackReply(input);
  };

  trigger.addEventListener("click", () => panel.classList.toggle("show"));
  close.addEventListener("click", () => panel.classList.remove("show"));
  chips.forEach((chip) => {
    chip.addEventListener("click", async () => {
      const prompt = chip.getAttribute("data-ai-prompt");
      if (!prompt) return;
      addMessage(prompt, "user");
      addMessage("Thinking...", "bot");
      const loadingNode = body.lastElementChild;
      try {
        const reply = await getOpenAiReply(prompt);
        if (loadingNode) loadingNode.textContent = reply;
      } catch (_error) {
        if (loadingNode) loadingNode.textContent = getFallbackReply(prompt);
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = form.elements.message;
    if (!input || !input.value.trim()) return;
    const userText = input.value.trim();
    addMessage(userText, "user");
    addMessage("Thinking...", "bot");
    const loadingNode = body.lastElementChild;
    try {
      const reply = await getOpenAiReply(userText);
      if (loadingNode) loadingNode.textContent = reply;
    } catch (_error) {
      if (loadingNode) loadingNode.textContent = getFallbackReply(userText);
    }
    form.reset();
  });
}

mountShared();
wireModal();
wireMobileNav();
initProductFilters();
initHeroRotator();
mountAiAssistant();
