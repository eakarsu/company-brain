const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { loadConfig } = require("./governance/config.cjs");
const { getPool } = require("./governance/db.cjs");
const { createProviders } = require("./governance/providers.cjs");
const { createService } = require("./governance/service.cjs");
const { cookies } = require("./governance/auth.cjs");
const localAuth = require("./governance/local-auth.cjs");

function clearOidcCookies(res) {
  const options = { expires: new Date(0), path: "/api/v2/auth" };
  res.cookie("brain_oidc_state", "", options);
  res.cookie("brain_oidc_verifier", "", options);
}
function equal(left, right) {
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function mountLegacy(app) {
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/ai", require("./routes/ai"));
  app.use("/api/knowledge", require("./routes/knowledge"));
  app.use("/api/documents", require("./routes/documents"));
  app.use("/api/queries", require("./routes/queries"));
  app.use("/api/procedures", require("./routes/procedures"));
  app.use("/api/policies", require("./routes/policies"));
  app.use("/api/decisions", require("./routes/decisions"));
  app.use("/api/export", require("./routes/export"));
  app.use("/api/search", require("./routes/search"));
  app.use("/api/audit", require("./routes/audit"));
  app.use("/api/admin", require("./routes/sample_data"));
  app.use("/api/dashboard", require("./routes/dashboard"));
}

function createApp({ config, pool, providers } = {}) {
  config ||= loadConfig();
  pool ||= getPool(config);
  providers ||= createProviders(config);
  const app = express(),
    service = createService({ config, pool, providers });
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set({
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
    });
    next();
  });
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.origins.includes(origin)) callback(null, true);
        else
          callback(
            Object.assign(new Error("Origin not allowed"), { status: 403 }),
          );
      },
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  );
  app.use(
    express.json({
      limit: "1mb",
      verify(req, _res, buffer) {
        req.rawBody = buffer.toString("utf8");
      },
    }),
  );
  app.get("/api/v2/health", async (_req, res) => {
    try {
      const check = await pool.query(
        `SELECT to_regclass('public.brain_queries') AS schema`,
      );
      if (!check.rows[0].schema) throw new Error("schema missing");
      res.json({
        ok: true,
        service: "governed-company-brain",
        database: "reachable",
      });
    } catch {
      res.status(503).json({ ok: false });
    }
  });
  if (config.localAuth) {
    app.post("/api/auth/login", async (req, res, next) => {
      try {
        const { email, password } = req.body || {};
        const result = typeof email === "string" && typeof password === "string" ? await localAuth.login(email, password) : null;
        if (!result) return res.status(401).json({ error: "Invalid credentials" });
        res.cookie("brain_local_session", result.token, { httpOnly: true, secure: false, sameSite: "strict", maxAge: 8 * 60 * 60 * 1000, path: "/" });
        return res.json(result);
      } catch (error) { return next(error); }
    });
    const localSession = async (req, res, next) => {
      try {
        const user = await localAuth.session(localAuth.requestToken(req.headers));
        return user ? res.json({ user }) : res.status(401).json({ error: "Invalid session" });
      } catch (error) { return next(error); }
    };
    app.get("/api/auth/me", localSession);
    app.get("/api/v2/brain/session", localSession);
  }
  app.get("/api/v2/auth/sso", (_req, res) => {
    const state = crypto.randomBytes(32).toString("base64url"),
      verifier = crypto.randomBytes(48).toString("base64url"),
      challenge = crypto
        .createHash("sha256")
        .update(verifier)
        .digest("base64url"),
      target = new URL(config.oidcAuthorizeUrl);
    target.searchParams.set("response_type", "code");
    target.searchParams.set("client_id", config.oidcClientId);
    target.searchParams.set("redirect_uri", config.oidcRedirectUri);
    target.searchParams.set("scope", "openid profile email");
    target.searchParams.set("state", state);
    target.searchParams.set("code_challenge", challenge);
    target.searchParams.set("code_challenge_method", "S256");
    const options = {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      maxAge: 600000,
      path: "/api/v2/auth",
    };
    res.cookie("brain_oidc_state", state, options);
    res.cookie("brain_oidc_verifier", verifier, options);
    res.redirect(303, target.toString());
  });
  app.get("/api/v2/auth/callback", async (req, res) => {
    const jar = cookies(req.headers.cookie),
      code = String(req.query.code || ""),
      state = String(req.query.state || "");
    if (
      !code ||
      !state ||
      !jar.brain_oidc_state ||
      !jar.brain_oidc_verifier ||
      !equal(state, jar.brain_oidc_state)
    )
      return res.redirect(303, "/?auth_error=invalid_sso_state");
    try {
      const body = new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: config.oidcRedirectUri,
          client_id: config.oidcClientId,
          client_secret: config.oidcClientSecret,
          code_verifier: jar.brain_oidc_verifier,
        }),
        tokenResponse = await fetch(config.oidcTokenUrl, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
          body,
          signal: AbortSignal.timeout(8000),
        }),
        token = await tokenResponse.json();
      if (!tokenResponse.ok || typeof token.id_token !== "string")
        throw new Error("exchange");
      const claims = jwt.verify(token.id_token, config.publicKey, {
        algorithms: ["RS256"],
        issuer: config.oidcIssuer,
        audience: config.oidcAudience,
        maxAge: "15m",
        clockTolerance: 5,
      });
      if (
        !claims.sub ||
        !claims.tenant_id ||
        !["reader", "editor", "reviewer", "admin", "operator"].includes(
          String(claims.role).toLowerCase(),
        )
      )
        throw new Error("claims");
      clearOidcCookies(res);
      res.cookie("brain_session", token.id_token, {
        httpOnly: true,
        secure: config.production,
        sameSite: "strict",
        maxAge: Math.min(Number(token.expires_in) || 900, 900) * 1000,
        path: "/",
      });
      res.redirect(303, "/");
    } catch {
      clearOidcCookies(res);
      res.redirect(303, "/?auth_error=sso_failed");
    }
  });
  app.post("/api/v2/auth/logout", (_req, res) => {
    res.cookie("brain_session", "", {
      httpOnly: true,
      secure: config.production,
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });
    res.status(204).end();
  });
  app.use("/api/v2", async (req, res) => {
    const started = Date.now(),
      requestId = crypto.randomUUID(),
      result = await service({
        method: req.method,
        path: req.path.replace(/^\//, ""),
        headers: req.headers,
        body: req.body || {},
        rawBody: req.rawBody || "",
      });
    console.info(
      JSON.stringify({
        event: "brain.request",
        requestId,
        method: req.method,
        route: req.path,
        status: result.status,
        durationMs: Date.now() - started,
      }),
    );
    res.set("x-request-id", requestId).status(result.status).json(result.body);
  });
  if (config.legacyEnabled) mountLegacy(app);
  else
    app.use("/api", (_req, res) =>
      res
        .status(404)
        .json({
          error:
            "Legacy password-auth, unscoped data, generic-AI, mock, and generated-gap APIs are quarantined",
        }),
    );
  const frontend = path.join(__dirname, "..", "frontend", "dist");
  if (fs.existsSync(frontend)) {
    app.use(
      express.static(frontend, {
        fallthrough: true,
        maxAge: config.production ? "1h" : 0,
      }),
    );
    app.get("*", (_req, res) =>
      res.sendFile(path.join(frontend, "index.html")),
    );
  }
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    console.error(
      JSON.stringify({
        event: "brain.error",
        status,
        code: error.code || "UNEXPECTED",
      }),
    );
    res
      .status(status)
      .json({ error: status >= 500 ? "Internal server error" : error.message });
  });
  return app;
}

if (require.main === module) {
  try {
    const config = loadConfig(),
      pool = getPool(config),
      app = createApp({ config, pool, providers: createProviders(config) });
    app.listen(config.port, () =>
      console.log(
        JSON.stringify({ event: "brain.started", port: config.port }),
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { createApp };
