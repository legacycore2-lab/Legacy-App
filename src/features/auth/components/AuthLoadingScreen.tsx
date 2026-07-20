export function AuthLoadingScreen() {
  return (
    <div className="auth-loading" dir="rtl" role="status" aria-label="جاري التحقق من الجلسة">
      <span className="auth-loading__mark">LC</span>
      <span className="auth-loading__spinner" />
    </div>
  )
}
