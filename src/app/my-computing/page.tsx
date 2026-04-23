"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

interface Instance {
  id: string; gpuName: string; sshHost: string; sshPort: number;
  sshUser: string; sshPassword: string; status: string;
  expiresAt: string; createdAt: string;
  product: { vram: string; cudaCores: number; specs: any };
  order: { plan: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  RUNNING:    { label: "运行中", color: "text-agent-green",  bg: "bg-agent-green/10"  },
  STOPPED:    { label: "已停止", color: "text-yellow-600",   bg: "bg-yellow-100"      },
  PENDING:    { label: "开通中", color: "text-blue-600",    bg: "bg-blue-100"        },
  TERMINATED: { label: "已终止", color: "text-gray-500",     bg: "bg-gray-100"        },
};

export default function MyComputingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "all">("active");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login?redirect=/my-computing"); return; }
    if (!user) return;
    fetch("/api/gpu/instances", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
    })
      .then(r => r.json())
      .then(d => { setInstances(d.instances || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, authLoading, router]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "已到期";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
  };

  const visible = tab === "all" ? instances : instances.filter(i => i.status === "RUNNING");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-premium-text">🎮 我的算力</h1>
          <p className="text-premium-text-muted text-sm mt-1">管理您的 GPU 实例和访问凭证</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setTab("active")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === "active" ? "bg-primary-red text-white" : "bg-premium-bg text-premium-text-muted border border-premium-border"}`}>
            运行中
          </button>
          <button onClick={() => setTab("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === "all" ? "bg-primary-red text-white" : "bg-premium-bg text-premium-text-muted border border-premium-border"}`}>
            全部实例
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-2 border-primary-red border-t-transparent rounded-full"/>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 bg-premium-card rounded-2xl border border-premium-border">
          <div className="text-5xl mb-4">🖥️</div>
          <h2 className="text-xl font-bold text-premium-text mb-2">暂无算力实例</h2>
          <p className="text-premium-text-muted mb-4">您还没有激活的 GPU 实例</p>
          <button onClick={() => router.push("/gpu-rental")}
            className="px-6 py-2.5 bg-primary-red text-white rounded-full font-medium hover:bg-primary-red-hover transition-colors">
            立即租用 →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(inst => {
            const cfg = STATUS_CONFIG[inst.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={inst.id} className="bg-premium-card border border-premium-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-premium-border bg-premium-bg/50">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🖥️</div>
                    <div>
                      <div className="font-bold text-premium-text">{inst.gpuName}</div>
                      <div className="text-xs text-premium-text-muted">
                        {inst.product?.vram} · {inst.product?.cudaCores} CUDA
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    {inst.status === "RUNNING" && (
                      <span className="text-xs text-premium-text-muted">剩余 {timeLeft(inst.expiresAt)}</span>
                    )}
                  </div>
                </div>

                {inst.status === "RUNNING" && (
                  <div className="px-6 py-4">
                    <p className="text-xs font-medium text-premium-text-muted mb-3 uppercase tracking-wider">访问凭证</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "主机地址", value: inst.sshHost },
                        { label: "端口", value: String(inst.sshPort) },
                        { label: "用户名", value: inst.sshUser },
                        { label: "密码", value: inst.sshPassword },
                      ].map(item => (
                        <div key={item.label} className="bg-premium-bg rounded-lg px-3 py-2">
                          <div className="text-xs text-premium-text-muted mb-0.5">{item.label}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono font-semibold text-premium-text truncate mr-2">{item.value}</span>
                            <button onClick={() => copy(item.value, inst.id + item.label)}
                              className="text-primary-red hover:text-primary-red-hover text-xs flex-shrink-0">
                              {copiedId === inst.id + item.label ? "✓" : "复制"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700">
                      💡 连接命令：
                      <code className="font-mono bg-blue-100 px-1 rounded ml-1">
                        ssh {inst.sshUser}@{inst.sshHost} -p {inst.sshPort}
                      </code>
                      <button onClick={() => copy(`ssh ${inst.sshUser}@${inst.sshHost} -p ${inst.sshPort}`, inst.id + "cmd")}
                        className="ml-2 text-primary-red text-xs">
                        {copiedId === inst.id + "cmd" ? "已复制!" : "复制"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && instances.length > 0 && (
        <div className="mt-8 text-center">
          <button onClick={() => router.push("/gpu-rental")}
            className="px-6 py-2.5 border-2 border-primary-red text-primary-red rounded-full font-medium hover:bg-primary-red hover:text-white transition-colors">
            + 扩容 / 新增实例
          </button>
        </div>
      )}
    </div>
  );
}
