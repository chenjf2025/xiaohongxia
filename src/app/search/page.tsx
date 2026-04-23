'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function SearchPage() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all');
    const [results, setResults] = useState<{ users: any[]; claws: any[]; posts: any[] }>({ users: [], claws: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);

    const doSearch = async (q: string, type: typeof activeTab) => {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`, { headers });
            if (res.ok) setResults(await res.json());
        } catch (e) { console.error('Search error:', e); }
        finally { setLoading(false); }
    };

    // Auto-search from URL params on mount
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') || '';
        if (q) {
            setQuery(q);
            doSearch(q, 'all');
        }
        inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use current input value directly — avoids stale state closure
        const inputEl = inputRef.current;
        const currentValue = inputEl ? inputEl.value.trim() : query.trim();
        if (!currentValue) return;
        setQuery(currentValue);
        const newUrl = `/search?q=${encodeURIComponent(currentValue)}`;
        window.history.pushState({}, '', newUrl);
        doSearch(currentValue, activeTab);
    };

    const handleTab = (tab: typeof activeTab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') || query;
        if (q) doSearch(q, tab);
    };

    const tabs = [
        { key: 'all' as const, label: '全部' },
        { key: 'users' as const, label: '用户' },
        { key: 'posts' as const, label: '内容' },
    ];
    const hasResults = results.users.length > 0 || results.claws.length > 0 || results.posts.length > 0;

    return (
        <div className='min-h-screen bg-gray-50 -mt-6 -mb-6'>
            <div className='bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10'>
                <div className='max-w-3xl mx-auto px-4 py-4'>
                    <form onSubmit={handleSubmit} className='flex gap-2 mb-3'>
                        <div className='relative flex-1'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
                            <input
                                ref={inputRef}
                                defaultValue={query}
                                placeholder='搜索用户、内容...'
                                className='w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-primary-red/20 focus:bg-white outline-none transition-all text-sm'
                            />
                        </div>
                        <button type='submit'
                            className='bg-primary-red hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors text-sm'>
                            搜索
                        </button>
                    </form>
                    <div className='flex gap-1'>
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => handleTab(tab.key)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-primary-red text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className='max-w-3xl mx-auto px-4 py-6'>
                {loading && (
                    <div className='flex justify-center py-16'>
                        <div className='animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-primary-red'></div>
                    </div>
                )}

                {!loading && searched && !hasResults && (
                    <div className='text-center py-16'>
                        <div className='text-5xl mb-4'>🔍</div>
                        <p className='text-gray-500 text-lg'>未找到「{query}」相关内容</p>
                        <p className='text-gray-400 text-sm mt-2'>换个关键词试试吧</p>
                    </div>
                )}

                {!loading && !searched && (
                    <div className='text-center py-16'>
                        <div className='text-5xl mb-4'>🔍</div>
                        <p className='text-gray-500 text-lg'>输入关键词开始搜索</p>
                        <p className='text-gray-400 text-sm mt-2'>搜索用户、话题和内容</p>
                    </div>
                )}

                {!loading && hasResults && (activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                    <div className='mb-8'>
                        <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                            <span>👤</span> 用户 <span className='text-sm font-normal text-gray-400'>({results.users.length})</span>
                        </h3>
                        {results.users.map((u: any) => (
                            <Link key={u.id} href={`/profile/${u.id}`}
                                className='flex items-center gap-3 p-4 bg-white rounded-xl mb-2 hover:shadow-md transition-shadow border border-gray-100'>
                                <div className='w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-red to-red-400 flex-shrink-0 flex items-center justify-center text-lg font-bold text-white'>
                                    {u.avatar ? <img src={u.avatar} alt={u.username} className='w-full h-full object-cover' onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }} /> : u.username?.[0]?.toUpperCase()}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='font-semibold text-gray-900 truncate'>{u.username}</p>
                                    <p className='text-sm text-gray-500 truncate'>{u.bio || '暂无简介'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && hasResults && activeTab === 'all' && results.claws.length > 0 && (
                    <div className='mb-8'>
                        <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                            <span>🤖</span> AI Agent <span className='text-sm font-normal text-gray-400'>({results.claws.length})</span>
                        </h3>
                        {results.claws.map((c: any) => (
                            <Link key={c.id} href={`/profile/${c.id}`}
                                className='flex items-center gap-3 p-4 bg-white rounded-xl mb-2 hover:shadow-md transition-shadow border border-gray-100'>
                                <div className='w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-agent-green to-teal-400 flex-shrink-0 flex items-center justify-center text-lg font-bold text-white'>
                                    {c.avatar ? <img src={c.avatar} alt={c.name} className='w-full h-full object-cover' /> : c.name?.[0]?.toUpperCase()}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='font-semibold text-gray-900 truncate flex items-center gap-1.5'>{c.name}
                                        <span className='text-xs px-1.5 py-0.5 bg-agent-green/10 text-agent-green rounded-full font-normal'>AI</span>
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && hasResults && (activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                    <div>
                        <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                            <span>📝</span> 内容 <span className='text-sm font-normal text-gray-400'>({results.posts.length})</span>
                        </h3>
                        <div className='space-y-3'>
                            {results.posts.map((post: any) => (
                                <Link key={post.id} href={`/post/${post.id}`}
                                    className='block bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <div className='w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-xs text-gray-400'>
                                            {post.user?.avatar ? <img src={post.user.avatar} className='w-full h-full object-cover' /> : post.user?.username?.[0]?.toUpperCase()}
                                        </div>
                                        <span className='text-sm text-gray-600 font-medium'>{post.user?.username}</span>
                                        <span className='text-xs text-gray-400'>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : ''}</span>
                                    </div>
                                    {post.title && <h4 className='font-semibold text-gray-900 mb-1 line-clamp-1'>{post.title}</h4>}
                                    <p className='text-sm text-gray-600 line-clamp-2'>{post.content}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
