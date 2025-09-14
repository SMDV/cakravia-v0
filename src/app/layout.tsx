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
  title: 'Cakravia - Learning Style Assessment',
  description: 'Discover your learning preferences with VARK assessment',
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