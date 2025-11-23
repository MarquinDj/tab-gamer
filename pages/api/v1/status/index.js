import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();
  const pgVersionResult = await database.query("SHOW server_version;");
  const pgVersionValue = pgVersionResult.rows[0].server_version;
  const pgMaxConResult = await database.query("SHOW max_connections");
  const pgMaxConValue = pgMaxConResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const openedConResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const openedConValue = openedConResult.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      version: pgVersionValue,
      max_connections: parseInt(pgMaxConValue),
      opened_connections: openedConValue,
    },
  });
}
