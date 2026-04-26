const navData = [
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
    href: "category.html?group=solutions",
    children: [
      "Robot Rental",
      "Education Solutions",
      "Service Robot Solutions",
      "Industrial Solutions",
      "After-sales & Repair",
      "Robot Training",
      "Data Collection",
      "Hospitality Solutions",
      "Security & Patrol Solutions",
      "Logistics & Warehouse Automation",
      "Government & Smart City Solutions",
      "Event & Exhibition Robots",
      "Custom Integration"
    ]
  },
  {
    label: "Join as Merchant",
    href: "merchant.html",
    children: ["Merchant Benefits", "Listing Fees", "Featured Placement", "Apply Now"]
  },
  {
    label: "Support",
    href: "support.html",
    children: ["Technical Support", "After-sales Service", "Repair Request", "Warranty Help"]
  },
  {
    label: "About Us",
    href: "about.html",
    children: ["About RobotZio", "Mission", "Vision", "What We Do"]
  },
  {
    label: "Partnership",
    href: "partnership.html",
    children: ["System Integrator", "Technology Alliance", "Regional Partner", "Government Program"]
  }
];

function buildHeader() {
  const items = navData.map((item) => {
    const splitIndex = Math.ceil(item.children.length / 2);
    const leftCol = item.children.slice(0, splitIndex).map((child) => `<li><a href="products.html">${child}</a></li>`).join("");
    const rightCol = item.children.slice(splitIndex).map((child) => `<li><a href="products.html">${child}</a></li>`).join("");
    return `
      <li class="nav-item">
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
          <a class="icon-chip" href="account.html" aria-label="Account">Account</a>
          <select class="select-chip" aria-label="Language selector"><option>EN</option><option>AR</option></select>
          <a class="btn btn-primary list-btn" href="merchant.html">List Your Products</a>
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
  if (!form || cards.length === 0 || !results || !emptyState) return;

  const syncUrl = (selectedCategories, selectedAvailability, selectedSupplierType) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("useCase");
    params.delete("availability");
    params.delete("supplierType");

    selectedCategories.forEach((value) => params.append("useCase", value));
    selectedAvailability.forEach((value) => params.append("availability", value));
    selectedSupplierType.forEach((value) => params.append("supplierType", value));

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  };

  const applyFilters = (updateUrl = false) => {
    const selectedCategories = Array.from(form.querySelectorAll("input[name='useCase']:checked")).map((el) => el.value);
    const selectedAvailability = Array.from(form.querySelectorAll("input[name='availability']:checked")).map((el) => el.value);
    const selectedSupplierType = Array.from(form.querySelectorAll("input[name='supplierType']:checked")).map((el) => el.value);

    let visibleCount = 0;
    cards.forEach((card) => {
      const category = card.dataset.category || "";
      const availability = card.dataset.availability || "";
      const supplierType = card.dataset.supplierType || "";

      const categoryPass = selectedCategories.length === 0 || selectedCategories.includes(category);
      const availabilityPass = selectedAvailability.length === 0 || selectedAvailability.includes(availability);
      const supplierTypePass = selectedSupplierType.length === 0 || selectedSupplierType.includes(supplierType);

      const isVisible = categoryPass && availabilityPass && supplierTypePass;
      card.style.display = isVisible ? "" : "none";
      if (isVisible) visibleCount += 1;
    });

    results.textContent = `Showing ${visibleCount} product${visibleCount === 1 ? "" : "s"}`;
    emptyState.style.display = visibleCount === 0 ? "block" : "none";
    if (updateUrl) syncUrl(selectedCategories, selectedAvailability, selectedSupplierType);
  };

  const hydrateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const categories = params.getAll("useCase");
    const availability = params.getAll("availability");
    const supplierTypes = params.getAll("supplierType");

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
  };

  form.addEventListener("change", () => applyFilters(true));
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      form.reset();
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
