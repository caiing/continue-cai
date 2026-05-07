const { fork } = require("child_process");
const fs = require("fs");
const path = require("path");

const { ProxyAgent } = require("undici");
const { rimrafSync } = require("rimraf");

const { execCmdSync } = require("../../../scripts/util");

/**
 * download a file using fetch API
 * @param {string} url
 * @param {string} outputPath
 */
async function downloadFile(url, outputPath) {
  // Use proxy if set in environment variables
  const proxy = process.env.https_proxy || process.env.HTTPS_PROXY;
  const agent = proxy ? new ProxyAgent(proxy) : undefined;

  const response = await fetch(url, {
    redirect: "follow", // Automatically follow redirects
    dispatcher: agent,
  });

  if (!response.ok) {
    throw new Error(`Failed to download file, status code: ${response.status}`);
  }

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get the response as an array buffer and write it to the file
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

/**
 *
 * @param {string} target platform specific target
 * @param {string} targetDir the directory to download into
 */
async function downloadSqlite(target, targetDir) {
  const downloadUrl =
    // node-sqlite3 doesn't have a pre-built binary for win32-arm64
    target === "win32-arm64"
      ? "https://continue-server-binaries.s3.us-west-1.amazonaws.com/win32-arm64/node_sqlite3.tar.gz"
      : `https://github.com/TryGhost/node-sqlite3/releases/download/v5.1.7/sqlite3-v5.1.7-napi-v6-${
          target
        }.tar.gz`;
  
  try {
    await downloadFile(downloadUrl, targetDir);
  } catch (error) {
    console.warn(`[warn] downloadSqlite failed: ${error.message}`);
    console.log("[info] Trying to copy from vscode/files directory...");
    
    // Extract filename from URL
    const filename = path.basename(downloadUrl);
    // Path to local files directory (vscode/files)
    const localFilesDir = path.join(__dirname, "..", "files");
    const localFilePath = path.join(localFilesDir, filename);
    
    if (fs.existsSync(localFilePath)) {
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(targetDir);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Copy file from local files directory
      fs.copyFileSync(localFilePath, targetDir);
      console.log(`[info] Copied sqlite3 binary from local files directory: ${localFilePath}`);
    } else {
      throw new Error(`Failed to download sqlite3 and no local copy found at ${localFilePath}`);
    }
  }
}

async function installAndCopySqlite(target) {
  // Replace the installed with pre-built
  console.log("[info] Downloading pre-built sqlite3 binary");
  rimrafSync("../../core/node_modules/sqlite3/build");
  await downloadSqlite(target, "../../core/node_modules/sqlite3/build.tar.gz");
  execCmdSync("cd ../../core/node_modules/sqlite3 && tar -xvzf build.tar.gz");
  fs.unlinkSync("../../core/node_modules/sqlite3/build.tar.gz");
}

async function installAndCopyEsbuild(target) {
  // Download and unzip esbuild
  console.log("[info] Downloading pre-built esbuild binary");
  rimrafSync("node_modules/@esbuild");
  fs.mkdirSync("node_modules/@esbuild", { recursive: true });
  
  const downloadUrl = `https://continue-server-binaries.s3.us-west-1.amazonaws.com/${target}/esbuild.zip`;
  const outputPath = "node_modules/@esbuild/esbuild.zip";
  
  try {
    await downloadFile(downloadUrl, outputPath);
  } catch (error) {
    console.warn(`[warn] installAndCopyEsbuild download failed: ${error.message}`);
    console.log("[info] Trying to copy from vscode/files directory...");
    
    // Path to local files directory (vscode/files/target/)
    const localFilesDir = path.join(__dirname, "..", "files", target);
    const localFilePath = path.join(localFilesDir, "esbuild.zip");
    
    if (fs.existsSync(localFilePath)) {
      // Copy file from local files directory
      fs.copyFileSync(localFilePath, outputPath);
      console.log(`[info] Copied esbuild binary from local files directory: ${localFilePath}`);
    } else {
      throw new Error(`Failed to download esbuild and no local copy found at ${localFilePath}`);
    }
  }
  
  execCmdSync("cd node_modules/@esbuild && unzip esbuild.zip");
  fs.unlinkSync("node_modules/@esbuild/esbuild.zip");
}

process.on("message", (msg) => {
  const { operation, target } = msg.payload;
  if (operation === "sqlite") {
    installAndCopySqlite(target)
      .then(() => process.send({ done: true }))
      .catch((error) => {
        console.error(error); // show the error in the parent process
        process.send({ error: true });
      });
  }
  if (operation === "esbuild") {
    installAndCopyEsbuild(target)
      .then(() => process.send({ done: true }))
      .catch((error) => {
        console.error(error); // show the error in the parent process
        process.send({ error: true });
      });
  }
});

/**
 * @param {string} target the platform to build for
 */
async function copySqlite(target) {
  const child = fork(__filename, { stdio: "inherit", cwd: process.cwd() });
  child.send({
    payload: {
      operation: "sqlite",
      target,
    },
  });

  return new Promise((resolve, reject) => {
    child.on("message", (msg) => {
      if (msg.error) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

/**
 * @param {string} target the platform to build for
 */
async function copyEsbuild(target) {
  const child = fork(__filename, { stdio: "inherit", cwd: process.cwd() });
  child.send({
    payload: {
      operation: "esbuild",
      target,
    },
  });

  return new Promise((resolve, reject) => {
    child.on("message", (msg) => {
      if (msg.error) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  downloadSqlite,
  copySqlite,
  copyEsbuild,
};
