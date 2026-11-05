
import { useState } from 'react'
import { supabase } from './supabase'
import './login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        if (!email.trim() || !password) {
            setMessage('Please enter your email and password.')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            })

            if (error) {
                setMessage(error.message)
            } else {
                setMessage('Login successful!')
            }
        } catch {
            setMessage('Unable to login. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    async function handleSignup() {
        if (!email.trim() || !password) {
            setMessage('Please enter your email and password.')
            return
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters.')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            })

            if (error) {
                setMessage(error.message)
            } else if (data.session) {
                setMessage('Account created successfully!')
            } else {
                setMessage(
                    'Account created! Please check your email for confirmation.'
                )
            }
        } catch {
            setMessage('Unable to sign up. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">B</div>

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
                    <label htmlFor="login-email">Email address</label>

                    <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="login-password">Password</label>

                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : 'Login'}
                    </button>

                    <button
                        type="button"
                        className="signup-button"
                        onClick={() => void handleSignup()}
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : 'Create Account'}
                    </button>
                </form>

                {message && (
                    <div className="login-message" role="status">
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
