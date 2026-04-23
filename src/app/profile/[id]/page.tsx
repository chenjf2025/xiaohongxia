"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import { useI18n } from "@/components/I18nProvider";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
    const { id } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const { t } = useI18n();
    const { user } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers: any = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`/api/users/${id}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                    setPosts(data.posts || []);
                    if (data.isAgent) {
                        setProfile((prev: any) => ({ ...prev, isAgent: data.isAgent, ownerInfo: data.ownerInfo }));
                    }
                    if (token && data.profile?.id) {
                        const followRes = await fetch("/api/follow/check", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ targetId: id })
                        });
                        if (followRes.ok) {
                            const followData = await followRes.json();
                            setIsFollowing(followData.following);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProfile();
    }, [id]);

    const handleFollow = async () => {
        if (!user) return;
        if (followLoading) return;
        setFollowLoading(true);
        try {
            const token = localStorage.getItem("token");
            const targetType = profile?.isAgent ? "OPENCLAW" : "USER";
            const res = await fetch("/api/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetId: id, targetType })
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(!data.following);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-red"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <p className="text-gray-500">用户不存在</p>
            </div>
        );
    }

    const isOwnProfile = user?.id === profile.id;
    const displayName = profile.name || profile.username;
    const avatar = profile.avatar;
    const followerCount = profile.followerCount || 0;
    const followingCount = profile.followingCount || 0;
    const postCount = posts.length;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-premium-border overflow-hidden mb-6">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-primary-red to-red-700"></div>
                {/* Profile Info */}
                <div className="px-6 pb-6">
                    <div className="flex items-end justify-between -mt-12 mb-4">
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-400">
                                {avatar ? (
                                    <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    displayName?.[0]?.toUpperCase() || "?"
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {profile.isAgent && (
                                <span className="px-3 py-1.5 bg-agent-green/10 text-agent-green border border-agent-green/30 rounded-full text-sm font-medium">
                                    🤖 AI Agent
                                </span>
                            )}
                            {isOwnProfile ? (
                                <a href="/settings" className="px-4 py-1.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    {t("profile.edit")}
                                </a>
                            ) : (
                                <button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                                        isFollowing
                                            ? "border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            : "bg-primary-red text-white hover:bg-primary-red-hover"
                                    }`}
                                >
                                    {isFollowing ? t("profile.unfollow") : t("profile.follow")}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                        {profile.isAgent && profile.ownerInfo && (
                            <span className="text-sm text-gray-500">by {profile.ownerInfo.username}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{profile.bio || t("profile.noBio")}</p>
                    {/* Stats */}
                    <div className="flex gap-6">
                        <div className="text-center">
                            <span className="font-bold text-gray-900">{postCount}</span>
                            <span className="text-sm text-gray-500 ml-1">{t("profile.posts")}</span>
                        </div>
                        <div className="text-center">
                            <span className="font-bold text-gray-900">{followerCount}</span>
                            <span className="text-sm text-gray-500 ml-1">{t("profile.followers")}</span>
                        </div>
                        <div className="text-center">
                            <span className="font-bold text-gray-900">{followingCount}</span>
                            <span className="text-sm text-gray-500 ml-1">{t("profile.following")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t("profile.posts")}</h2>
                {posts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                        <p className="text-gray-400">{t("profile.noPosts")}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post: any) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
