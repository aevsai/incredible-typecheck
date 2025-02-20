import { execa } from "execa";
import path from "path";
import fs from "fs";
import os from "os";
import https from "https";

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
  const installPath = path.join(process.cwd(), "bin");
  const filePath = path.join(installPath, fileName);

  if (!fs.existsSync(installPath)) {
    fs.mkdirSync(installPath, { recursive: true });
  }

  const url = `${BASE_URL}/viu-${platform}`;
  console.log(`Downloading viu from ${url}...`);

  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          fs.chmodSync(filePath, 0o755);
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
