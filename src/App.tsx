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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )

  const toggleSidebar = () => setSidebarCollapsed(v => {
    localStorage.setItem('sidebar-collapsed', String(!v))
    return !v
  })

  return (
    <div className="min-h-[100dvh] bg-cafe-bg">
      <Analytics />
      <div className="flex min-h-[100dvh]">
        <DesktopSidebar page={page} onNavigate={navigate} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
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

function DesktopSidebar({ page, onNavigate, collapsed, onToggle }: {
  page: number
  onNavigate: (page: number) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const { shopName, reset } = useStore()

  const handleSignOut = async () => {
    if (!confirm('ออกจากระบบ?')) return
    reset()
    await supabase.auth.signOut()
  }

  return (
    <aside className={`hidden lg:flex flex-col bg-cafe-card border-r border-cafe-border shrink-0 sticky top-0 h-screen transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-56 xl:w-64'}`}>

      {/* Brand + toggle */}
      <div className={`flex items-center border-b border-cafe-border h-[60px] shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-cafe-accent rounded-lg flex items-center justify-center shrink-0">
                <Coffee size={14} className="text-white" />
              </div>
              <span className="text-base font-black text-cafe-text tracking-tight">Salejo</span>
            </div>
            {shopName && <p className="text-[10px] text-cafe-muted mt-0.5 truncate pl-[36px]">{shopName}</p>}
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
          className={`flex items-center justify-center w-8 h-8 rounded-lg text-cafe-muted hover:text-cafe-text hover:bg-cafe-section transition-colors cursor-pointer shrink-0 ${collapsed ? '' : 'ml-auto'}`}
        >
          {collapsed
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 19l7-7-7-7"/><path d="M4 12h16" opacity=".4"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5l-7 7 7 7"/><path d="M4 12h16" opacity=".4"/></svg>
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
        {NAV_TABS.map((tab, i) => {
          const Icon = tab.icon
          const active = page === i
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              title={collapsed ? tab.label : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                active
                  ? 'bg-cafe-accent text-white shadow-sm'
                  : 'text-cafe-muted hover:text-cafe-text hover:bg-cafe-section'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {!collapsed && tab.label}
            </button>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-cafe-border">
        <button
          onClick={handleSignOut}
          title={collapsed ? 'ออกจากระบบ' : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer ${
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <LogOut size={16} />
          {!collapsed && 'ออกจากระบบ'}
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
