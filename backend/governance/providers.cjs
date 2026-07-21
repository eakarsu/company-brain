function adapter(name, settings, timeoutMs, fetchImpl) {
  return async (operation, payload, idempotencyKey) => {
    let response;
    try {
      response = await fetchImpl(
        `${settings.baseUrl.replace(/\/$/, "")}/${operation}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${settings.token}`,
            "content-type": "application/json",
            "idempotency-key": idempotencyKey,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeoutMs),
        },
      );
    } catch (cause) {
      throw Object.assign(
        new Error(`${name} network operation failed`, { cause }),
        { code: `${name.toUpperCase()}_NETWORK`, retryable: true },
      );
    }
    if (!response.ok)
      throw Object.assign(new Error(`${name} returned ${response.status}`), {
        code: `${name.toUpperCase()}_${response.status}`,
        retryable: response.status === 429 || response.status >= 500,
      });
    try {
      return await response.json();
    } catch (cause) {
      throw Object.assign(
        new Error(`${name} returned invalid JSON`, { cause }),
        { code: `${name.toUpperCase()}_JSON`, retryable: false },
      );
    }
  };
}
function createProviders(config, fetchImpl = fetch) {
  return {
    connector: adapter(
      "connector",
      config.connectorGateway,
      config.aiTimeoutMs,
      fetchImpl,
    ),
    answer: adapter(
      "answer",
      config.answerGateway,
      config.aiTimeoutMs,
      fetchImpl,
    ),
  };
}
module.exports = { createProviders };
