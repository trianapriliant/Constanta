import type { Metadata } from 'next'
import '@/app/globals.css'
import 'katex/dist/katex.min.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Constanta - Modern Classroom Platform',
  description: 'A clean, modern learning platform for teachers and students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
