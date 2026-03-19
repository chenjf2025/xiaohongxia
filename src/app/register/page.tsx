"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [inviteValid, setInviteValid] = useState<{valid: boolean; info?: any; error?: string} | null>(null);
    const { login } = useAuth();
    const { t } = useI18n();
    const searchParams = useSearchParams();

    // Get invite code from URL if present
    useEffect(() => {
        const code = searchParams.get("code");
        if (code) {
            setInviteCode(code);
            verifyInviteCode(code);
        }
    }, [searchParams]);

    const verifyInviteCode = async (code: string) => {
        if (!code) {
            setInviteValid(null);
            return;
        }
        
        setVerifying(true);
        try {
            const res = await fetch("/api/invite/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            setInviteValid(data);
        } catch (err) {
            setInviteValid({ valid: false, error: "Failed to verify code" });
        } finally {
            setVerifying(false);
        }
    };

    const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value.toUpperCase();
        setInviteCode(code);
        
        if (code.length >= 4) {
            verifyInviteCode(code);
        } else {
            setInviteValid(null);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        // Validate invite code if provided
        if (inviteCode && inviteValid && !inviteValid.valid) {
            setError(inviteValid.error || "Invalid invite code");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, inviteCode }),
            });

            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
            } else {
                setError(data.error || t('auth.error.registerFailed'));
            }
        } catch (err) {
            setError(t('auth.error.unexpected'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-red to-red-700 mb-2">{t('auth.register.title')}</h1>
                    <p className="text-premium-text-muted">{t('auth.register.subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.inviteCode') || 'Invite Code'}</label>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={handleInviteCodeChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red focus:border-transparent transition-all outline-none"
                            placeholder="XXXX XXXX"
                        />
                        {verifying && (
                            <p className="text-sm text-gray-500 mt-1">Verifying...</p>
                        )}
                        {inviteValid && inviteValid.valid && (
                            <p className="text-sm text-green-600 mt-1">
                                ✓ Valid invite from {inviteValid.info?.creator} ({inviteValid.info?.remainingUses} uses left)
                            </p>
                        )}
                        {inviteValid && !inviteValid.valid && (
                            <p className="text-sm text-red-500 mt-1">
                                ✗ {inviteValid.error}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red focus:border-transparent transition-all outline-none"
                            placeholder="e.g. awesome_owner"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red focus:border-transparent transition-all outline-none"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!!inviteCode && !!inviteValid && !inviteValid.valid)}
                        className="w-full bg-primary-red hover:bg-primary-red-hover text-white font-medium py-3 rounded-xl transition-all shadow-md mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? t('auth.loading.register') : t('auth.submit.register')}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600">
                    {t('auth.hasAccount')}{" "}
                    <Link href="/login" className="text-primary-red hover:underline font-medium">
                        {t('auth.signin')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
