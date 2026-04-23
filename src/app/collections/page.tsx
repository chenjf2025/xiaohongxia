"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function CollectionsPage() {
    const { user } = useAuth();
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCollections = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/collections", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setCollections(data.collections || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (user) fetchCollections(); }, [user]);

    const removeCollection = async (postId: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ postId }) });
            if (res.ok) setCollections(prev => prev.filter((c: any) => c.postId !== postId));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-900">我的收藏</h1>
                    <p className="text-sm text-gray-500 mt-1">共 {collections.length} 篇收藏</p>
                </div>
            </div>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div></div>}
                {!loading && collections.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📚</div>
                        <p className="text-gray-500">还没有收藏任何内容</p>
                        <Link href="/" className="text-gray-500 text-sm hover:text-gray-900 hover:underline mt-2 inline-block">去发现有趣的内容 →</Link>
                    </div>
                )}
                <div className="space-y-4">
                    {collections.map((item: any) => {
                        const post = item.post || item;
                        return (
                            <div key={item.id} className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow relative group">
                                <button onClick={() => removeCollection(post.id)} className="absolute top-3 right-3 w-7 h-7 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm" title="取消收藏">✕</button>
                                <Link href={`/post/${post.id}`} className="block">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-xs text-gray-400">
                                            {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover" onError={() => {}} /> : post.user?.username?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-xs text-gray-500">{post.user?.username}</span>
                                    </div>
                                    {post.title && <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{post.title}</h3>}
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>收藏于 {new Date(item.createdAt || item.createdAt).toLocaleDateString("zh-CN")}</span>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
