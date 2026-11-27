import { PrismaClient } from "@prisma/client";
import { loadRootEnvFile } from "./load-env";

loadRootEnvFile();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    console.log("Testing connection to PostgreSQL database...");
    await prisma.$connect();
    // Run a lightweight query to prove database responsiveness
    const result = await prisma.$queryRaw`SELECT 1 as connected, current_database() as db_name, version() as pg_version`;
    console.log("SUCCESS: Connected to PostgreSQL database successfully!");
    console.log("Database info:", result);
    process.exit(0);
  } catch (error: any) {
    console.error("FAILED: Could not connect to PostgreSQL database.");
    console.error("Error details:", error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
