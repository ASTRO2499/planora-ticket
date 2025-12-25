import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'

export default function MyApp({ Component, pageProps }: AppProps) {
  const gpt5Enabled = process.env.NEXT_PUBLIC_ENABLE_GPT5 === 'true'
  return (
    <Layout>
      <Component {...pageProps} gpt5Enabled={gpt5Enabled} />
      <Analytics />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(3, 0, 20, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#00C2FF',
              secondary: '#1e3a8a',
            },
          },
        }}
      />
    </Layout>
  )
}
