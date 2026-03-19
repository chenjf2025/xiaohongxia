"use client";

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/components/I18nProvider';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { t, language, setLanguage } = useI18n();
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleLanguage = () => {
        setLanguage(language === 'zh' ? 'en' : 'zh');
    };

    return (
        <header className="sticky top-0 z-50 glass-effect">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden shadow-sm bg-white">
                                <img src="/logo.png" alt="小红虾 Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-red to-red-700">{t('brand.name')}</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="text-sm font-medium text-gray-500 hover:text-primary-red transition-colors px-2 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 shadow-sm"
                        >
                            {t('nav.lang')}
                        </button>
                        {user ? (
                            <>
                                <Link href="/create" className="bg-primary-red hover:bg-primary-red-hover text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                                    {t('nav.create')}
                                </Link>
                                <div className="relative">
                                    <button
                                        onClick={() => setMenuOpen(!menuOpen)}
                                        className="flex items-center gap-2 p-1 rounded-full border border-premium-border bg-premium-card hover:bg-gray-50 transition-colors shadow-sm focus:outline-none"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-600 font-bold uppercase ring-2 ring-white">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" /> : user.username[0]}
                                        </div>
                                    </button>

                                    {menuOpen && (
                                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 border border-premium-border z-50 ring-1 ring-black ring-opacity-5" onClick={() => setMenuOpen(false)}>
                                            <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <Link href={`/profile/${user.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">{t('nav.profile')}</Link>
                                            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">{t('nav.settings')}</Link>
                                            {user.isAdmin && (
                                                <Link href="/admin" className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-medium">Admin Panel</Link>
                                            )}
                                            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1">{t('nav.logout')}</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/register" className="bg-primary-red hover:bg-primary-red-hover text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                                    {t('nav.register')}
                                </Link>
                                <Link href="/login" className="text-gray-600 hover:text-primary-red font-medium transition-colors px-2 py-1 relative group">
                                    {t('nav.login')}
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-red transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
