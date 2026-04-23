"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        setUsername(user.username || "");
        setName(user.name || "");
        setBio(user.bio || "");
        setAvatar(user.avatar || "");
        setAvatarPreview(user.avatar || "");
    }, [user, router]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("图片不能超过 5MB"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setAvatarPreview(dataUrl);
            setAvatar(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaved(false);
        if (!username.trim()) { setError("用户名不能为空"); return; }
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) { router.push("/login"); return; }
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ username: username.trim(), name: name.trim(), bio: bio.trim(), avatar })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.profile) {
                    try {
                        const parts = token.split(".");
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            payload.username = data.profile.username;
                            payload.name = data.profile.name;
                            payload.avatar = data.profile.avatar;
                            const newToken = parts[0] + "." + btoa(JSON.stringify(payload)) + "." + parts[2];
                            localStorage.setItem("token", newToken);
                            localStorage.setItem("user", JSON.stringify(data.profile));
                            window.dispatchEvent(new Event("storage"));
                        }
                    } catch (_) { /* ignore token update errors */ }
                }
                setSaved(true);
                setTimeout(() => { window.location.reload(); }, 1500);
            } else {
                const data = await res.json();
                setError(data.error || "保存失败");
            }
        } catch (_) {
            setError("保存失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 -mt-6 -mb-6">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-red to-red-600 px-6 py-5">
                        <h1 className="text-white text-xl font-bold">⚙️ 账号设置</h1>
                        <p className="text-red-100 text-sm mt-1">管理你的个人资料和偏好设置</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="flex flex-col items-center">
                            <div className="relative mb-3">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                            {username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-colors text-base">
                                    📷
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </div>
                            <p className="text-xs text-gray-400">点击更换头像（最大 5MB）</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">用户名</label>
                                <input value={username} onChange={e => setUsername(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red outline-none transition-all text-sm"
                                    placeholder="设置用户名" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">昵称</label>
                                <input value={name} onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red outline-none transition-all text-sm"
                                    placeholder="设置昵称（选填）" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">个人简介</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red outline-none transition-all text-sm resize-none"
                                    placeholder="介绍一下自己（选填）" maxLength={200} />
                                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/200</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>
                        )}

                        {saved && (
                            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">✅ 保存成功！</div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-primary-red hover:bg-primary-red-hover text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? "保存中..." : "💾 保存设置"}
                        </button>
                    </form>
                </div>

                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">🤖 AI 内容标注</h2>
                    <p className="text-sm text-gray-500 mb-4">开启后，你发布的 AI 生成内容将自动添加标识</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">自动标注 AI 生成内容</p>
                            <p className="text-xs text-gray-400 mt-0.5">基于内容特征自动判断</p>
                        </div>
                        <button className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors cursor-pointer"
                            onClick={() => alert("功能开发中，敬请期待！")}>
                            <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-red-100 p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-1">⚠️ 危险区域</h2>
                    <p className="text-sm text-gray-500 mb-4">以下操作不可逆，请谨慎操作</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">删除账户</p>
                            <p className="text-xs text-gray-400 mt-0.5">永久删除账户和所有数据</p>
                        </div>
                        <button className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors"
                            onClick={() => alert("请联系管理员删除账户")}>
                            删除
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
