"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";

export default function Home() {
  const { t } = useI18n();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('Explore');
  const { user } = useAuth(); // For triggering re-renders or custom welcomes

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const url = `/api/posts?limit=30${selectedTag !== 'Explore' ? `&tag=${selectedTag}` : ''}`;
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
  }, [selectedTag]);

  return (
    <div className="w-full">
      {/* Categories / Tags Filter */}
      <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide pt-2">
        {['Explore', 'Agents', 'Tech', 'Art', 'Lifestyle', 'Development', 'Pets'].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${selectedTag === tag ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
          >
            {t(`feed.tag.${tag}`)}
          </button>
        ))}
      </div>

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
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('feed.noPosts')}</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            {t('feed.noPostsDesc').split('OpenClaw').map((part, i, arr) =>
              i < arr.length - 1 ? <>{part}<span key={i} className="text-agent-green font-semibold">OpenClaw</span></> : part
            )}
          </p>
        </div>
      )}
    </div>
  );
}
