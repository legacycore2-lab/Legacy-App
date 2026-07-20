import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled page render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="page-error-boundary" role="alert">
          <span>تعذر عرض الصفحة</span>
          <h1>حدث خطأ داخل هذه الشاشة</h1>
          <p>باقي النظام ما زال يعمل، وبياناتك لم تتأثر.</p>
          <div>
            <button type="button" onClick={() => this.setState({ hasError: false })}>
              إعادة المحاولة
            </button>
            <a href="#/">العودة للوحة التحكم</a>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}
