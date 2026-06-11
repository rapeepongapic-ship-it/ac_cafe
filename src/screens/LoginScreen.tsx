import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Coffee } from 'lucide-react'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    })
    if (error) { setMessage(error.message); setLoading(false) }
  }

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setMessage('')
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
    else if (mode === 'signup') setMessage('ตรวจสอบ email เพื่อยืนยันบัญชี')
  }

  return (
    <div className="min-h-[100dvh] bg-cafe-bg flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 bg-cafe-card border border-cafe-border rounded-2xl flex items-center justify-center shadow-md mb-4">
          <Coffee size={40} className="text-cafe-accent" />
        </div>
        <h1 className="text-3xl font-black text-cafe-text tracking-tight">Salejo</h1>
        <p className="text-sm text-cafe-muted mt-1">ระบบคำนวณยอดขายร้านค้า</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-cafe-border rounded-xl py-3.5 font-semibold text-cafe-text shadow-sm hover:bg-cafe-section transition-colors disabled:opacity-60"
        >
          <GoogleIcon />
          เข้าสู่ระบบด้วย Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-cafe-border" />
          <span className="text-xs text-cafe-muted">หรือกรอก email</span>
          <div className="flex-1 h-px bg-cafe-border" />
        </div>

        {/* Email + password */}
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-cafe-card border border-cafe-border rounded-xl px-4 py-3 text-sm text-cafe-text outline-none focus:border-cafe-accent transition-colors"
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEmail()}
          className="w-full bg-cafe-card border border-cafe-border rounded-xl px-4 py-3 text-sm text-cafe-text outline-none focus:border-cafe-accent transition-colors"
        />

        <button
          onClick={handleEmail}
          disabled={loading || !email.trim() || !password.trim()}
          className="w-full bg-cafe-accent hover:bg-cafe-accent-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'กำลังโหลด...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครใช้งาน'}
        </button>

        {message && (
          <p className="text-center text-sm text-cafe-muted">{message}</p>
        )}

        <button
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setMessage('') }}
          className="w-full text-center text-sm text-cafe-muted py-1 hover:text-cafe-text-2 transition-colors"
        >
          {mode === 'login' ? 'ยังไม่มีบัญชี? สมัครใช้งาน' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
