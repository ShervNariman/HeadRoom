import "dotenv/config";
import { runMigrations } from "@/lib/db/migrations";

const result = await runMigrations();

console.log(
  JSON.stringify(
    {
      applied: result.applied,
      alreadyApplied: result.alreadyApplied,
    },
    null,
    2,
  ),
);
