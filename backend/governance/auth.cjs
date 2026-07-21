const jwt = require("jsonwebtoken");
const ROLES = new Set(["reader", "editor", "reviewer", "admin", "operator"]);
function cookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const i = x.indexOf("=");
        return [x.slice(0, i), decodeURIComponent(x.slice(i + 1))];
      }),
  );
}
function token(headers) {
  const auth = headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return cookies(headers.cookie).brain_session || "";
}
function authenticate(headers, config) {
  const raw = token(headers);
  if (!raw)
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  try {
    const claims = jwt.verify(raw, config.publicKey, {
        algorithms: ["RS256"],
        issuer: config.oidcIssuer,
        audience: config.oidcAudience,
        maxAge: "15m",
        clockTolerance: 5,
      }),
      role = String(claims.role || "").toLowerCase();
    if (!claims.sub || !claims.tenant_id || !ROLES.has(role))
      throw new Error("governed claims required");
    return {
      subject: claims.sub,
      tenantId: claims.tenant_id,
      role,
      email: claims.email || null,
      name: claims.name || claims.email || claims.sub,
      groups: Array.isArray(claims.groups)
        ? claims.groups.map(String).slice(0, 50)
        : [],
    };
  } catch {
    throw Object.assign(new Error("Invalid or expired organization session"), {
      status: 401,
    });
  }
}
module.exports = { authenticate, cookies, ROLES };
