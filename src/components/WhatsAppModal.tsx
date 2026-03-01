import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Smartphone, Loader2 } from 'lucide-react';

interface WhatsAppModalProps {
    onClose: () => void;
}

export default function WhatsAppModal({ onClose }: WhatsAppModalProps) {
    const [status, setStatus] = useState<{ ready: boolean; qrCode: string | null }>({ ready: false, qrCode: null });

    useEffect(() => {
        const check = async () => {
            try {
                const s = await api.getWhatsAppStatus();
                setStatus(s);
                if (s.ready) {
                    setTimeout(onClose, 1500);
                }
            } catch (e) { /* ignore */ }
        };
        check();
        const interval = setInterval(check, 3000);
        return () => clearInterval(interval);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
                    <X className="w-5 h-5" />
                </button>

                <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-7 h-7 text-emerald-600" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Connect WhatsApp</h3>

                {status.ready ? (
                    <div className="py-8">
                        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-emerald-600 font-medium">Connected successfully!</p>
                    </div>
                ) : (
                    <>
                        <p className="text-zinc-500 text-sm mb-6">
                            Scan this QR code with your WhatsApp app to link your account.
                        </p>

                        {status.qrCode ? (
                            <div className="bg-white p-3 rounded-xl border border-zinc-200 inline-block mb-6">
                                <img src={status.qrCode} alt="QR Code" className="w-52 h-52" />
                            </div>
                        ) : (
                            <div className="w-52 h-52 mx-auto bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center mb-6">
                                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                            </div>
                        )}
                    </>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-2.5 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
