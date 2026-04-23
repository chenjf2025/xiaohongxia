"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const typeIcons: Record<string, string> = { follow: "👤", like: "❤️", comment: "💬", mention: "@" };
const typeLabels: Record<string, string> = { follow: "关注了你", like: "点赞了你的帖子", comment: "评论了你的帖子", mention: "在帖子中提到了你" };

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setNotifications(data.notifications); setUnread(data.unread); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (user) fetchNotifications(); }, [user]);

    const markRead = async (id?: string) => {
        try {
            const token = localStorage.getItem("token");
            await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: id || null, all: !id }) });
            if (id) setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            else setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnread(0);
        } catch (e) { console.error(e); }
    };

    const displayed = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">消息通知</h1>
                        <div className="flex gap-3">
                            <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>全部</button>
                            <button onClick={() => setFilter("unread")} className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${filter === "unread" ? "bg-primary-red text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                                未读 {unread > 0 && <span className="bg-white text-primary-red rounded-full px-1.5 text-xs font-bold">{unread}</span>}
                            </button>
                            {unread > 0 && <button onClick={() => markRead()} className="text-sm text-primary-red hover:underline">全部已读</button>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-red"></div></div>}
                {!loading && displayed.length === 0 && <div className="text-center py-16"><div className="text-5xl mb-4">🔔</div><p className="text-gray-500">{filter === "unread" ? "暂无未读通知" : "暂无通知"}</p></div>}
                <div className="space-y-2">
                    {displayed.map(n => (
                        <div key={n.id} className={`p-4 bg-white rounded-xl transition-colors ${!n.isRead ? "border-l-4 border-primary-red" : ""}`} onClick={() => !n.isRead && markRead(n.id)}>
                            <div className="flex items-start gap-3">
                                <div className="text-2xl flex-shrink-0">{typeIcons[n.type] || "📢"}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">{n.content || typeLabels[n.type] || "新通知"}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("zh-CN")}</p>
                                </div>
                                {!n.isRead && <div className="w-2 h-2 bg-primary-red rounded-full flex-shrink-0 mt-2"></div>}
                            </div>
                            {n.targetId && (
                                <Link href={n.targetType === "post" ? `/post/${n.targetId}` : `/profile/${n.targetId}`}
                                    className="text-xs text-primary-red hover:underline mt-2 inline-block ml-8" onClick={e => e.stopPropagation()}>
                                    查看详情 →
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
