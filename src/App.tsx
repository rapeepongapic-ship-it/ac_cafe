import { useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import { seedIfEmpty } from './utils/seedData'
import { ACCESS_TOKEN } from './config/token'
import TopNav from './components/TopNav'
import ReportScreen from './screens/ReportScreen'
import SalesScreen from './screens/SalesScreen'
import SettingsScreen from './screens/SettingsScreen'
import LoginScreen from './screens/LoginScreen'
import OnboardingScreen from './screens/OnboardingScreen'

type AuthState = 'checking' | 'unauthenticated' | 'onboarding' | 'ready'

export default function App() {
  const [page, setPage]           = useState(0)
  const [animDir, setAnimDir]     = useState<'right' | 'left' | null>(null)
  const [allowed, setAllowed]     = useState<boolean | null>(null)
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [user, setUser]           = useState<User | null>(null)
  const prevPage                  = useRef(0)
  const { loadData, reset }       = useStore()

  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
    setAllowed(path === ACCESS_TOKEN)
  }, [])

  useEffect(() => {
    if (!allowed) return

    const initAuth = async (u: User | null) => {
      if (!u) { reset(); setAuthState('unauthenticated'); return }
      setUser(u)
      const { data: profile } = await supabase
        .from('profiles').select('shop_name').eq('id', u.id).single()
      if (!profile?.shop_name) { setAuthState('onboarding'); return }
      await loadData(u.id, profile.shop_name)
      await seedIfEmpty(u.id)
      setAuthState('ready')
      logAudit(u.id)
    }

    supabase.auth.getSession().then(({ data: { session } }) => initAuth(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      initAuth(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [allowed])

  const navigate = (newPage: number) => {
    setAnimDir(newPage > prevPage.current ? 'right' : 'left')
    prevPage.current = newPage
    setPage(newPage)
  }

  if (allowed === null || authState === 'checking') return null

  if (!allowed) return <NotFound />

  if (authState === 'unauthenticated') return <LoginScreen />

  if (authState === 'onboarding' && user) {
    return (
      <OnboardingScreen
        userId={user.id}
        onDone={async (shopName) => {
          await loadData(user.id, shopName)
          await seedIfEmpty(user.id)
          setAuthState('ready')
          logAudit(user.id)
        }}
      />
    )
  }

  return (
    <div className="min-h-[100dvh] bg-cafe-bg flex justify-center">
      <Analytics />
      <div className="w-full min-h-[100dvh] bg-cafe-bg flex flex-col">
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

function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-cafe-bg flex items-center justify-center p-8">
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

async function logAudit(userId: string) {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const { ip } = await res.json()
    await supabase.from('audit_logs').insert({
      user_id: userId,
      ip_address: ip,
      user_agent: navigator.userAgent,
    })
  } catch { /* silent */ }
}
