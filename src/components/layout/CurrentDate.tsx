import { CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const formatter = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function CurrentDate() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const label = useMemo(() => formatter.format(now), [now])
  return (
    <div className="topbar-date" aria-label={label}>
      <CalendarDays size={18} />
      <span>{label}</span>
    </div>
  )
}
