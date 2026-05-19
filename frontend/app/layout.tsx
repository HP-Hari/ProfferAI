import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proffer AI — Enterprise Proposal Intelligence Platform',
  description: 'AI-powered RFP analysis, proposal drafting, and compliance risk detection.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <div className="ambient-glow" style={{ top: '-20%', left: '-10%' }} />
        <div className="ambient-glow" style={{ bottom: '-30%', right: '-15%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)' }} />
        {children}
      </body>
    </html>
  )
}