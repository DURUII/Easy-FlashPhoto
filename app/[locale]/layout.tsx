import type { Metadata } from 'next'
import '../globals.css'
import { defaultLocale, locales, type Locale } from '../../i18n'

const siteName = 'FLASHPHOTO / IMAGEGLITCH'
const siteDescription =
  'Flashphoto is an online glitch art video generator: photo to video, electro-cutout flicker, AI segmentation for TikTok/Instagram/Xiaohongshu.'

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) return envUrl
  return 'https://flashphoto.vercel.app'
}

const localizedMeta: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: siteName,
    description: siteDescription,
    keywords: [
      'flashphoto',
      'imageglitch',
      'glitch art video',
      'photo to video',
      'glitch video generator',
      'electro cutout',
      'flicker effect',
      'ai segmentation',
      'sam segmentation',
      'tiktok video effect',
      'instagram glitch',
    ],
  },
  'zh-CN': {
    title: 'FLASHPHOTO / IMAGEGLITCH',
    description:
      'Flashphoto 是在线故障艺术视频生成器：图片转视频、照片通电与闪烁、AI 主体分割，适配抖音、小红书、Instagram。',
    keywords: [
      'flashphoto',
      'imageglitch',
      '故障艺术',
      '照片通电',
      '照片闪烁',
      'glitch 视频',
      '在线抠图',
      'AI 分割',
      'SAM 分割',
    ],
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Metadata {
  const locale = locales.includes(params.locale) ? params.locale : defaultLocale
  const meta = localizedMeta[locale]
  const baseUrl = getBaseUrl()

  return {
    metadataBase: new URL(baseUrl),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        'zh-CN': '/zh-CN',
      },
    },
    openGraph: {
      type: 'website',
      url: `/${locale}`,
      title: meta.title,
      description: meta.description,
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  }
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  const locale = locales.includes(params.locale) ? params.locale : defaultLocale

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  )
}
