import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://saegim.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/private/',
          '/admin/',
          '/account/',
          '/profile/',
          '/notifications/',
          '/list/',
          '/calendar/',
          '/viewPost/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/landing', '/login', '/signup'],
        disallow: [
          '/api/',
          '/_next/',
          '/private/',
          '/admin/',
          '/account/',
          '/profile/',
          '/notifications/',
          '/list/',
          '/calendar/',
          '/viewPost/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
