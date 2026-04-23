"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

interface GpuProduct {
  id: string; name: string; gpuType: string; vram: string; cudaCores: number;
  pricePerHour: number; stock: number; features: string[]; specs: any;
}

const PRICE_TABLE: Record<string, Record<string, number>> = {
  "Tesla T4 × 1":              { hourly: 8,   weekly: 300,  monthly: 999  },
  "Tesla T4 × 2 (双卡集群)":   { hourly: 15,  weekly: 560,  monthly: 1899 },
  "A100 40GB":                 { hourly: 28,  weekly: 980,  monthly: 3200 },
};

const PLAN_LABELS: Record<string, string> = {
  hourly: "按小时", weekly: "包周套餐", monthly: "包月套餐"
};

export default function GPURentalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<GpuProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<GpuProduct | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("hourly");
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetch("/api/gpu/products")
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getPrice = (productName: string, plan: string) =>
    PRICE_TABLE[productName]?.[plan] || 0;

  const totalAmount = selectedProduct
    ? getPrice(selectedProduct.name, selectedPlan) * quantity
    : 0;

  const handleOrder = async () => {
    if (!user) { router.push("/login?redirect=/gpu-rental"); return; }
    if (!selectedProduct) return;
    setOrdering(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/gpu/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan, productId: selectedProduct.id, quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "下单失败");
      // Mock pay
      const payRes = await fetch(`/api/gpu/orders/${data.orderId}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "支付失败");
      router.push("/my-computing");
    } catch (e: any) {
      alert(e.message);
      setOrdering(false);
    }
  };

  const faqs = [
    { q: "如何计费？", a: "按所选套餐计费，包周/包月平均每小时更低。按小时付费最低 ¥8/小时起。" },
    { q: "支持哪些框架？", a: "支持 PyTorch、TensorFlow、JAX、vLLM、Ollama 等所有主流框架，CUDA 12.x 已预装。" },
    { q: "数据安全吗？", a: "您的数据仅存储在您指定的目录下，任务结束后可选择删除。所有数据传输使用加密通道。" },
    { q: "可以退款吗？", a: "未使用的时长可申请退款，请联系客服处理（工作日 24 小时内响应）。" },
    { q: "遇到问题怎么办？", a: "提供 9:00-22:00 技术支持，可通过微信或工单系统联系我们。" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center py-12 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-red/10 text-primary-red text-sm font-medium mb-4">
          🖥️ GPU 算力出租
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-premium-text mb-3">
          专业 GPU 算力 <span className="text-primary-red">按需租用</span>
        </h1>
        <p className="text-premium-text-muted max-w-xl mx-auto">
          Tesla T4 / A100 显卡，分钟级开通，即开即用<br/>
          支持大模型推理、Stable Diffusion、模型训练与微调
        </p>
        {user && (
          <a href="/my-computing" className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-agent-green/10 text-agent-green rounded-full text-sm font-medium hover:bg-agent-green/20 transition-colors">
            🎮 我的算力 → 查看我的实例
          </a>
        )}
      </div>

      {/* Main content: products + order form */}
      <div className="grid lg:grid-cols-5 gap-6 mb-12">
        {/* Product list */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-bold text-premium-text mb-4">选择 GPU 规格</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-red border-t-transparent rounded-full"/>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-premium-card border border-premium-border rounded-xl p-8 text-center">
              <p className="text-premium-text-muted">暂无产品，请联系客服开通</p>
            </div>
          ) : products.map(p => (
            <div key={p.id}
              className={`bg-premium-card border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${selectedProduct?.id === p.id ? "border-primary-red shadow-md" : "border-premium-border"}`}
              onClick={() => setSelectedProduct(p)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-premium-text">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.stock > 3 ? "bg-agent-green/10 text-agent-green" : "bg-yellow-100 text-yellow-700"}`}>
                      {p.stock > 3 ? "充足" : `仅剩 ${p.stock}`}
                    </span>
                  </div>
                  <p className="text-sm text-premium-text-muted">{p.vram} · {p.cudaCores} CUDA 核心</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-red">¥{p.pricePerHour}</div>
                  <div className="text-xs text-premium-text-muted">/ 小时</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {Object.entries(p.specs || {}).map(([k, v]) => (
                  <div key={k} className="bg-premium-bg rounded px-2 py-1 text-center">
                    <div className="text-xs text-premium-text-muted">{k}</div>
                    <div className="text-xs font-semibold text-premium-text truncate">{String(v)}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(p.features || []).map(f => (
                  <span key={f} className="px-2 py-0.5 rounded-full bg-premium-bg text-xs text-premium-text-muted border border-premium-border">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order panel */}
        <div className="lg:col-span-2">
          <div className="bg-premium-card border border-premium-border rounded-xl p-6 sticky top-20">
            <h3 className="text-lg font-bold text-premium-text mb-4">📋 订单确认</h3>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-premium-text-muted mb-3">请先登录后再下单</p>
                <button onClick={() => router.push("/login?redirect=/gpu-rental")}
                  className="w-full py-2.5 bg-primary-red text-white rounded-lg font-medium hover:bg-primary-red-hover transition-colors">
                  登录 / 注册
                </button>
              </div>
            ) : !selectedProduct ? (
              <div className="text-center py-6">
                <p className="text-premium-text-muted">👈 请先选择一个 GPU 规格</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-premium-bg rounded-lg p-3">
                  <div className="text-sm text-premium-text-muted mb-1">已选产品</div>
                  <div className="font-bold text-premium-text">{selectedProduct.name}</div>
                  <div className="text-sm text-premium-text-muted">{selectedProduct.vram}</div>
                </div>

                {/* Plan selector */}
                <div>
                  <label className="text-sm font-medium text-premium-text mb-2 block">选择套餐</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["hourly", "weekly", "monthly"] as const).map(key => {
                      const price = getPrice(selectedProduct.name, key);
                      return (
                        <button key={key}
                          onClick={() => setSelectedPlan(key)}
                          className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${selectedPlan === key ? "border-primary-red bg-primary-red/5 text-primary-red" : "border-premium-border text-premium-text-muted hover:border-gray-300"}`}
                        >
                          <div>{PLAN_LABELS[key]}</div>
                          <div className="font-bold text-xs">¥{price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium text-premium-text mb-2 block">购买数量（卡）</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 rounded-lg border border-premium-border flex items-center justify-center text-premium-text hover:bg-premium-bg">−</button>
                    <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                      className="w-9 h-9 rounded-lg border border-premium-border flex items-center justify-center text-premium-text hover:bg-premium-bg">+</button>
                    <span className="text-sm text-premium-text-muted ml-2">共 {quantity} 卡</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-premium-border pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-premium-text-muted">套餐价格</span>
                    <span className="text-premium-text">¥{getPrice(selectedProduct.name, selectedPlan)} × {quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-premium-text">应付总额</span>
                    <span className="text-2xl font-bold text-primary-red">¥{totalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={ordering}
                  className="w-full py-3 bg-primary-red text-white rounded-lg font-bold hover:bg-primary-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {ordering ? "处理中..." : "立即下单（演示模式）"}
                </button>
                <p className="text-xs text-premium-text-muted text-center">点击后自动开通 GPU 实例并跳转控制台</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-premium-text mb-6 text-center">使用流程</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "选择规格", desc: "选择 GPU 类型和套餐，立即下单" },
            { step: "02", title: "自动开通", desc: "支付成功后，GPU 实例分钟级自动开通" },
            { step: "03", title: "连接使用", desc: "获得 SSH 凭证，连接 GPU 开始计算" },
            { step: "04", title: "到期释放", desc: "到期后实例自动停止，数据保留 7 天" },
          ].map(item => (
            <div key={item.step} className="bg-premium-card border border-premium-border rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-primary-red/10 text-primary-red rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">{item.step}</div>
              <h3 className="font-bold text-premium-text mb-1">{item.title}</h3>
              <p className="text-sm text-premium-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-premium-text mb-6 text-center">常见问题</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-premium-card border border-premium-border rounded-lg group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-premium-text hover:text-primary-red list-none flex justify-between items-center">
                {faq.q}
                <span className="text-premium-text-muted group-open:rotate-45 transition-transform font-bold">+</span>
              </summary>
              <div className="px-6 pb-4 text-premium-text-muted text-sm leading-relaxed border-t border-premium-border pt-3">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
