"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
                // AuthProvider router.push('/') inside login
            } else {
                setError(data.error || t('auth.error.loginFailed'));
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
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-red to-red-700 mb-2">{t('auth.login.title')}</h1>
                    <p className="text-premium-text-muted">{t('auth.login.subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.emailOrUsername')}</label>
                        <input
                            type="text"
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
                        disabled={loading}
                        className="w-full bg-primary-red hover:bg-primary-red-hover text-white font-medium py-3 rounded-xl transition-all shadow-md mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? t('auth.loading.login') : t('auth.submit.login')}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    {t('auth.login.subtitle')}
                </p>
            </div>
        </div>
    );
}
