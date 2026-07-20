import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary" dir="rtl" role="alert">
          <span>حدث خطأ غير متوقع</span>
          <h1>تعذر عرض هذه الشاشة</h1>
          <p>بياناتك لم تتأثر. أعد تحميل التطبيق للمتابعة.</p>
          <button type="button" onClick={() => window.location.reload()}>
            إعادة تحميل التطبيق
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
