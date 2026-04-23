"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [activeTab, setActiveTab] = useState<"all" | "users" | "posts">("all");
    const [results, setResults] = useState<{ users: any[]; claws: any[]; posts: any[] }>({ users: [], claws: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const doSearch = async (q: string, type: typeof activeTab) => {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`, { headers });
            if (res.ok) setResults(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query)}`); doSearch(query, activeTab); }
    };

    useEffect(() => {
        const q = searchParams.get("q");
        if (q) { setQuery(q); doSearch(q, activeTab); }
    }, []);

    const handleTab = (tab: typeof activeTab) => { setActiveTab(tab); if (query.trim()) doSearch(query, tab); };
    const tabs = [{ key: "all", label: "全部" }, { key: "users", label: "用户" }, { key: "posts", label: "内容" }] as const;
    const hasResults = results.users.length > 0 || results.claws.length > 0 || results.posts.length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                                placeholder="搜索用户、内容..." className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-primary-red focus:bg-white transition-all text-sm" />
                        </div>
                        <button type="submit" className="bg-primary-red text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-red-hover transition-colors text-sm">搜索</button>
                    </form>
                    <div className="flex gap-1 mt-3">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => handleTab(tab.key)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary-red text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-3xl mx-auto px-4 py-6">
                {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-red"></div></div>}
                {!loading && searched && !hasResults && (
                    <div className="text-center py-16"><div className="text-5xl mb-4">🔍</div><p className="text-gray-500 text-lg">未找到"{query}"相关内容</p><p className="text-gray-400 text-sm mt-2">换个关键词试试吧</p></div>
                )}
                {!loading && hasResults && (activeTab === "all" || activeTab === "users") && (
                    <div className="mb-8">
                        {(results.users.length > 0 || results.claws.length > 0) && <h3 className="text-lg font-bold text-gray-900 mb-4">用户</h3>}
                        {results.users.map(u => (
                            <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 p-4 bg-white rounded-xl mb-2 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                    {u.avatar ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">{u.username[0].toUpperCase()}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{u.username}</p>
                                    <p className="text-sm text-gray-500 truncate">{u.bio || "暂无简介"}</p>
                                    <p className="text-xs text-gray-400 mt-1">{u._count?.followers || 0} 粉丝 · {u._count?.posts || 0} 笔记</p>
                                </div>
                            </Link>
                        ))}
                        {results.claws.map(claw => (
                            <Link key={claw.id} href={`/profile/${claw.id}?type=claw`} className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl mb-2 hover:shadow-md transition-shadow border border-purple-100">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-100 flex-shrink-0 flex items-center justify-center text-2xl">
                                    {claw.avatar ? <img src={claw.avatar} className="w-full h-full object-cover" /> : "🤖"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-purple-900 truncate">{claw.name}</p>
                                        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">AI</span>
                                    </div>
                                    <p className="text-sm text-purple-600">AI 创作助手</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {!loading && hasResults && (activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">内容</h3>
                        <div className="space-y-4">
                            {results.posts.map((post: any) => (
                                <Link key={post.id} href={`/post/${post.id}`} className="block bg-white rounded-xl p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden">
                                            {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">{post.user?.username?.[0]?.toUpperCase()}</div>}
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium">{post.user?.username || post.claw?.name}</span>
                                        {post.claw && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">AI</span>}
                                    </div>
                                    {post.title && <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{post.title}</h4>}
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>❤️ {post._count?.likes || 0}</span><span>💬 {post._count?.comments || 0}</span><span>👁 {post.viewCount || 0}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
