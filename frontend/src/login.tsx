import { useState, useRef } from 'react'
import { supabase } from './supabase'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import './login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [captchaToken, setCaptchaToken] = useState('')
    const turnstileRef = useRef<TurnstileInstance>(null)

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()

    function resetCaptcha() {
        setCaptchaToken('')
        try {
            turnstileRef.current?.reset()
        } catch {
            // Widget not mounted or already reset
        }
    }

    async function handleLogin() {
        if (loading) return

        if (!email.trim() || !password) {
            setMessage('Please enter your email and password.')
            return
        }

        if (!siteKey) {
            setMessage('CAPTCHA site key is missing. Please add VITE_TURNSTILE_SITE_KEY to environment variables.')
            return
        }

        // Get the latest fresh token from the Turnstile widget directly or state
        const activeToken = (turnstileRef.current?.getResponse() || captchaToken)?.trim()

        if (!activeToken) {
            setMessage('Please complete the CAPTCHA.')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const { error } =
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                    options: {
                        captchaToken: activeToken,
                    },
                })

            if (error) {
                setMessage(error.message)
                // Single-use Turnstile token consumed; reset widget for next attempt
                resetCaptcha()
            } else {
                setMessage('Login successful!')
            }
        } catch {
            setMessage('Unable to login. Please try again.')
            resetCaptcha()
        } finally {
            setLoading(false)
        }
    }

    async function handleSignup() {
        if (loading) return

        if (!email.trim() || !password) {
            setMessage('Please enter your email and password.')
            return
        }

        if (!siteKey) {
            setMessage('CAPTCHA site key is missing. Please add VITE_TURNSTILE_SITE_KEY to environment variables.')
            return
        }

        const activeToken = (turnstileRef.current?.getResponse() || captchaToken)?.trim()

        if (!activeToken) {
            setMessage('Please complete the CAPTCHA.')
            return
        }

        if (password.length < 6) {
            setMessage(
                'Password must be at least 6 characters.'
            )
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const { data, error } =
                await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        captchaToken: activeToken,
                    },
                })

            if (error) {
                setMessage(error.message)
                resetCaptcha()
            } else if (data.session) {
                setMessage('Account created successfully!')
            } else {
                setMessage(
                    'Account created! Please check your email for confirmation.'
                )
            }
        } catch {
            setMessage('Unable to sign up. Please try again.')
            resetCaptcha()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        B
                    </div>

                    <h1>
                        BharatTrade <span>AI</span>
                    </h1>
                </div>

                <p className="login-subtitle">
                    Your Indian financial markets dashboard
                </p>

                <div className="login-heading">
                    <h2>Welcome</h2>
                    <p>Sign in or create your account</p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        void handleLogin()
                    }}
                >
                    <label htmlFor="login-email">
                        Email address
                    </label>

                    <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                        }}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="login-password">
                        Password
                    </label>

                    <div className="password-input-wrapper">
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                            }}
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                    <line x1="2" x2="22" y1="2" y2="22" />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div
                        style={{
                            minHeight: '65px',
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '16px',
                        }}
                    >
                        {!siteKey ? (
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#f87171',
                                    padding: '8px 12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    textAlign: 'center',
                                    width: '100%',
                                }}
                            >
                                Missing <code>VITE_TURNSTILE_SITE_KEY</code> in environment variables.
                            </div>
                        ) : (
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={siteKey}
                                options={{
                                    theme: 'dark',
                                    refreshExpired: 'auto',
                                }}
                                onSuccess={(token) => {
                                    setCaptchaToken(token)
                                    setMessage('')
                                }}
                                onExpire={() => {
                                    resetCaptcha()
                                    setMessage('CAPTCHA expired. Please complete it again.')
                                }}
                                onError={(error) => {
                                    console.error('CAPTCHA error:', error, 'Hostname:', window.location.hostname, 'SiteKey:', siteKey)
                                    resetCaptcha()
                                    if (error === '110200') {
                                        setMessage(
                                            `CAPTCHA domain unauthorized (110200) for "${window.location.hostname}". Ensure this exact domain is listed in Cloudflare Turnstile for sitekey: ${siteKey}`
                                        )
                                    } else {
                                        setMessage('CAPTCHA failed to load. Please refresh.')
                                    }
                                }}
                            />
                        )}
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? 'Please wait...'
                            : 'Login'}
                    </button>

                    <button
                        type="button"
                        className="signup-button"
                        onClick={() => {
                            void handleSignup()
                        }}
                        disabled={loading}
                    >
                        {loading
                            ? 'Please wait...'
                            : 'Create Account'}
                    </button>
                </form>

                {message && (
                    <div
                        className="login-message"
                        role="status"
                    >
                        {message}
                    </div>
                )}

                <div className="login-footer">
                    <span className="login-footer-dot"></span>
                    Secure authentication powered by Supabase
                </div>
            </div>
        </div>
    )
}
