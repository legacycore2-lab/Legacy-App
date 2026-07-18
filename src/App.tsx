import { Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<PlaceholderPage title="المشاريع" description="ستُبنى شاشة المشاريع بعد اعتماد الداشبورد." />} />
        <Route path="/banks" element={<PlaceholderPage title="الخزنة والبنوك" description="إدارة الحسابات والتحويلات والحركات البنكية." />} />
        <Route path="/advances" element={<PlaceholderPage title="العهد" description="متابعة العهد المفتوحة والمصروف والمتبقي." />} />
        <Route path="/reports" element={<PlaceholderPage title="التقارير" description="التقارير المالية وتقارير المشاريع والمقاولين." />} />
        <Route path="/users" element={<PlaceholderPage title="المستخدمون" description="إدارة المستخدمين والصلاحيات." />} />
        <Route path="/settings" element={<PlaceholderPage title="الإعدادات" description="إعدادات النظام والهوية والتكاملات." />} />
      </Routes>
    </AppShell>
  )
}
