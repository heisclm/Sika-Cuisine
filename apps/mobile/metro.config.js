const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Monorepo directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch monorepo root (packages/shared, root node_modules)
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// 2. Resolve packages from mobile workspace first, then monorepo root
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
