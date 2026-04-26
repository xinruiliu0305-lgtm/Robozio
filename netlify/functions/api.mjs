import chatHandler from "../../api/chat.js";
import createPaymentSessionHandler from "../../api/create-payment-session.js";
import stripeWebhookHandler from "../../api/stripe-webhook.js";
import merchantRegisterHandler from "../../api/merchant/register.js";
import merchantListingsHandler from "../../api/merchant/listings.js";
import authRegisterHandler from "../../api/auth/register.js";
import authLoginHandler from "../../api/auth/login.js";
import authMeHandler from "../../api/auth/me.js";
import authLogoutHandler from "../../api/auth/logout.js";
import adminOverviewHandler from "../../api/admin/overview.js";
import adminMerchantStatusHandler from "../../api/admin/merchant-status.js";
import adminBuyerOrderStatusHandler from "../../api/admin/buyer-order-status.js";
import buyerCartHandler from "../../api/buyer/cart.js";
import buyerOrdersHandler from "../../api/buyer/orders.js";
import mediaUploadHandler from "../../api/media/upload.js";
import mediaAdminListHandler from "../../api/media/admin-list.js";
import mediaAdminDeleteHandler from "../../api/media/admin-delete.js";

const ROUTES = new Map([
  ["chat", chatHandler],
  ["create-payment-session", createPaymentSessionHandler],
  ["stripe-webhook", stripeWebhookHandler],
  ["merchant/register", merchantRegisterHandler],
  ["merchant/listings", merchantListingsHandler],
  ["auth/register", authRegisterHandler],
  ["auth/login", authLoginHandler],
  ["auth/me", authMeHandler],
  ["auth/logout", authLogoutHandler],
  ["admin/overview", adminOverviewHandler],
  ["admin/merchant-status", adminMerchantStatusHandler],
  ["admin/buyer-order-status", adminBuyerOrderStatusHandler],
  ["buyer/cart", buyerCartHandler],
  ["buyer/orders", buyerOrdersHandler],
  ["media/upload", mediaUploadHandler],
  ["media/admin-list", mediaAdminListHandler],
  ["media/admin-delete", mediaAdminDeleteHandler]
]);

const normalizePath = (eventPath) => {
  const marker = "/api/";
  const idx = eventPath.indexOf(marker);
  if (idx === -1) return "";
  return eventPath.slice(idx + marker.length).replace(/^\/+/, "");
};

const createReq = (event) => {
  const url = new URL(event.rawUrl || `https://example.com${event.path}`);
  const query = Object.fromEntries(url.searchParams.entries());
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  const bodyText = event.body || "";
  const isBase64 = Boolean(event.isBase64Encoded);
  const bodyBuffer = isBase64 ? Buffer.from(bodyText, "base64") : Buffer.from(bodyText);
  let parsedBody = {};
  if (bodyText) {
    try {
      parsedBody = JSON.parse(isBase64 ? bodyBuffer.toString("utf8") : bodyText);
    } catch (_error) {
      parsedBody = {};
    }
  }

  return {
    method: event.httpMethod,
    headers,
    query,
    body: parsedBody,
    async *[Symbol.asyncIterator]() {
      yield bodyBuffer;
    }
  };
};

const createRes = () => {
  let statusCode = 200;
  const headers = { "content-type": "application/json" };
  let body = "";

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    json(payload) {
      body = JSON.stringify(payload);
      return this;
    },
    send(payload) {
      body = typeof payload === "string" ? payload : JSON.stringify(payload);
      return this;
    },
    end(payload = "") {
      body = String(payload);
      return this;
    },
    toNetlifyResponse() {
      return {
        statusCode,
        headers,
        body
      };
    }
  };
};

export default async (event) => {
  const route = normalizePath(event.path || "");
  const handler = ROUTES.get(route);
  if (!handler) {
    return {
      statusCode: 404,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: `Route not found: ${route}` })
    };
  }

  const req = createReq(event);
  const res = createRes();
  await handler(req, res);
  return res.toNetlifyResponse();
};
