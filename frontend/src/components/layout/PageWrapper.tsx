import { ReactNode } from 'react'
import Navbar from './Navbar'

interface Props {
  children: ReactNode
  navTitle?: string
  maxWidth?: string
}

export default function PageWrapper({ children, navTitle, maxWidth = 'max-w-4xl' }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar title={navTitle} />
      <main className={`${maxWidth} mx-auto px-4 py-8`}>
        {children}
      </main>
    </div>
  )
}
