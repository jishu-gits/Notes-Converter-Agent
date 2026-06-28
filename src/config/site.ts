export const siteConfig = {
  name: "Remarker AI",
  description:
    "Convert lecture PDFs into structured markdown study notes with provider-flexible AI.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
