import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "build");

const copyTargets = ["index.html", "assets", "src", "data"];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const target of copyTargets) {
  fs.cpSync(path.join(root, target), path.join(outputDir, target), {
    recursive: true
  });
}

console.log(`Built static site in ${path.relative(root, outputDir)}`);
