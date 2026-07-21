function required(name, env) {
  const value = env[name];
  if (
    !value ||
    /change-me|replace-with|example\.(org|com)|base64-encoded/i.test(value)
  )
    throw new Error(`${name} must be configured with a non-placeholder value`);
  return value;
}
function https(name, env) {
  const value = required(name, env);
  if (!value.startsWith("https://")) throw new Error(`${name} must use HTTPS`);
  return value;
}
function integer(name, env, min, max, fallback) {
  const n = Number(env[name] ?? fallback);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  return n;
}
function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const localAuth = !production && env.BOOTSTRAP_ACKNOWLEDGEMENT === "create-initial-admin" && env.AUTH_MODE !== "oidc";
  if (localAuth) {
    const origins = (env.CORS_ORIGINS || `http://127.0.0.1:${integer("PORT", env, 1, 65535, 3005)}`)
      .split(",").map((value) => value.trim()).filter(Boolean);
    const webhookSecret = required("JWT_SECRET", env);
    if (webhookSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
    return {
      production, localAuth, port: integer("PORT", env, 1, 65535, 3005),
      databaseUrl: required("DATABASE_URL", env), databaseSsl: false, origins,
      oidcIssuer: "", oidcAudience: "", oidcAuthorizeUrl: "", oidcTokenUrl: "",
      oidcClientId: "", oidcClientSecret: "", oidcRedirectUri: "", publicKey: "",
      connectorGateway: { baseUrl: "", token: "" }, answerGateway: { baseUrl: "", token: "" },
      webhookSecret, aiMaxCostCents: integer("AI_MAX_COST_CENTS", env, 1, 100, 5),
      aiTimeoutMs: integer("AI_TIMEOUT_MS", env, 1000, 20000, 8000), retrievalMinRecall: 0.8,
      jobMaxAttempts: integer("JOB_MAX_ATTEMPTS", env, 1, 10, 5),
      queryRateLimit: integer("QUERY_RATE_LIMIT_PER_HOUR", env, 1, 1000, 60),
      allowMigration: env.ALLOW_SCHEMA_MIGRATION === "1", legacyEnabled: false,
    };
  }
  const publicKey = Buffer.from(
      required("AUTH_PUBLIC_KEY_BASE64", env),
      "base64",
    ).toString("utf8");
  if (!publicKey.includes("BEGIN PUBLIC KEY"))
    throw new Error("AUTH_PUBLIC_KEY_BASE64 must contain an RS256 public key");
  const webhookSecret = required("CONNECTOR_WEBHOOK_SECRET", env),
    clientSecret = required("OIDC_CLIENT_SECRET", env);
  if (webhookSecret.length < 32)
    throw new Error("CONNECTOR_WEBHOOK_SECRET must be at least 32 characters");
  if (clientSecret.length < 16)
    throw new Error("OIDC_CLIENT_SECRET must be at least 16 characters");
  const origins = required("CORS_ORIGINS", env)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (production && origins.some((x) => x === "*"))
    throw new Error("Wildcard CORS is forbidden in production");
  const minRecall = Number(env.RETRIEVAL_MIN_RECALL ?? "0.8");
  if (!Number.isFinite(minRecall) || minRecall < 0 || minRecall > 1)
    throw new Error("RETRIEVAL_MIN_RECALL must be between 0 and 1");
  const config = {
    production,
    port: integer("PORT", env, 1, 65535, 3005),
    databaseUrl: required("DATABASE_URL", env),
    databaseSsl:
      env.DATABASE_SSL === "require" ? { rejectUnauthorized: true } : false,
    origins,
    oidcIssuer: https("OIDC_ISSUER", env),
    oidcAudience: required("OIDC_AUDIENCE", env),
    oidcAuthorizeUrl: https("OIDC_AUTHORIZE_URL", env),
    oidcTokenUrl: https("OIDC_TOKEN_URL", env),
    oidcClientId: required("OIDC_CLIENT_ID", env),
    oidcClientSecret: clientSecret,
    oidcRedirectUri: https("OIDC_REDIRECT_URI", env),
    publicKey,
    connectorGateway: {
      baseUrl: https("CONNECTOR_GATEWAY_BASE_URL", env),
      token: required("CONNECTOR_GATEWAY_TOKEN", env),
    },
    answerGateway: {
      baseUrl: https("ANSWER_GATEWAY_BASE_URL", env),
      token: required("ANSWER_GATEWAY_TOKEN", env),
    },
    webhookSecret,
    aiMaxCostCents: integer("AI_MAX_COST_CENTS", env, 1, 100, 5),
    aiTimeoutMs: integer("AI_TIMEOUT_MS", env, 1000, 20000, 8000),
    retrievalMinRecall: minRecall,
    jobMaxAttempts: integer("JOB_MAX_ATTEMPTS", env, 1, 10, 5),
    queryRateLimit: integer("QUERY_RATE_LIMIT_PER_HOUR", env, 1, 1000, 60),
    allowMigration: env.ALLOW_SCHEMA_MIGRATION === "1",
    legacyEnabled: !production && env.ENABLE_LEGACY_DEMOS === "1",
  };
  if (production && !config.databaseSsl)
    throw new Error("DATABASE_SSL=require is mandatory in production");
  return config;
}
module.exports = { loadConfig };
