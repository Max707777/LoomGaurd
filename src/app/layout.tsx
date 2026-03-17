import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'LoomGuard — EVM Bytecode Threat Intelligence',
  description:
    'Open-source intelligence tool that tracks malicious smart contract developers across blockchains using EVM bytecode stylometry.',
  keywords: ['web3', 'security', 'osint', 'smart contract', 'evm', 'blockchain'],
  openGraph: {
    title: 'LoomGuard',
    description: 'Track malicious smart contract developers via bytecode fingerprinting',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#080b12] antialiased">
        {children}
      </body>
    </html>
  )
}