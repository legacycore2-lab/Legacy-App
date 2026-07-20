import { LoginForm } from '../components/LoginForm'
import '../styles/login.css'

export function LoginPage() {
  return (
    <main className="login-page" dir="rtl">
      <section className="login-page__visual" aria-label="Legacy Core Construction ERP">
        <div className="login-page__visual-grid" aria-hidden="true" />
      </section>

      <section className="login-page__content">
        <div className="login-page__pattern" aria-hidden="true" />
        <div className="login-page__panel">
          <header className="login-brand">
            <div className="login-brand__mark" aria-hidden="true">
              <span>L</span>
              <span>C</span>
            </div>
            <strong>LEGACY CORE</strong>
            <div className="login-brand__subtitle">
              <i />
              <span>Construction ERP</span>
              <i />
            </div>
          </header>

          <div className="login-page__intro">
            <span>بوابتك لإدارة المشروعات</span>
            <i aria-hidden="true" />
            <h1>أهلاً بعودتك</h1>
            <p>سجّل الدخول لمتابعة أعمالك بأمان.</p>
          </div>

          <LoginForm />

          <footer className="login-page__footer">
            <i />
            <span>© 2026 Legacy Core</span>
            <i />
          </footer>
        </div>
      </section>
    </main>
  )
}
