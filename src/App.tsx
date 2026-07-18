import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function App() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <main className="app-shell" dir="rtl">
      <header className="topbar">
        <div>
          <span className="eyebrow">LEGACY CORE ERP</span>
          <h1>نظام إدارة أعمالك الجديد</h1>
        </div>
        <button className="theme-button" onClick={() => setDark((value) => !value)} aria-label="تغيير المظهر">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <section className="hero-card">
        <div className="logo-mark">LC</div>
        <p className="status">النسخة الأولى تعمل الآن</p>
        <h2>نبدأ بالداشبورد الخارجي، ثم نبني كل وحدة خطوة بخطوة.</h2>
        <p className="description">
          المشروع متصل بـ GitHub Pages، وأي تطوير جديد سيتم نشره تلقائيًا على نفس الرابط.
        </p>
        <div className="progress-row">
          <div><strong>01</strong><span>App Shell</span></div>
          <div><strong>02</strong><span>Dashboard</span></div>
          <div><strong>03</strong><span>Projects</span></div>
        </div>
      </section>
    </main>
  )
}
