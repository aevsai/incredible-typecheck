#!/usr/bin/env node

import { execa } from "execa";
import chalk from "chalk";
import path from "path";
import { existsSync } from "fs";
import chokidar from "chokidar";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_DIR = path.resolve(__dirname, "images");

// Threshold-based images for increasing errors
const IMAGE_THRESHOLDS: { limit: number; image: string }[] = [
  { limit: 0, image: "ok.webp" }, // No errors
  { limit: 3, image: "woops.webp" }, // Few errors
  { limit: 7, image: "thats bad.webp" }, // More errors
  { limit: Infinity, image: "help pls.webp" }, // Too many errors
];

// Different images for improvements
const CONGRATS_IMAGES: { limit: number; image: string }[] = [
  { limit: 1, image: "nice.webp" }, // Small improvement
  { limit: 5, image: "well done.webp" }, // Medium improvement
  { limit: Infinity, image: "legend.webp" }, // Huge improvement
];

let lastErrorCount: number | null = null;
async function getErrorCount(): Promise<number> {
  try {
    const { stdout } = await execa("tsc", ["--noEmit"], {
      cwd: process.cwd(),
      reject: false,
    });
    const match = stdout.match(/error TS\d+: /g);
    return match ? match.length : 0;
  } catch (error) {
    console.error(chalk.red("Error running TypeScript compiler"));
    return 0;
  }
}

async function displayImage(imageFile: string) {
  const imagePath = path.join(IMAGE_DIR, imageFile);
  if (!existsSync(imagePath)) {
    console.error(chalk.red(`Image not found: ${imagePath}`));
    return;
  }
  console.clear();
  console.log(chalk.blue(`Displaying image: ${imageFile}`));
  console.log(chalk.blue(`Directory: ${process.cwd()}`));
  await execa("viu", [imagePath], { stdio: "inherit" });
}

async function runTypeCheck() {
  const currentErrors = await getErrorCount();
  console.log(chalk.yellow(`Current errors: ${currentErrors}`));

  if (lastErrorCount !== null) {
    const errorDiff = lastErrorCount - currentErrors;

    if (errorDiff > 0) {
      console.log(chalk.green(`Errors decreased by ${errorDiff}! 🎉`));
      const congratsImage =
        CONGRATS_IMAGES.find((t) => errorDiff <= t.limit)?.image ||
        "congrats_big.png";
      await displayImage(congratsImage);
    } else if (currentErrors > lastErrorCount) {
      console.log(chalk.red("New errors detected! ❌"));
    }
  }

  lastErrorCount = currentErrors;

  // Select the appropriate image for the current error count
  const selectedImage =
    IMAGE_THRESHOLDS.find((t) => currentErrors <= t.limit)?.image ||
    "error.png";
  await displayImage(selectedImage);
}

async function watchFiles() {
  console.log(chalk.blue("Watching for file changes...", process.cwd()));

  chokidar.watch("src").on("change", async (filePath) => {
    console.log(chalk.cyan(`File changed: ${filePath}`));
    await runTypeCheck();
  });

  await runTypeCheck();
}

watchFiles().catch((err) => console.error(chalk.red(err)));
