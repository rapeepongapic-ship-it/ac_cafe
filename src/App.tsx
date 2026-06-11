import { useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import TopNav from './components/TopNav'
import ReportScreen from './screens/ReportScreen'
import SalesScreen from './screens/SalesScreen'
import SettingsScreen from './screens/SettingsScreen'
import { ACCESS_TOKEN } from './config/token'
import { seedIfEmpty } from './utils/seedData'

seedIfEmpty()

export default function App() {
  const [page, setPage]       = useState(0)
  const [animDir, setAnimDir] = useState<'right' | 'left' | null>(null)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const prevPage              = useRef(0)

  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
    setAllowed(path === ACCESS_TOKEN)
  }, [])

  const navigate = (newPage: number) => {
    setAnimDir(newPage > prevPage.current ? 'right' : 'left')
    prevPage.current = newPage
    setPage(newPage)
  }

  if (allowed === null) return null

  if (!allowed) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-cafe-card border border-cafe-border rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl font-bold text-cafe-muted">404</span>
          </div>
          <h1 className="text-xl font-bold text-cafe-text mb-2">ไม่พบหน้านี้</h1>
          <p className="text-cafe-muted text-sm">กรุณาใช้ลิงก์ที่ถูกต้อง</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cafe-brown flex justify-center">
      <Analytics />
      <div className="w-full max-w-[430px] min-h-screen bg-cafe-bg flex flex-col shadow-2xl">
        <TopNav page={page} onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div
            key={page}
            className={animDir === 'right' ? 'page-enter-right' : animDir === 'left' ? 'page-enter-left' : ''}
          >
            {page === 0 && <ReportScreen />}
            {page === 1 && <SalesScreen onNavigate={navigate} />}
            {page === 2 && <SettingsScreen />}
          </div>
        </main>
      </div>
    </div>
  )
}
