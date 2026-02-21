import type { MetadataRoute } from 'next'
import { locales } from '../i18n'

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) return envUrl
  return 'https://flashphoto.vercel.app'
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const now = new Date()

  return locales.flatMap((locale) => ([
    {
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: locale === 'en' ? 1 : 0.9,
    },
    {
      url: `${baseUrl}/${locale}/flash-photo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: locale === 'en' ? 0.95 : 0.85,
    },
    {
      url: `${baseUrl}/${locale}/lidar`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: locale === 'en' ? 0.7 : 0.6,
    },
  ]))
}
