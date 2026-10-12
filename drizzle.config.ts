import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Konfigurasi Drizzle Kit.
 * DATABASE_URL dibaca dari environment (.env lokal / secret platform hosting),
 * sehingga kredensial tidak perlu di-hardcode di dalam repo.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app1_db",
  },
  verbose: true,
  strict: true,
});
