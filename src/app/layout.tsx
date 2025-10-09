import type { Metadata } from 'next'
import { Merriweather_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

// const inter = Inter({ subsets: ['latin'] })

const merriweatherSans = Merriweather_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://cakravia.com'),
  title: 'Cakravia - Discover Your Learning Competencies',
  description: 'Cakravia is your dedicated platform for uncovering the learning competencies that define your success. Discover your strengths, understand your patterns, and unlock a more effective, fulfilling learning experience.',
  keywords: ['learning assessment', 'VARK test', 'learning style', 'AI knowledge', 'behavioral assessment', 'TPA test', 'learning competencies', 'educational assessment'],
  authors: [{ name: 'Cakravia' }],
  creator: 'Cakravia',
  publisher: 'Cakravia',
  openGraph: {
    title: 'Cakravia - Discover Your Learning Competencies',
    description: 'Cakravia is your dedicated platform for uncovering the learning competencies that define your success. Discover your strengths, understand your patterns, and unlock a more effective, fulfilling learning experience.',
    url: 'https://cakravia.com',
    siteName: 'Cakravia',
    images: [
      {
        url: '/logo_cakravia.jpg',
        width: 1472,
        height: 832,
        alt: 'Cakravia Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cakravia - Discover Your Learning Competencies',
    description: 'Cakravia is your dedicated platform for uncovering the learning competencies that define your success. Discover your strengths, understand your patterns, and unlock a more effective, fulfilling learning experience.',
    images: ['/logo_cakravia.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={merriweatherSans.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}