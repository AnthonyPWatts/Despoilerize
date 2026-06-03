import { copyFileSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";

mkdirSync("dist", { recursive: true });
copyFileSync("manifest.json", join("dist", "manifest.json"));
cpSync("public", join("dist", "public"), { recursive: true });
