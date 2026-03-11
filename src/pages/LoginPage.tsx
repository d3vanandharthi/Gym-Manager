import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, AlertCircle, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

// ─── WebGL Smokey Background ─────────────────────────────────────────────────

const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    float time = iTime * 0.5;

    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }
    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

function SmokeyBackground({ color = "#0d9488", className = "" }: { color?: string; className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const hoveringRef = useRef(false);

    const hexToRgb = (hex: string): [number, number, number] => {
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        return [r, g, b];
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl");
        if (!gl) { console.error("WebGL not supported"); return; }

        const compileShader = (type: number, source: string): WebGLShader | null => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program linking error:", gl.getProgramInfoLog(program));
            return;
        }
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
        const iTimeLocation = gl.getUniformLocation(program, "iTime");
        const iMouseLocation = gl.getUniformLocation(program, "iMouse");
        const uColorLocation = gl.getUniformLocation(program, "u_color");

        const startTime = Date.now();
        const [r, g, b] = hexToRgb(color);
        gl.uniform3f(uColorLocation, r, g, b);

        let animId: number;
        const render = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);

            const currentTime = (Date.now() - startTime) / 1000;
            gl.uniform2f(iResolutionLocation, width, height);
            gl.uniform1f(iTimeLocation, currentTime);
            gl.uniform2f(
                iMouseLocation,
                hoveringRef.current ? mouseRef.current.x : width / 2,
                hoveringRef.current ? height - mouseRef.current.y : height / 2
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animId = requestAnimationFrame(render);
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        };
        const handleMouseEnter = () => { hoveringRef.current = true; };
        const handleMouseLeave = () => { hoveringRef.current = false; };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseenter", handleMouseEnter);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        render();

        return () => {
            cancelAnimationFrame(animId);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseenter", handleMouseEnter);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [color]);

    return (
        <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute inset-0 backdrop-blur-sm"></div>
        </div>
    );
}

// ─── Login Page ──────────────────────────────────────────────────────────────

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
        <main className="relative w-screen h-screen bg-gray-900 overflow-hidden">
            <SmokeyBackground className="absolute inset-0" color="#0d9488" />
            <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
                <div className="w-full max-w-sm p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl animate-scale-in">
                    {/* Logo */}
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div
                                className="p-3.5 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #0d9488, #059669)',
                                    boxShadow: '0 8px 32px rgba(13, 148, 136, 0.4)',
                                }}
                            >
                                <Users className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            Gym Manager
                        </h2>
                        <p className="mt-2 text-sm text-gray-300">Sign in to manage memberships</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Username Input with Animated Label */}
                        <div className="relative z-0">
                            <input
                                type="text"
                                id="floating_username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300/50 appearance-none focus:outline-none focus:ring-0 focus:border-teal-400 peer"
                                placeholder=" "
                                required
                            />
                            <label
                                htmlFor="floating_username"
                                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-teal-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                            >
                                <User className="inline-block mr-2 -mt-1" size={16} />
                                Username
                            </label>
                        </div>

                        {/* Password Input with Animated Label */}
                        <div className="relative z-0">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="floating_password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300/50 appearance-none focus:outline-none focus:ring-0 focus:border-teal-400 peer"
                                placeholder=" "
                                required
                            />
                            <label
                                htmlFor="floating_password"
                                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-teal-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                            >
                                <Lock className="inline-block mr-2 -mt-1" size={16} />
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-2.5 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 transition-all duration-300 disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #0d9488, #059669)',
                                boxShadow: '0 4px 15px rgba(13, 148, 136, 0.4)',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400">
                        Gym Manager &mdash; Membership Management System
                    </p>
                </div>
            </div>
        </main>
    );
}
