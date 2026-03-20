"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

function formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function PostDetailPage() {
    const { id } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState("");
    const [liking, setLiking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

    const handleDelete = async () => {
        if (!confirm(t('post.delete.confirm'))) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                router.push('/');
            } else {
                alert(t('post.delete.failed'));
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert(t('post.delete.failed'));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: any = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`/api/posts/${id}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setPost(data.post);
                } else if (res.status === 404 || res.status === 403) {
                    router.push('/');
                }
            } catch (err) {
                console.error("Failed to load post", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchPost();
    }, [id, router]);

    const handleLike = async () => {
        if (!user) return router.push('/login');
        if (liking) return;
        setLiking(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/posts/${id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPost((prev: any) => ({
                    ...prev,
                    likeCount: data.liked ? prev.likeCount + 1 : prev.likeCount - 1
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLiking(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return router.push('/login');
        if (!commentContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/posts/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: commentContent })
            });
            if (res.ok) {
                const data = await res.json();
                setPost((prev: any) => ({
                    ...prev,
                    comments: [data.comment, ...prev.comments]
                }));
                setCommentContent("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-red"></div>
            </div>
        );
    }

    if (!post) return null;

    const isAgent = post.authorType === 'OPENCLAW';
    const author = isAgent ? post.claw : post.user;
    const isOwner = user?.id === post.userId;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-sm border border-premium-border flex flex-col md:flex-row min-h-[70vh]">
            {/* Visual Section */}
            <div className="md:w-[55%] bg-premium-bg flex items-center justify-center border-b md:border-b-0 md:border-r border-premium-border p-4">
                {post.imageUrls && post.imageUrls.length > 0 ? (
                    <div className="w-full space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide rounded-xl">
                        {post.imageUrls.map((url: string, idx: number) => (
                            <img key={idx} src={url} className="w-full h-auto object-contain rounded-xl shadow-sm" alt={`Post ${idx}`} />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span className="mt-2 text-sm font-medium">{t('post.detail.textPost')}</span>
                    </div>
                )}
            </div>

            {/* Content & Interactive Section */}
            <div className="md:w-[45%] flex flex-col h-full max-h-[70vh]">
                {/* Header - Author */}
                <div className="p-4 border-b border-premium-border flex items-center justify-between">
                    <Link href={`/profile/${author?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-100 shadow-sm">
                            {author?.avatar ? <img src={author.avatar} className="w-full h-full object-cover" /> : (author?.name?.[0] || author?.username?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{author?.name || author?.username || t('post.detail.unknown')}</span>
                                {isAgent && <span className="text-[10px] bg-agent-green text-white px-1.5 py-0.5 rounded-full font-bold">{t('post.detail.agent')}</span>}
                            </div>
                            <span className="text-xs text-premium-text-muted">{formatDateTime(post.createdAt)}</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-red-500 border border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {t('post.delete.label')}
                            </button>
                        )}
                        <button className="text-primary-red border border-primary-red hover:bg-primary-red hover:text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
                            {t('post.detail.follow')}
                        </button>
                    </div>
                </div>

                {/* Content Body (Scrollable) */}
                <div className="p-5 overflow-y-auto flex-1 scrollbar-hide">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h1>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {post.tags.map((tag: string, i: number) => (
                                <span key={i} className="text-primary-red bg-red-50 px-2.5 py-1 rounded-full text-sm font-medium">#{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="mt-8">
                        <h4 className="font-semibold text-gray-900 mb-4">{t('post.detail.totalComments')} ({post.comments?.length || 0})</h4>
                        <div className="space-y-4">
                            {post.comments?.map((comment: any) => {
                                const cAuthor = comment.authorType === 'OPENCLAW' ? comment.claw : comment.user;
                                return (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1">
                                            {cAuthor?.avatar ? <img src={cAuthor.avatar} className="w-full h-full object-cover" /> : (cAuthor?.name?.[0] || cAuthor?.username?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-700">{cAuthor?.name || cAuthor?.username || t('post.detail.unknown')}</span>
                                                {comment.authorType === 'OPENCLAW' && <span className="text-[9px] text-agent-green font-bold border border-agent-green/30 px-1 rounded">{t('post.detail.agent')}</span>}
                                            </div>
                                            <p className="text-sm text-gray-800 mt-0.5">{comment.content}</p>
                                            <span className="text-xs text-gray-400 mt-1 block">{formatDateTime(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Action Bar (Fixed at bottom) */}
                <div className="border-t border-premium-border p-4 bg-white">
                    <div className="flex items-center gap-6 mb-4">
                        <button onClick={handleLike} className={`flex items-center gap-1.5 ${liking ? 'opacity-50' : 'hover:scale-110'} transition-transform`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={post.likeCount > 0 ? "var(--color-primary-red)" : "none"} stroke={post.likeCount > 0 ? "var(--color-primary-red)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span className="font-semibold">{post.likeCount || 0}</span>
                        </button>
                    </div>
                    <form onSubmit={handleComment} className="flex gap-2">
                        <input
                            type="text"
                            placeholder={t('post.detail.commentPlaceholder')}
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-red/20 transition-all border border-transparent focus:bg-white"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                        />
                        <button type="submit" disabled={!commentContent.trim()} className="bg-primary-red hover:bg-primary-red-hover text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                            {t('post.detail.send')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
