const fs = require("node:fs");
const path = require("node:path");
const { loadConfig } = require("../governance/config.cjs");
const { createPool } = require("../governance/db.cjs");
async function main() {
  const command = process.argv[2] || "check",
    config = loadConfig(),
    pool = createPool(config);
  try {
    await pool.query("SELECT 1");
    if (command === "check") {
      const row = await pool.query(
        `SELECT to_regclass('public.brain_queries') AS queries`,
      );
      if (!row.rows[0].queries)
        throw new Error("Governed Company Brain schema is not migrated");
      console.log(
        "Configuration, database, and governed Company Brain schema check passed",
      );
      return;
    }
    if (command === "migrate") {
      if (!config.allowMigration)
        throw new Error("Refusing migration unless ALLOW_SCHEMA_MIGRATION=1");
      const directory = path.join(__dirname, "..", "db", "migrations");
      for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort())
        await pool.query(fs.readFileSync(path.join(directory, file), "utf8"));
      console.log("Governed Company Brain migrations applied");
      return;
    }
    throw new Error(`Unknown command: ${command}`);
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
