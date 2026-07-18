import fs from "fs";
import path from "path";

function readEnvLocalFile() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    return fs.readFileSync(envPath, "utf8");
  } catch {
    return null;
  }
}

export function getEnvFromLocalFile(name: string) {
  const envContent = readEnvLocalFile();
  if (!envContent) {
    return process.env[name];
  }

  for (const line of envContent.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === name) {
      return value;
    }
  }

  return process.env[name];
}

export function getGroqApiKey() {
  return getEnvFromLocalFile("GROQ_API_KEY");
}
