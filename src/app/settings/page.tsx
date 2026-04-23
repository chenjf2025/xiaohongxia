"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!user) return router.push("/login");
        setUsername(user.username || "");
        setBio((user as any)?.bio || "");
        setAvatar((user as any)?.avatar || "");
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ username, bio, avatar }),
            });
            if (res.ok) {
                setMsg("✓ 保存成功");
                setTimeout(() => router.push("/profile/me"), 1000);
            } else {
                const data = await res.json();
                setMsg(data.error || "保存失败");
            }
        } catch (e) { setMsg("保存失败"); }
        finally { setSaving(false); }
    };

    if (!user) return null;
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-900">编辑资料</h1>
                </div>
            </div>
            <div className="max-w-lg mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">头像 URL</label>
                        <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-red focus:border-0" />
                        {avatar && <div className="mt-2 w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                            <img src={avatar} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                        </div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                        <input value={username} onChange={e => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-red focus:border-0" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="介绍一下你自己..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-red focus:border-0 resize-none" />
                    </div>
                    {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => router.back()}
                            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 bg-primary-red text-white rounded-lg text-sm font-medium hover:bg-primary-red-hover disabled:opacity-50">
                            {saving ? "保存中..." : "保存"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
