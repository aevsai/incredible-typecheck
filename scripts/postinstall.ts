import { execa } from "execa";
import { createWriteStream } from "fs";
import { chmodSync } from "fs";
import path from "path";
import https from "https";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLATFORM_MAP: { [key: string]: string } = {
  darwin: "mac",
  linux: "linux",
  win32: "windows",
};

const VIU_VERSION = "1.5.0"; // Adjust if needed
const BASE_URL = `https://github.com/atanunq/viu/releases/download/v${VIU_VERSION}`;

async function downloadViu() {
  const platform = PLATFORM_MAP[os.platform()];
  if (!platform) {
    console.error("Unsupported platform for viu.");
    process.exit(1);
  }

  const fileName = platform === "windows" ? "viu.exe" : "viu";
  const url = `${BASE_URL}/viu-${platform}`;
  const filePath = path.join(__dirname, "..", "bin", fileName);

  console.log(`Downloading viu from ${url}...`);

  return new Promise<void>((resolve, reject) => {
    const file = createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          chmodSync(filePath, 0o755); // Make executable
          console.log(`viu downloaded to ${filePath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

downloadViu().catch((err) => {
  console.error("Failed to install viu:", err);
  process.exit(1);
});
