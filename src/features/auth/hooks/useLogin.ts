import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { useAuth } from './useAuth'

type LoginLocationState = { from?: { pathname?: string } }

export function useLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.')
      return
    }

    setIsSubmitting(true)
    try {
      await signIn({ email: email.trim(), password, remember })
      const state = location.state as LoginLocationState | null
      navigate(state?.from?.pathname || '/', { replace: true })
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'تعذر تسجيل الدخول. حاول مرة أخرى.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    email,
    password,
    remember,
    showPassword,
    isSubmitting,
    error,
    setEmail,
    setPassword,
    setRemember,
    togglePassword: () => setShowPassword((visible) => !visible),
    submit,
  }
}
