// O tsc só compila .ts — arquivos como schema.sql não vão para dist/.
// Sem esta cópia, `node dist/db/migrate.js` quebra com ENOENT em produção.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

mkdirSync("dist/db", { recursive: true });
copyFileSync("src/db/schema.sql", "dist/db/schema.sql");
console.log("schema.sql copiado para dist/db/");

mkdirSync("dist/db/migrations", { recursive: true });
for (const file of readdirSync("src/db/migrations")) {
  if (file.endsWith(".sql") && !file.startsWith("_")) {
    copyFileSync(path.join("src/db/migrations", file), path.join("dist/db/migrations", file));
  }
}
console.log("migrations copiadas para dist/db/migrations/");
