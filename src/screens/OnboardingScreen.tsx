import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Coffee } from 'lucide-react'

interface Props {
  userId: string
  onDone: (shopName: string) => void
}

export default function OnboardingScreen({ userId, onDone }: Props) {
  const [shopName, setShopName] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    const name = shopName.trim()
    if (!name) return
    setLoading(true)
    await supabase.from('profiles').upsert({ id: userId, shop_name: name })
    onDone(name)
  }

  return (
    <div className="min-h-[100dvh] bg-cafe-bg flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-cafe-card border border-cafe-border rounded-2xl flex items-center justify-center shadow-md mb-6">
        <Coffee size={40} className="text-cafe-accent" />
      </div>
      <h1 className="text-2xl font-black text-cafe-text mb-1">ยินดีต้อนรับ!</h1>
      <p className="text-sm text-cafe-text-2 mb-1">ก่อนเริ่มต้น ตั้งชื่อร้านของคุณก่อนนะ</p>
      <p className="text-xs text-cafe-muted mb-8">ชื่อร้านจะแสดงในแอปและรายงานสรุป</p>

      <div className="w-full max-w-sm space-y-3">
        <input
          type="text"
          placeholder="ชื่อร้าน เช่น AC Café"
          value={shopName}
          onChange={e => setShopName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
          maxLength={40}
          className="w-full bg-cafe-card border border-cafe-border rounded-xl px-4 py-3.5 text-sm text-cafe-text outline-none focus:border-cafe-accent transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!shopName.trim() || loading}
          className="w-full bg-cafe-accent hover:bg-cafe-accent-dark text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : 'เริ่มต้นใช้งาน'}
        </button>
      </div>
    </div>
  )
}
