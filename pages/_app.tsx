import '@/styles/globals.css'
import type { AppProps } from 'next/app'

// Web3関連のエラーを防ぐためのパッチ
if (typeof window !== 'undefined' && !window.ethereum) {
  window.ethereum = {
    selectedAddress: undefined,
    isMetaMask: false,
    request: () => Promise.reject(new Error('MetaMask is not available')),
    on: () => {},
    removeListener: () => {}
  };
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
