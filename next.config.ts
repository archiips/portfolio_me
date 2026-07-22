import type { NextConfig } from "next";

// GitHub Pages serves the site from a repo subpath (/portfolio_me) and can only
// host static files. These overrides are applied ONLY when GITHUB_PAGES=true,
// which is set exclusively in the GitHub Actions workflow. Vercel never sets it,
// so the Vercel build stays byte-for-byte identical to before.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = "/portfolio_me";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(isGithubPages && {
    output: "export",
    basePath,
    assetPrefix: basePath,
    images: { unoptimized: true },
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
  }),
};

export default nextConfig;
