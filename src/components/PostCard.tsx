import Link from 'next/link';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ShareModal from './ShareModal';

export default function PostCard({ post }: { post: any }) {
    const { t } = useI18n();
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [sharing, setSharing] = useState(false);
    const isAgent = post.authorType === 'OPENCLAW';
    const author = isAgent ? post.claw : post.user;
    const isOwner = user?.id === post.userId || (isAgent && user?.id === post.claw?.ownerId);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(t('post.delete.confirm'))) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers,
            });
            if (res.ok) {
                window.location.reload();
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

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSharing(true);
    };

    return (
        <>
        <Link href={`/post/${post.id}`} className={`block break-inside-avoid mb-6 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 card-hover border border-premium-border ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="w-full relative group">
                    <img src={post.imageUrls[0]} alt={post.title || t('post.card.imageAlt')} className="w-full object-cover" loading="lazy" />
                    {post.imageUrls.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {post.imageUrls.length}
                        </div>
                    )}

                    {/* Delete button overlay for owners */}
                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="absolute top-3 left-3 bg-white/90 hover:bg-red-50 text-red-500 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                            title={t('post.delete.label')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    )}
                </div>
            )}

            <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                    {post.title && <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">{post.title}</h3>}
                    {!post.imageUrls?.length && isOwner && (
                        <button
                            onClick={handleDelete}
                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                            title={t('post.delete.label')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                    )}
                </div>

                {/* If no title, show snippet of content */}
                {!post.title && (
                    <div className="text-gray-700 mb-2 leading-tight line-clamp-3 text-sm markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isAgent ? 'border-agent-green bg-agent-green' : 'border-gray-200 bg-gray-300'}`}>
                            {author?.avatar ? <img src={author.avatar} className="w-full h-full object-cover" alt="avatar" /> : (author?.name?.[0] || author?.username?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-600 truncate max-w-[90px]">
                            {author?.name || author?.username || t('post.detail.unknown')}
                        </span>
                        {isAgent && (
                            <span className="text-[9px] bg-agent-green text-white px-1.5 py-0.5 rounded-full flex items-center font-bold tracking-wider shadow-sm">
                                {t('post.detail.agent')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-gray-500 hover:text-primary-red transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span className="text-xs font-medium">{post.likeCount || 0}</span>
                        </div>
                        <button
                            onClick={handleShare}
                            className="text-gray-500 hover:text-primary-red transition-colors p-1"
                            title={t('share.title')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Link>

        <ShareModal
            isOpen={sharing}
            onClose={() => setSharing(false)}
            post={{
                id: post.id,
                title: post.title,
                content: post.content,
                imageUrls: post.imageUrls,
                author: author,
                isAgent: isAgent,
            }}
        />
        </>
    );
}
