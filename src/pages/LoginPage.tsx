import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(username, password);
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {/* Subtle background accent */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
                />
            </div>

            <div className="animate-scale-in relative w-full max-w-sm">
                {/* Card */}
                <div
                    className="p-8 rounded-2xl border"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="p-3 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, #0d9488, #059669)',
                                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
                            }}
                        >
                            <Users className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        Gym Manager
                    </h1>
                    <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                        Sign in to manage memberships
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                    placeholder="Enter password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                className="p-3 rounded-lg text-sm flex items-center gap-2"
                                style={{
                                    backgroundColor: 'var(--danger-bg)',
                                    color: 'var(--danger)',
                                    border: '1px solid rgba(220,38,38,0.2)',
                                }}
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-150 disabled:opacity-60 active:scale-[0.98]"
                            style={{
                                backgroundColor: 'var(--accent)',
                                boxShadow: '0 1px 3px rgba(13,148,136,0.3)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer text */}
                <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                    Gym Manager &mdash; Membership Management System
                </p>
            </div>
        </div>
    );
}
