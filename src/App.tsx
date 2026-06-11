import { useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import type { User } from '@supabase/supabase-js'
import { BarChart2, PenLine, ShoppingCart, Settings, Coffee, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import { seedIfEmpty } from './utils/seedData'
import { ACCESS_TOKEN } from './config/token'
import TopNav from './components/TopNav'
import ReportScreen from './screens/ReportScreen'
import SalesScreen from './screens/SalesScreen'
import ExpenseScreen from './screens/ExpenseScreen'
import SettingsScreen from './screens/SettingsScreen'
import LoginScreen from './screens/LoginScreen'
import OnboardingScreen from './screens/OnboardingScreen'

const NAV_TABS = [
  { icon: BarChart2,    label: 'รายงาน' },
  { icon: PenLine,      label: 'บันทึกขาย' },
  { icon: ShoppingCart, label: 'รายจ่าย' },
  { icon: Settings,     label: 'ตั้งค่า' },
]

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

    const initAuth = async (u: User | null, doAudit = false) => {
      if (!u) { reset(); setAuthState('unauthenticated'); return }
      setUser(u)
      const { data: profile } = await supabase
        .from('profiles').select('shop_name').eq('id', u.id).single()
      if (!profile?.shop_name) { setAuthState('onboarding'); return }
      await loadData(u.id, profile.shop_name)
      await seedIfEmpty(u.id)
      setAuthState('ready')
      if (doAudit) logAudit(u.id)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        reset()
        setAuthState('unauthenticated')
        return
      }
      initAuth(session?.user ?? null, event === 'SIGNED_IN')
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
    <div className="min-h-[100dvh] bg-cafe-bg">
      <Analytics />
      <div className="flex min-h-[100dvh]">
        <DesktopSidebar page={page} onNavigate={navigate} />
        <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
          <TopNav page={page} onNavigate={navigate} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div
              key={page}
              className={animDir === 'right' ? 'page-enter-right' : animDir === 'left' ? 'page-enter-left' : ''}
            >
              {page === 0 && <ReportScreen />}
              {page === 1 && <SalesScreen onNavigate={navigate} />}
              {page === 2 && <ExpenseScreen />}
              {page === 3 && <SettingsScreen />}
            </div>
          </main>
        </div>
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

function DesktopSidebar({ page, onNavigate }: { page: number; onNavigate: (page: number) => void }) {
  const { shopName, reset } = useStore()

  const handleSignOut = async () => {
    if (!confirm('ออกจากระบบ?')) return
    reset()
    await supabase.auth.signOut()
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-64 bg-cafe-card border-r border-cafe-border shrink-0 sticky top-0 h-screen">
      <div className="px-5 pt-6 pb-5 border-b border-cafe-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cafe-accent rounded-xl flex items-center justify-center shrink-0">
            <Coffee size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-cafe-text tracking-tight">Salejo</span>
        </div>
        {shopName && (
          <p className="text-[11px] text-cafe-muted mt-2 truncate pl-[42px]">{shopName}</p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_TABS.map((tab, i) => {
          const Icon = tab.icon
          const active = page === i
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-cafe-accent text-white shadow-sm'
                  : 'text-cafe-muted hover:text-cafe-text hover:bg-cafe-section'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-cafe-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
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
