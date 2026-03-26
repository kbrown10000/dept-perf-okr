import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'USDM Dept Performance & OKRs',
  description: 'Department Performance & OKR Tracking Platform for USDM Life Sciences',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Nav />
          <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
            {children}
          </main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
