import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SpeedInsights } from "@vercel/speed-insights/next"

// Web3関連のエラーを防ぐためのパッチ
if (typeof window !== 'undefined' && !window.ethereum) {
  window.ethereum = {
    selectedAddress: undefined,
    isMetaMask: false,
    request: () => Promise.reject(new Error('MetaMask not found')),
    on: () => {},
    removeListener: () => {}
  };
}

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  )
}

export default App