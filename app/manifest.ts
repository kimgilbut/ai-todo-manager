import { MetadataRoute } from 'next'

/**
 * PWA 매니페스트 파일 생성
 * Next.js 15에서 자동으로 /manifest.json 경로에 제공됩니다
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI 할 일 관리 서비스',
    short_name: 'AI Todo',
    description: 'AI가 도와주는 똑똑한 할 일 관리 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['productivity', 'utilities'],
    lang: 'ko',
    orientation: 'portrait-primary',
  }
}
