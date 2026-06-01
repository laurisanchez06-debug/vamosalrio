import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://vamosalrio.com", lastModified: new Date() },
    { url: "https://vamosalrio.com/registro", lastModified: new Date() },
    { url: "https://vamosalrio.com/login", lastModified: new Date() },
    { url: "https://vamosalrio.com/feed", lastModified: new Date() },
  ];
}
