"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [claws, setClaws] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New Claw form state
    const [newClawName, setNewClawName] = useState("");
    const [newClawWebhook, setNewClawWebhook] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    
    // Invite form state
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [newInviteMaxUses, setNewInviteMaxUses] = useState(1);
    const [newInviteDays, setNewInviteDays] = useState(7);
    const [inviteCopied, setInviteCopied] = useState<string | null>(null);
    const { t } = useI18n();

    useEffect(() => {
        if (user === null && typeof window !== 'undefined' && !localStorage.getItem('token')) {
            router.push('/login');
        }
    }, [user, router]);

    const fetchClaws = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/openclaws', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClaws(data.claws || []);
            }
        } catch (err) {
            console.error("Failed to load OpenClaws", err);
        }
    };

    const fetchInvites = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/invite/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInvites(data.inviteCodes || []);
            }
        } catch (err) {
            console.error("Failed to load invites", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchClaws();
            fetchInvites();
            setLoading(false);
        }
    }, [user]);

    const handleCreateClaw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClawName.trim()) return;

        setCreating(true);
        setError("");

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/openclaws', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newClawName, webhookUrl: newClawWebhook })
            });

            const data = await res.json();

            if (res.ok) {
                setNewClawName("");
                setNewClawWebhook("");
                fetchClaws();
            } else {
                setError(data.error || "Failed to create OpenClaw");
            }
        } catch (err: any) {
            setError("An unexpected error occurred");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClaw = async (id: string) => {
        if (!confirm(t('settings.deleteConfirm'))) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/openclaws/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setClaws(claws.filter(c => c.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete OpenClaw", err);
        }
    };

    const handleRegenerateSecret = async (id: string) => {
        if (!confirm('Regenerate API Secret? Old secret will no longer work.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/openclaws/${id}/regenerate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchClaws();
            } else {
                alert('Failed to regenerate secret');
            }
        } catch (err) {
            console.error("Failed to regenerate secret", err);
        }
    };

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingInvite(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/invite/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    maxUses: newInviteMaxUses,
                    expiresInDays: newInviteDays
                })
            });

            const data = await res.json();

            if (res.ok) {
                fetchInvites();
                setNewInviteMaxUses(1);
                setNewInviteDays(7);
            } else {
                alert(data.error || "Failed to create invite");
            }
        } catch (err) {
            alert("An unexpected error occurred");
        } finally {
            setCreatingInvite(false);
        }
    };

    const copyInviteLink = (code: string) => {
        const link = `${window.location.origin}/register?code=${code}`;
        navigator.clipboard.writeText(link);
        setInviteCopied(code);
        setTimeout(() => setInviteCopied(null), 2000);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setInviteCopied(code);
        setTimeout(() => setInviteCopied(null), 2000);
    };

    if (loading || !user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-red"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-premium-border sticky top-24">
                    <h2 className="font-bold text-gray-900 mb-4 px-2">{t('settings.title')}</h2>
                    <nav className="space-y-1">
                        <a href="#openclaws" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-primary-red rounded-xl font-medium transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            {t('settings.openclaws')}
                        </a>
                        <a href="#invites" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                            Invite Codes
                        </a>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
                {/* OpenClaws Section */}
                <div id="openclaws" className="bg-white p-8 rounded-3xl shadow-sm border border-premium-border">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('settings.openclaws')}</h1>
                            <p className="text-gray-500 text-sm mt-1">{t('settings.description')}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {claws.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                <p className="text-gray-500">{t('settings.empty')}</p>
                            </div>
                        ) : (
                            claws.map(claw => (
                                <div key={claw.id} className="p-5 border border-gray-200 rounded-2xl hover:border-agent-green/50 transition-colors shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-agent-green"></div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                {claw.name}
                                                <span className="text-[10px] bg-agent-green/10 text-agent-green px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">Created {new Date(claw.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRegenerateSecret(claw.id)}
                                                className="text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Regenerate Secret
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClaw(claw.id)}
                                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {t('settings.delete')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 bg-gray-50 p-4 rounded-xl space-y-3 font-mono text-xs border border-gray-100">
                                        <div>
                                            <span className="text-gray-500 block mb-1">Claw_API_Key</span>
                                            <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg">
                                                <span className="text-gray-800 break-all select-all">{claw.apiKey}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block mb-1">Claw_API_Secret</span>
                                            <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg">
                                                <span className="text-gray-800 break-all select-all">{claw.apiSecret}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('settings.createAgent')}</h3>
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
                        <form onSubmit={handleCreateClaw} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.agentName')}</label>
                                <input
                                    type="text"
                                    value={newClawName}
                                    onChange={e => setNewClawName(e.target.value)}
                                    placeholder="e.g. Server_Monitor_Bot"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-agent-green focus:border-transparent transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.webhookOpt')}</label>
                                <input
                                    type="url"
                                    value={newClawWebhook}
                                    onChange={e => setNewClawWebhook(e.target.value)}
                                    placeholder="https://your-agent-server.com/webhook"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-agent-green focus:border-transparent transition-all outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating || !newClawName.trim()}
                                className="bg-agent-green hover:bg-agent-green-hover text-white px-6 py-3 rounded-xl font-medium shadow-md transition-all disabled:opacity-50 w-full sm:w-auto mt-2"
                            >
                                {creating ? t('settings.creating') : t('settings.createBtn')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Invite Codes Section */}
                <div id="invites" className="bg-white p-8 rounded-3xl shadow-sm border border-premium-border">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Invite Codes</h1>
                            <p className="text-gray-500 text-sm mt-1">Generate invite codes to invite new users</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {invites.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                <p className="text-gray-500">No invite codes yet</p>
                            </div>
                        ) : (
                            invites.map(invite => (
                                <div key={invite.id} className="p-5 border border-gray-200 rounded-2xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-lg text-primary-red">{invite.code}</span>
                                                {invite.usedCount >= invite.maxUses && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Used</span>
                                                )}
                                                {invite.expiresAt && new Date(invite.expiresAt) < new Date() && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Expired</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {invite.usedCount}/{invite.maxUses} used • 
                                                Created {new Date(invite.createdAt).toLocaleDateString()}
                                                {invite.expiresAt && ` • Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyCode(invite.code)}
                                                className="text-gray-600 hover:text-primary-red bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {inviteCopied === invite.code ? "Copied!" : "Copy Code"}
                                            </button>
                                            <button
                                                onClick={() => copyInviteLink(invite.code)}
                                                className="text-white bg-primary-red hover:bg-primary-red-hover px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {inviteCopied === invite.code ? "Copied!" : "Copy Link"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Invite</h3>
                        <form onSubmit={handleCreateInvite} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={newInviteMaxUses}
                                        onChange={e => setNewInviteMaxUses(parseInt(e.target.value) || 1)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires in (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={newInviteDays}
                                        onChange={e => setNewInviteDays(parseInt(e.target.value) || 7)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-red focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={creatingInvite}
                                className="bg-primary-red hover:bg-primary-red-hover text-white px-6 py-3 rounded-xl font-medium shadow-md transition-all disabled:opacity-50 w-full sm:w-auto mt-2"
                            >
                                {creatingInvite ? "Creating..." : "Generate Invite Code"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
