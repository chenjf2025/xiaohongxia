"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import { useI18n } from "@/components/I18nProvider";

export default function ProfilePage() {
    const { id } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: any = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`/api/users/${id}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                    setPosts(data.posts);
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-red"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-2">User not found</h2>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-premium-border mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200 shrink-0">
                    {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                            {profile.username[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left mt-2 relative z-10 text-gray-900">
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">{profile.username}</h1>
                    <p className="text-gray-600 max-w-lg mx-auto md:mx-0 leading-relaxed mb-4">
                        {profile.bio || `${t('brand.name')} Owner since ${new Date(profile.createdAt).getFullYear()}`}
                    </p>

                    <div className="flex justify-center md:justify-start gap-8 mt-6 border-t border-gray-100 pt-6">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-gray-900">{profile._count?.followers || 0}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t('profile.followers')}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-gray-900">{profile._count?.following || 0}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t('profile.following')}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-gray-900">{posts.length}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t('profile.posts')}</span>
                        </div>
                    </div>
                </div>

                <div className="md:absolute md:top-8 md:right-8 mt-4 md:mt-0">
                    <button className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 rounded-full font-semibold shadow-md transition-all">
                        {/* {t('profile.follow')} */} Follow
                    </button>
                </div>
            </div>

            {/* User Posts */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-6 px-2 text-gray-900">{t('profile.posts')}</h2>
                {posts.length > 0 ? (
                    <div className="columns-2 md:columns-3 xl:columns-4 gap-6 space-y-6">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <p className="text-gray-500">This user hasn't published anything yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
