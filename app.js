const navData = [
  { label: "Robots", href: "category.html?group=robots", children: ["Humanoid Robots", "Robot Dogs", "Delivery Robots", "Cleaning Robots", "Security Robots", "Inspection Robots", "Educational Robots"] },
  { label: "Robot Parts", href: "category.html?group=parts", children: ["Motors", "Sensors", "Controllers", "Batteries", "AI Modules", "Cameras", "Wheels & Chassis", "Development Boards"] },
  { label: "Professional Robots", href: "category.html?group=professional", children: ["Hospitality", "Logistics", "Healthcare", "Retail", "Real Estate", "Government", "Security"] },
  { label: "Solutions", href: "category.html?group=solutions", children: ["Hotel Robot Solutions", "Warehouse Automation", "Security Patrol Solutions", "Education & Research", "Event & Exhibition Robots", "Government & Smart City Solutions"] },
  { label: "Rental & Leasing", href: "category.html?group=rental", children: ["Short-Term Rental", "Event Rental", "Monthly Leasing", "Enterprise Deployment"] },
  { label: "Services", href: "support.html", children: ["Maintenance & Repair", "Spare Parts Supply", "Integration Service", "On-site Support", "Training", "Warranty Support"] },
  { label: "Brands", href: "#brands", children: ["Unitree", "ABB", "KUKA", "NVIDIA"] },
  { label: "Deals", href: "products.html?deals=true", children: ["Featured", "Best Sellers", "Bulk Discounts"] },
  { label: "Support", href: "support.html", children: ["Maintenance Request", "Warranty Claim", "Technical Support"] }
];

function buildHeader() {
  const items = navData.map((item) => {
    const children = item.children.map((child) => `<li><a href="products.html">${child}</a></li>`).join("");
    return `<li class="nav-item"><a href="${item.href}">${item.label}</a><ul class="dropdown">${children}</ul></li>`;
  }).join("");

  return `
    <header class="top">
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
            <li>Partnerships</li>
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

mountShared();
wireModal();
