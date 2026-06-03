/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages (engine + agents) directly from source.
  transpilePackages: ["@sv/engine", "@sv/agents"],
};

export default nextConfig;
