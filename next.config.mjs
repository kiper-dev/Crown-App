/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // instrumentation.ts starts the devnet indexer inside the server process
    // (one loop, no separate worker to babysit).
    instrumentationHook: true,
    // Native/server-only packages must not be bundled by webpack — loaded at
    // runtime from node_modules instead (libsql ships prebuilt .node binaries).
    serverComponentsExternalPackages: ["@libsql/client", "libsql"],
  },
  webpack: (config, { nextRuntime }) => {
    // Опциональная зависимость @metamask/sdk, не нужная в вебе (только RN).
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // instrumentation.ts is compiled for the edge runtime too, where node
    // builtins don't exist. Its server work (indexer, backup, DB) runs only
    // under the node runtime (NEXT_RUNTIME guard), so stub the builtins out of
    // the non-node bundle instead of letting the resolver fail on `fs`.
    if (nextRuntime !== "nodejs") {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, os: false, net: false, tls: false, crypto: false };
    }
    return config;
  },
};

export default nextConfig;
