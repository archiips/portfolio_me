import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Prefixes a public asset path with the base path (e.g. "/portfolio_me" on
// GitHub Pages, "" everywhere else). Next.js only auto-prefixes basePath for
// <Link>/<Image>, so plain <img>, CSS url(), and window.open need this helper.
export function assetPath(path: string) {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    return `${base}${path}`
}
