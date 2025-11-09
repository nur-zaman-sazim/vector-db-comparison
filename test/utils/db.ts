import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

/**
 * @description
 * Truncates database tables with deadlock prevention mechanisms:
 * 1. Uses advisory locks to ensure only one truncation happens at a time
 * 2. Sorts tables to ensure consistent locking order
 * 3. Implements retry logic for resilience
 */
export const truncateTables = async (
  dbService: EntityManager<IDatabaseDriver<Connection>>,
  excludeTables: string[] = [],
): Promise<void> => {
  const dbConnection = dbService.getConnection();

  try {
    await dbConnection.execute("SELECT pg_advisory_lock(1234)");

    const excludeClause = excludeTables.length
      ? `AND table_name NOT IN (${excludeTables.map((table) => `'${table}'`).join(",")})`
      : "";

    const tableNames: Array<{ table_name: string }> = await dbConnection.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != 'mikro_orm_migrations' ${excludeClause};`,
    );

    if (tableNames.length === 0) {
      return;
    }

    tableNames.sort((a, b) => a.table_name.localeCompare(b.table_name));
    const tableList = tableNames.map((tableNameObj) => `"${tableNameObj.table_name}"`).join(", ");

    let retries = 3;
    let success = false;
    let lastError;

    while (!success && retries > 0) {
      try {
        await dbConnection.execute(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
        success = true;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 100 * (4 - retries)));
      }
    }

    if (!success) {
      console.error("Failed to truncate tables after multiple attempts:", lastError);
      throw lastError;
    }
  } finally {
    await dbConnection.execute("SELECT pg_advisory_unlock(1234)");
  }
};
