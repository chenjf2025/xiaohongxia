'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export interface PostData {
    id: string;
    title?: string;
    content: string;
    imageUrls?: string[];
    tags?: string[];
    likeCount?: number;
    commentCount?: number;
    visibility?: string;
    authorType?: string;
    userId?: string | null;
    clawId?: string | null;
    user?: { id?: string; username?: string; avatar?: string; bio?: string } | null;
    claw?: { id?: string; name?: string; avatar?: string; ownerId?: string } | null;
    createdAt?: string;
}

interface PostCardProps {
    post: PostData;
    showActions?: boolean;
}

export default function PostCard({ post, showActions = true }: PostCardProps) {
    const { user: currentUser } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [bookmarked, setBookmarked] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);
    const images = post.imageUrls || [];

    // Resolve author info based on authorType
    const isOpenClaw = post.authorType === 'OPENCLAW';
    const authorName = isOpenClaw
        ? (post.claw?.name || 'AI Agent')
        : (post.user?.username || '未知');
    const authorAvatar = isOpenClaw ? post.claw?.avatar : post.user?.avatar;
    const authorLink = isOpenClaw ? (post.claw?.id ? `/profile/${post.claw.id}` : '#') : (post.user?.id ? `/profile/${post.user.id}` : '#');
    const isAIAuthor = isOpenClaw;

    useEffect(() => {
        if (!currentUser || !post.id) return;
        const liked_posts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
        const bookmarked_posts = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
        setLiked(liked_posts.includes(post.id));
        setBookmarked(bookmarked_posts.includes(post.id));
    }, [currentUser, post.id]);

    const handleLike = async () => {
        if (!currentUser) { alert('请先登录'); return; }
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount((prev: number) => newLiked ? prev + 1 : Math.max(0, prev - 1));
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) { console.error(e); }
        const liked_posts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
        if (newLiked) localStorage.setItem('liked_posts', JSON.stringify([...liked_posts, post.id]));
        else localStorage.setItem('liked_posts', JSON.stringify(liked_posts.filter((id: string) => id !== post.id)));
    };

    const handleBookmark = async () => {
        if (!currentUser) { alert('请先登录'); return; }
        const newBookmarked = !bookmarked;
        setBookmarked(newBookmarked);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/posts/${post.id}/bookmark`, {
                method: newBookmarked ? 'POST' : 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) console.error('Bookmark failed');
        } catch (e) { console.error(e); }
        const bookmarked_posts = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
        if (newBookmarked) localStorage.setItem('bookmarked_posts', JSON.stringify([...bookmarked_posts, post.id]));
        else localStorage.setItem('bookmarked_posts', JSON.stringify(bookmarked_posts.filter((id: string) => id !== post.id)));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Author Row */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2.5">
                    <Link href={authorLink} className="flex-shrink-0">
                        <div className={
                            'w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold ' +
                            (isAIAuthor
                                ? 'bg-gradient-to-br from-agent-green to-teal-400 text-white'
                                : 'bg-gradient-to-br from-primary-red to-red-400 text-white')
                        }>
                            {authorAvatar
                                ? <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover"
                                    onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                                : authorName?.[0]?.toUpperCase()
                            }
                        </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={authorLink}
                                className={'text-sm font-semibold hover:underline ' + (isAIAuthor ? 'text-agent-green' : 'text-gray-900')}>
                                {authorName}
                            </Link>
                            {isAIAuthor && (
                                <span className="text-xs px-1.5 py-0.5 bg-agent-green/10 text-agent-green rounded-full font-medium">AI</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                        </p>
                    </div>
                    {post.visibility === 'PRIVATE' && <span className="text-xs text-gray-400">🔒 私密</span>}
                </div>
            </div>

            {/* Content */}
            <Link href={`/post/${post.id}`} className="block px-4">
                {post.title && <h2 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2">{post.title}</h2>}
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{post.content}</p>
            </Link>

            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="mt-3 px-4">
                    <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ maxHeight: '320px' }}>
                        {images.map((img, i) => (
                            <img key={i} src={img} alt=""
                                className={'w-full object-cover transition-opacity ' + (i === imageIndex ? 'block' : 'hidden')}
                                style={{ maxHeight: '320px' }}
                                onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                        ))}
                        {images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                                {imageIndex + 1}/{images.length}
                            </div>
                        )}
                        {images.length > 1 && imageIndex > 0 && (
                            <button onClick={() => setImageIndex(i => i - 1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow text-sm">‹</button>
                        )}
                        {images.length > 1 && imageIndex < images.length - 1 && (
                            <button onClick={() => setImageIndex(i => i + 1)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow text-sm">›</button>
                        )}
                    </div>
                </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="px-4 pt-2.5 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 4).map((tag, i) => (
                        <Link key={i} href={`/tags/${encodeURIComponent(tag)}`}
                            className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                            #{tag}
                        </Link>
                    ))}
                </div>
            )}

            {/* Actions */}
            {showActions && (
                <div className="flex items-center gap-1 px-2 pb-2 pt-2 mt-1 border-t border-gray-50">
                    <button onClick={handleLike}
                        className={'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ' +
                            (liked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-500 hover:bg-gray-100')}>
                        {liked ? '❤️' : '🤍'} <span>{likeCount}</span>
                    </button>
                    <button onClick={handleBookmark}
                        className={'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ' +
                            (bookmarked ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-500 hover:bg-gray-100')}>
                        {bookmarked ? '⭐' : '☆'} <span>收藏</span>
                    </button>
                    <Link href={`/post/${post.id}#comments`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                        💬 <span>{post.commentCount || 0}</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
