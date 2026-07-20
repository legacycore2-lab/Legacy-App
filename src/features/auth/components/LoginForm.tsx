import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'

export function LoginForm() {
  const login = useLogin()

  return (
    <form className="login-form" onSubmit={login.submit} noValidate>
      <div className="login-form__field">
        <label htmlFor="login-email">البريد الإلكتروني</label>
        <div className="login-form__control">
          <Mail size={19} aria-hidden="true" />
          <input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="name@company.com"
            value={login.email}
            onChange={(event) => login.setEmail(event.target.value)}
            disabled={login.isSubmitting}
          />
        </div>
      </div>

      <div className="login-form__field">
        <label htmlFor="login-password">كلمة المرور</label>
        <div className="login-form__control">
          <LockKeyhole size={19} aria-hidden="true" />
          <input
            id="login-password"
            name="password"
            type={login.showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            dir="ltr"
            placeholder="••••••••"
            value={login.password}
            onChange={(event) => login.setPassword(event.target.value)}
            disabled={login.isSubmitting}
          />
          <button
            className="login-form__reveal"
            type="button"
            onClick={login.togglePassword}
            aria-label={login.showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {login.showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>

      <div className="login-form__options">
        <label className="login-form__remember">
          <input
            type="checkbox"
            checked={login.remember}
            onChange={(event) => login.setRemember(event.target.checked)}
          />
          <span>تذكرني</span>
        </label>
        <span className="login-form__help" title="تواصل مع مسؤول النظام لإعادة تعيين كلمة المرور">
          نسيت كلمة المرور؟
        </span>
      </div>

      {login.error && (
        <div className="login-form__error" role="alert">
          {login.error}
        </div>
      )}

      <button className="login-form__submit" type="submit" disabled={login.isSubmitting}>
        <span>{login.isSubmitting ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
        {login.isSubmitting ? <span className="login-form__spinner" /> : <ArrowLeft size={20} />}
      </button>

      <div className="login-form__security">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>اتصال مشفّر وآمن</span>
      </div>
    </form>
  )
}
