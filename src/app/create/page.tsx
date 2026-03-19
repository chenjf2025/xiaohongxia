"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";

export default function CreatePostPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { user } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

    useEffect(() => {
        if (typeof window !== 'undefined' && user === null && !localStorage.getItem('token')) {
            router.push('/login');
        }
    }, [user, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selectedFiles = Array.from(e.target.files);

        if (files.length + selectedFiles.length > 9) {
            setError(t('post.create.error.maxImages'));
            return;
        }

        const newFiles = [...files, ...selectedFiles];
        setFiles(newFiles);

        // Create previews
        const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newUrls]);
        setError("");
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        const newUrls = [...previewUrls];
        newFiles.splice(index, 1);
        newUrls.splice(index, 1);
        setFiles(newFiles);
        setPreviewUrls(newUrls);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError(t('post.create.error.contentReq'));
            return;
        }
        if (files.length === 0) {
            setError(t('post.create.error.imageReq'));
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('token');
            let imageUrls: string[] = [];

            // 1. Upload images
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(file => formData.append('files', file));

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (!uploadRes.ok) throw new Error(t('post.create.error.uploadFailed'));
                const uploadData = await uploadRes.json();
                imageUrls = uploadData.urls;
            }

            // 2. Create post
            const tagArray = tags.split(' ').map(t => t.trim().replace(/^#/, '')).filter(t => t);

            const postRes = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    imageUrls,
                    tags: tagArray,
                    visibility: 'PUBLIC'
                })
            });

            if (!postRes.ok) throw new Error(t('post.create.error.postFailed'));

            const postData = await postRes.json();
            router.push(`/post/${postData.post.id}`);

        } catch (err: any) {
            setError(err.message || t('auth.error.unexpected'));
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-premium-border">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('post.create.title')}</h1>

            {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Area */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('post.create.uploadImages')}</label>
                    <div className="flex flex-wrap gap-4">
                        {previewUrls.map((url, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                            </div>
                        ))}

                        {files.length < 9 && (
                            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-red hover:text-primary-red transition-colors cursor-pointer bg-gray-50 hover:bg-red-50/30">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                <span className="text-xs mt-1 font-medium">Upload</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                </div>

                <div>
                    <input
                        type="text"
                        placeholder={t('post.create.titlePlaceholder')}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full text-xl font-bold border-b border-gray-200 focus:border-primary-red outline-none py-2 transition-colors placeholder:font-normal placeholder:text-gray-400"
                    />
                </div>

                <div>
                    <textarea
                        placeholder={t('post.create.contentPlaceholder')}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={8}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-red focus:border-transparent outline-none transition-all resize-none text-gray-800"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('post.create.addTags')}</label>
                    <input
                        type="text"
                        placeholder={t('post.create.addTags')}
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red outline-none transition-all text-sm"
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-red hover:bg-primary-red-hover text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                {t('post.create.publishing')}
                            </>
                        ) : t('post.create.publish')}
                    </button>
                </div>
            </form>
        </div>
    );
}
