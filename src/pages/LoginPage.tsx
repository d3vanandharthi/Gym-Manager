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
            setError('Invalid credentials. Use admin/admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        }}>
            {/* Glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
                />
            </div>

            <div className="animate-scale-in relative w-full max-w-md">
                {/* Card */}
                <div className="backdrop-blur-xl p-8 rounded-3xl border" style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 100px rgba(99,102,241,0.1)',
                }}>
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-2xl" style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                        }}>
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-white mb-1">Gym Manager</h1>
                    <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>Sign in to manage memberships</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl outline-none transition-all text-white placeholder:text-white/30"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                placeholder="admin"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-all text-white placeholder:text-white/30"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    placeholder="admin"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'rgba(255,255,255,0.3)' }}
                                >
                                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{
                                backgroundColor: 'rgba(239,68,68,0.12)',
                                color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.2)',
                            }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'}
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
            </div>
        </div>
    );
}
