const navData = [
  { label: "Robot Parts", href: "category.html?group=parts", children: ["Motors & Actuators", "Sensors", "Controllers", "AI Modules", "Power & Batteries", "Wheels & Chassis"] },
  { label: "Robots & Kits", href: "category.html?group=robots", children: ["Humanoid Robots", "Robot Dogs", "Delivery Robots", "STEM Kits", "Research Platforms", "DIY Robot Kits"] },
  { label: "Robotics Education", href: "category.html?group=education", children: ["Classroom Bundles", "University Labs", "Competition Kits", "Teacher Resources", "Coding Robots"] },
  { label: "Consumer Robotics", href: "category.html?group=consumer", children: ["Home Robots", "Cleaning Robots", "Entertainment Robots", "Smart Home AI"] },
  { label: "Professional Service Robots", href: "category.html?group=professional", children: ["Hospitality", "Healthcare", "Retail", "Government", "Security Patrol"] },
  { label: "Industrial Robots & Parts", href: "category.html?group=industrial", children: ["Cobots", "Warehouse AMR", "Inspection Robots", "Industrial Grippers", "Industrial Sensors"] },
  { label: "Brands", href: "#brands", children: ["Unitree", "ABB", "KUKA", "NVIDIA", "DJI"] },
  { label: "Deals", href: "products.html?deals=true", children: ["Featured", "Best Sellers", "Clearance", "Bulk Discounts"] },
  { label: "Support", href: "support.html", children: ["Sales Support", "Technical Support", "Warranty", "Repair Booking"] },
  { label: "Partnership", href: "partnership.html", children: ["Reseller Program", "System Integrator", "Technology Alliance", "Government Program"] }
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
      <div class="top-utility">
        <div class="container">
          <span>Middle East robotics marketplace and services platform</span>
          <span>Free consultation for enterprise deployment projects</span>
        </div>
      </div>
      <div class="container header-row">
        <a class="logo" href="index.html">Robo<span>Zio</span></a>
        <form class="search" method="get" action="search.html">
          <input name="q" placeholder="Search robots, parts, solutions, services..." />
          <button type="submit">Search</button>
        </form>
        <div class="head-actions">
          <select class="select-chip"><option>English</option><option>Arabic</option></select>
          <select class="select-chip"><option>UAE</option><option>Saudi Arabia</option><option>Qatar</option><option>Kuwait</option><option>Oman</option><option>Bahrain</option></select>
          <a class="icon-chip" href="account.html">Account</a>
          <a class="icon-chip" href="cart.html">Cart (2)</a>
        </div>
      </div>
      <div class="nav-wrap">
        <div class="container">
          <ul class="nav">${items}</ul>
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
          <h4>Company</h4>
          <ul>
            <li>About RoboZio</li>
            <li>Enterprise Solutions</li>
            <li><a href="partnership.html">Partnerships</a></li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li>Dubai, UAE</li>
            <li>+971 4 000 0000</li>
            <li>hello@robozio.com</li>
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

function initProductFilters() {
  const page = document.querySelector("[data-page='products']");
  if (!page) return;

  const form = document.getElementById("product-filters");
  const resetButton = document.getElementById("reset-filters");
  const cards = Array.from(document.querySelectorAll(".product-item"));
  const results = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-products-message");
  if (!form || cards.length === 0 || !results || !emptyState) return;

  const syncUrl = (selectedCategories, selectedAvailability, selectedPrice) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("category");
    params.delete("availability");
    params.delete("price");

    selectedCategories.forEach((value) => params.append("category", value));
    selectedAvailability.forEach((value) => params.append("availability", value));
    if (selectedPrice && selectedPrice !== "all") params.set("price", selectedPrice);

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  };

  const applyFilters = (updateUrl = false) => {
    const selectedCategories = Array.from(form.querySelectorAll("input[name='category']:checked")).map((el) => el.value);
    const selectedAvailability = Array.from(form.querySelectorAll("input[name='availability']:checked")).map((el) => el.value);
    const selectedPrice = form.querySelector("input[name='price']:checked")?.value || "all";

    let visibleCount = 0;
    cards.forEach((card) => {
      const category = card.dataset.category || "";
      const availability = card.dataset.availability || "";
      const price = Number(card.dataset.price || "0");

      const categoryPass = selectedCategories.length === 0 || selectedCategories.includes(category);
      const availabilityPass = selectedAvailability.length === 0 || selectedAvailability.includes(availability);
      let pricePass = true;
      if (selectedPrice !== "all") {
        const [min, max] = selectedPrice.split("-").map(Number);
        pricePass = price >= min && price <= max;
      }

      const isVisible = categoryPass && availabilityPass && pricePass;
      card.style.display = isVisible ? "" : "none";
      if (isVisible) visibleCount += 1;
    });

    results.textContent = `Showing ${visibleCount} product${visibleCount === 1 ? "" : "s"}`;
    emptyState.style.display = visibleCount === 0 ? "block" : "none";
    if (updateUrl) syncUrl(selectedCategories, selectedAvailability, selectedPrice);
  };

  const hydrateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const categories = params.getAll("category");
    const availability = params.getAll("availability");
    const price = params.get("price");

    categories.forEach((value) => {
      const checkbox = form.querySelector(`input[name="category"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });

    availability.forEach((value) => {
      const checkbox = form.querySelector(`input[name="availability"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });

    if (price) {
      const radio = form.querySelector(`input[name="price"][value="${price}"]`);
      if (radio) radio.checked = true;
    }
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

mountShared();
wireModal();
initProductFilters();
