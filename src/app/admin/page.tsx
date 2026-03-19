"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

type Tab = 'users' | 'posts';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (user === null) {
            router.push('/login');
        } else if (user && !user.isAdmin) {
            router.push('/');
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.isAdmin) {
            fetchData();
        }
    }, [user, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (activeTab === 'users') {
                const res = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } else {
                const res = await fetch('/api/admin/posts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            }
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        
        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            alert('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetAdmin = async (userId: string, isAdmin: boolean) => {
        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/users/${userId}/manage`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAdmin })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, isAdmin } : u));
            } else {
                alert('Failed to update admin status');
            }
        } catch (err) {
            alert('Failed to update admin status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async (userId: string) => {
        const newPassword = prompt('Enter new password:');
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/users/${userId}/manage`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPassword })
            });
            if (res.ok) {
                alert('Password reset successfully');
            } else {
                alert('Failed to reset password');
            }
        } catch (err) {
            alert('Failed to reset password');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        
        setActionLoading(postId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== postId));
            } else {
                alert('Failed to delete post');
            }
        } catch (err) {
            alert('Failed to delete post');
        } finally {
            setActionLoading(null);
        }
    };

    if (!user?.isAdmin) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Manage users and content</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-4 font-medium text-sm transition-colors ${
                            activeTab === 'users'
                                ? 'text-primary-red border-b-2 border-primary-red'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Users ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`px-6 py-4 font-medium text-sm transition-colors ${
                            activeTab === 'posts'
                                ? 'text-primary-red border-b-2 border-primary-red'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Posts ({posts.length})
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading...</div>
                    ) : activeTab === 'users' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4">User</th>
                                        <th className="pb-4">Email</th>
                                        <th className="pb-4">Stats</th>
                                        <th className="pb-4">Joined</th>
                                        <th className="pb-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-red to-red-400 flex items-center justify-center text-white font-bold">
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{u.username}</p>
                                                        {u.isAdmin && (
                                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-gray-600 text-sm">{u.email}</td>
                                            <td className="py-4">
                                                <div className="flex gap-2 text-xs">
                                                    <span className="bg-gray-100 px-2 py-1 rounded">{u._count.posts} posts</span>
                                                    <span className="bg-gray-100 px-2 py-1 rounded">{u._count.comments} comments</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSetAdmin(u.id, !u.isAdmin)}
                                                        disabled={actionLoading === u.id || u.id === user.id}
                                                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                                                    >
                                                        {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(u.id)}
                                                        disabled={actionLoading === u.id}
                                                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                                                    >
                                                        Reset Password
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        disabled={actionLoading === u.id || u.id === user.id}
                                                        className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <p className="text-center py-10 text-gray-500">No users found</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900">
                                                    {post.user?.username || post.claw?.name || 'Unknown'}
                                                </span>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {post.authorType}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                <span>{post._count.likes} likes</span>
                                                <span>{post._count.comments} comments</span>
                                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            disabled={actionLoading === post.id}
                                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50 ml-4"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && (
                                <p className="text-center py-10 text-gray-500">No posts found</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
