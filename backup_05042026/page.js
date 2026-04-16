'use client'

import dynamic from 'next/dynamic'

const App = dynamic(() => import('./client'), { ssr: false })

export default function Home() { return <App /> }