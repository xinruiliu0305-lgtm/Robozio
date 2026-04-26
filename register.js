const getErrorMessage = async (response, fallback) => {
  try {
    const payload = await response.json();
    return payload?.details || payload?.error || fallback;
  } catch (_error) {
    return fallback;
  }
};

const initRegister = () => {
  const root = document.querySelector("[data-page='register-auth']");
  if (!root) return;

  const form = document.getElementById("register-form");
  const statusNode = document.getElementById("register-status");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: String(data.get("fullName") || "").trim(),
        email: String(data.get("email") || "").trim(),
        password: String(data.get("password") || ""),
        accountType: String(data.get("accountType") || "buyer")
      })
    });
    if (!response.ok) {
      if (statusNode) statusNode.textContent = await getErrorMessage(response, "Registration failed");
      return;
    }
    form.reset();
    if (statusNode) statusNode.textContent = "Registration successful. Please login on account page.";
  });
};

initRegister();
