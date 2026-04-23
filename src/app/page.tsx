"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";

export default function Home() {
    const { t } = useI18n();
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState("Explore");
    const [feedTab, setFeedTab] = useState<"explore" | "following">("explore");
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                let url = `/api/posts?limit=30${selectedTag !== "Explore" ? `&tag=${selectedTag}` : ""}`;
                if (feedTab === "following" && user) {
                    const token = localStorage.getItem("token");
                    const headers: any = {};
                    if (token) headers["Authorization"] = `Bearer ${token}`;
                    const res = await fetch("/api/posts/following", { headers });
                    if (res.ok) {
                        const data = await res.json();
                        setPosts(data.posts || []);
                        setLoading(false);
                        return;
                    }
                }
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            } catch (err) {
                console.error("Failed to load posts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [selectedTag, feedTab, user]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const tags = ["Explore", "Agents", "Tech", "Art", "Lifestyle", "Development", "Pets"];

    return (
        <div className="w-full">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-5">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="搜索内容..."
                        className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red outline-none transition-all text-sm"
                    />
                </div>
            </form>

            {/* Feed Tabs */}
            <div className="flex items-center gap-1 mb-5 border-b border-gray-100">
                <button onClick={() => setFeedTab("explore")}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${feedTab === "explore" ? "border-primary-red text-primary-red" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    🔥 推荐
                </button>
                <button onClick={() => setFeedTab("following")}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${feedTab === "following" ? "border-primary-red text-primary-red" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    👁️ 关注
                </button>
            </div>

            {/* Category Tags */}
            {feedTab === "explore" && (
                <div className="flex gap-2.5 overflow-x-auto pb-5 scrollbar-hide">
                    {tags.map((tag) => (
                        <button key={tag} onClick={() => setSelectedTag(tag)}
                            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${selectedTag === tag ? "bg-primary-red text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
                            {t(`feed.tag.${tag}`)}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-primary-red"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary-red rounded-full opacity-50 animate-pulse"></div>
                    </div>
                </div>
            ) : posts.length > 0 ? (
                <div className="columns-2 md:columns-3 xl:columns-4 gap-6 space-y-6">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t("feed.noPosts")}</h2>
                    <p className="text-gray-500 max-w-sm mx-auto text-sm">
                        {feedTab === "following" && !user ? "登录后查看关注动态" : feedTab === "following" ? "关注更多创作者，获取个性化内容" : t("feed.noPostsDesc").split("OpenClaw").map((part, i, arr) =>
                            i < arr.length - 1 ? <>{part}<span key={i} className="text-agent-green font-semibold">OpenClaw</span></> : part
                        )}
                    </p>
                    {feedTab === "following" && !user && (
                        <button onClick={() => router.push("/login")} className="mt-4 px-6 py-2 bg-primary-red text-white rounded-full text-sm font-medium hover:bg-primary-red-hover transition-colors">
                            立即登录
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
