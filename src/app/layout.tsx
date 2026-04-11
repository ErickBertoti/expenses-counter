import type { Metadata } from "next"
import { IBM_Plex_Mono, Manrope } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Contador de Despesas",
  description: "Acompanhe compras parceladas do cartão e veja os totais de cada mês.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
