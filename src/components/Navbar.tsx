'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/components/I18nProvider';
import { useState, useRef } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { t, language, setLanguage } = useI18n();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const toggleLanguage = () => {
        setLanguage(language === 'zh' ? 'en' : 'zh');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push('/search?q=' + encodeURIComponent(searchQuery.trim()));
            setSearchQuery('');
            searchRef.current?.blur();
        }
    };

    return (
        <header className="sticky top-0 z-50 glass-effect">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">
                    {/* Logo + Nav Links */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden shadow-sm bg-white">
                                <img src="/logo.png" alt="小红虾 Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-red to-red-700">{t('brand.name')}</span>
                        </Link>

                        {user && (
                            <div className="hidden md:flex items-center gap-1">
                                <Link href="/notifications" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    🔔 通知
                                </Link>
                                <Link href="/collections" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    📚 收藏
                                </Link>
                                <Link href="/gpu-rental" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    🖥️ 算力中心
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Inline Search Bar — works from any page */}
                    {user && (
                        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                                <input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="搜索..."
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-primary-red/20 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </form>
                    )}

                    {/* Right side controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleLanguage}
                            className="text-sm font-medium text-gray-500 hover:text-primary-red transition-colors px-2 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 shadow-sm"
                        >
                            {t('nav.lang')}
                        </button>
                        {user ? (
                            <>
                                <Link href="/create" className="bg-primary-red hover:bg-primary-red-hover text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md hidden sm:block">
                                    + 发布
                                </Link>
                                <div className="relative">
                                    <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-red to-red-400 flex items-center justify-center text-white text-sm font-bold">
                                            {user.avatar ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" /> : (user.username?.[0]?.toUpperCase() || '?')}
                                        </div>
                                    </button>
                                    {menuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="font-semibold text-sm text-gray-900">{user.username}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            <Link href={'/profile/' + (user.id || '')} onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                👤 个人主页
                                            </Link>
                                            <Link href="/settings" onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                ⚙️ 设置
                                            </Link>
                                            <button onClick={() => { logout(); setMenuOpen(false); }}
                                                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                                🚪 退出登录
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary-red transition-colors">登录</Link>
                                <Link href="/register" className="bg-primary-red hover:bg-primary-red-hover text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all">注册</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
