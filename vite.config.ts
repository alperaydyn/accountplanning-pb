import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "child_process";

// Get git info at build time
function getGitInfo() {
  try {
    const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    const commitTime = execSync("git log -1 --format=%ci").toString().trim();
    const commitMessage = execSync("git log -1 --format=%s").toString().trim();
    return { commitHash, commitTime, commitMessage };
  } catch {
    return { commitHash: "unknown", commitTime: "unknown", commitMessage: "unknown" };
  }
}

const gitInfo = getGitInfo();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(gitInfo.commitHash),
    __COMMIT_TIME__: JSON.stringify(gitInfo.commitTime),
    __COMMIT_MESSAGE__: JSON.stringify(gitInfo.commitMessage),
  },
}));
