"use client";

import { useState } from "react";

export default function GPURentalPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gpu: "",
    hours: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const gpus = [
    {
      name: "Tesla T4",
      vram: "16GB GDDR6",
      cuda: "2560",
      price: 8,
      available: true,
      features: ["Stable Diffusion", "Llama 大模型推理", "模型微调 (LoRA)", "视频渲染", "AI 推理服务"],
      specs: {
        "核心频率": "585 MHz",
        "显存带宽": "320 GB/s",
        "TDP": "70W",
        "接口": "PCIe 3.0 x16",
        "驱动": "CUDA 12.x",
      },
    },
    {
      name: "Tesla T4",
      vram: "16GB GDDR6",
      cuda: "2560",
      price: 8,
      available: true,
      features: ["同规格第二张卡", "可组成集群", "并行计算"],
      specs: {
        "核心频率": "585 MHz",
        "显存带宽": "320 GB/s",
        "TDP": "70W",
        "接口": "PCIe 3.0 x16",
        "驱动": "CUDA 12.x",
      },
    },
  ];

  const faqs = [
    {
      q: "如何计费？",
      a: "按小时计费，不满1小时按1小时计算。长期租用（>100小时/月）可享折扣。",
    },
    {
      q: "支持哪些框架？",
      a: "支持 PyTorch、TensorFlow、JAX、vLLM、Ollama 等所有主流深度学习框架。CUDA 12.x 驱动已预装。",
    },
    {
      q: "数据安全吗？",
      a: "您的数据仅存储在您指定的目录下，任务结束后可选择删除。所有数据传输使用加密通道。",
    },
    {
      q: "可以并发使用多卡吗？",
      a: "可以，支持多卡并行调度，适合分布式训练和大批量推理任务。",
    },
    {
      q: "遇到问题怎么办？",
      a: "提供即时技术支持，可通过微信/邮件联系，我们提供 9:00-22:00 人工响应。",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-red/10 text-primary-red text-sm font-medium mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          GPU 算力出租服务
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-premium-text mb-4">
          专业 GPU 算力
          <span className="text-primary-red"> 按需租用</span>
        </h1>
        <p className="text-xl text-premium-text-muted max-w-2xl mx-auto mb-8">
          基于 Tesla T4 16GB 显卡，灵活计费，即开即用<br />
          支持大模型推理、Stable Diffusion、模型训练与微调
        </p>
        <div className="flex justify-center gap-4">
          <a href="#pricing" className="px-8 py-3 bg-primary-red text-white font-semibold rounded-lg hover:bg-primary-red-hover transition-colors">
            查看价格
          </a>
          <a href="#contact" className="px-8 py-3 border-2 border-primary-red text-primary-red font-semibold rounded-lg hover:bg-primary-red hover:text-white transition-colors">
            立即咨询
          </a>
        </div>
      </div>

      {/* GPU Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-16" id="gpus">
        {gpus.map((gpu, i) => (
          <div key={i} className="bg-premium-card rounded-xl border border-premium-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-premium-text">{gpu.name}</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-agent-green/10 text-agent-green">
                      可用
                    </span>
                  </div>
                  <p className="text-premium-text-muted">{gpu.vram} · CUDA {gpu.cuda} 核心</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-red">¥{gpu.price}</div>
                  <div className="text-sm text-premium-text-muted">/ 小时</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(gpu.specs).map(([k, v]) => (
                  <div key={k} className="bg-premium-bg rounded-lg px-3 py-2">
                    <div className="text-xs text-premium-text-muted">{k}</div>
                    <div className="text-sm font-semibold text-premium-text">{v}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-premium-text">适用场景：</p>
                <div className="flex flex-wrap gap-2">
                  {gpu.features.map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-premium-bg text-sm text-premium-text-muted border border-premium-border">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="bg-premium-card rounded-xl border border-premium-border p-8 mb-16" id="pricing">
        <h2 className="text-2xl font-bold text-premium-text mb-6 text-center">价格方案</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-premium-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-premium-text mb-2">按需计费</h3>
            <div className="text-3xl font-bold text-primary-red mb-1">¥8<span className="text-base font-normal text-premium-text-muted">/小时/卡</span></div>
            <p className="text-sm text-premium-text-muted mb-4">无最低消费，灵活使用</p>
            <ul className="space-y-2 text-sm text-premium-text">
              <li className="flex items-center gap-2">✓ Tesla T4 16GB</li>
              <li className="flex items-center gap-2">✓ CUDA 环境已配置</li>
              <li className="flex items-center gap-2">✓ 技术支持</li>
            </ul>
          </div>
          <div className="border-2 border-primary-red rounded-xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-red text-white text-xs font-bold rounded-full">推荐</div>
            <h3 className="text-lg font-bold text-premium-text mb-2">包周套餐</h3>
            <div className="text-3xl font-bold text-primary-red mb-1">¥300<span className="text-base font-normal text-premium-text-muted">/周/卡</span></div>
            <p className="text-sm text-premium-text-muted mb-4">平均 ¥6/小时，省 25%</p>
            <ul className="space-y-2 text-sm text-premium-text">
              <li className="flex items-center gap-2">✓ 7×24 不限时使用</li>
              <li className="flex items-center gap-2">✓ 优先调度</li>
              <li className="flex items-center gap-2">✓ 优先技术支持</li>
            </ul>
          </div>
          <div className="border border-premium-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-premium-text mb-2">包月套餐</h3>
            <div className="text-3xl font-bold text-primary-red mb-1">¥999<span className="text-base font-normal text-premium-text-muted">/月/卡</span></div>
            <p className="text-sm text-premium-text-muted mb-4">平均 ¥5/小时，省 37%</p>
            <ul className="space-y-2 text-sm text-premium-text">
              <li className="flex items-center gap-2">✓ 30×24 不限时使用</li>
              <li className="flex items-center gap-2">✓ 专属 GPU 队列</li>
              <li className="flex items-center gap-2">✓ 7×12 专属支持</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-premium-text-muted mt-4">
          企业/大批量使用另有优惠，请联系详谈
        </p>
      </div>

      {/* How to use */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-premium-text mb-8 text-center">如何租用</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "提交申请", desc: "填写表单或微信联系，说明您的使用需求（模型类型、预计时长、是否需要并发）" },
            { step: "02", title: "账户充值", desc: "确认价格后，通过微信/支付宝预充值，我们开通对应时长" },
            { step: "03", title: "连接 GPU", desc: "获得 SSH 访问凭证，连接 GPU 服务器，开始使用" },
            { step: "04", title: "使用 & 结算", desc: "按实际使用时长结算，超出预付时长自动暂停，透明计费" },
          ].map((item) => (
            <div key={item.step} className="bg-premium-card border border-premium-border rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-primary-red/10 text-primary-red rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-bold text-premium-text mb-2">{item.title}</h3>
              <p className="text-sm text-premium-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-premium-text mb-8 text-center">常见问题</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-premium-card border border-premium-border rounded-lg group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-premium-text hover:text-primary-red list-none flex justify-between items-center">
                {faq.q}
                <span className="text-premium-text-muted group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-6 pb-4 text-premium-text-muted text-sm leading-relaxed border-t border-premium-border pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-premium-card rounded-xl border border-premium-border p-8" id="contact">
        <h2 className="text-2xl font-bold text-premium-text mb-2 text-center">立即咨询 / 预约试用</h2>
        <p className="text-premium-text-muted text-center mb-8">填写以下信息，我们会尽快与您联系（通常 2 小时内）</p>

        {submitted ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-agent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-agent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-premium-text mb-2">提交成功！</h3>
            <p className="text-premium-text-muted mb-4">
              您的咨询信息已收到，我们会在 <strong>2 小时内</strong>通过邮件或微信与您联系。
            </p>
            <button onClick={() => setSubmitted(false)} className="text-primary-red underline text-sm">
              继续填写
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-premium-text mb-1">您的姓名 *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-premium-border rounded-lg bg-premium-bg focus:outline-none focus:ring-2 focus:ring-primary-red/30 focus:border-primary-red transition-colors"
                  placeholder="张三"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-premium-text mb-1">邮箱 *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2.5 border border-premium-border rounded-lg bg-premium-bg focus:outline-none focus:ring-2 focus:ring-primary-red/30 focus:border-primary-red transition-colors"
                  placeholder="zhangsan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-premium-text mb-1">需要的 GPU</label>
                <select
                  className="w-full px-4 py-2.5 border border-premium-border rounded-lg bg-premium-bg focus:outline-none focus:ring-2 focus:ring-primary-red/30 focus:border-primary-red transition-colors"
                  value={formData.gpu}
                  onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
                >
                  <option value="">选择 GPU 类型</option>
                  <option value="t4-1">Tesla T4 × 1</option>
                  <option value="t4-2">Tesla T4 × 2</option>
                  <option value="t4-cluster">Tesla T4 集群（多卡）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-premium-text mb-1">预计使用时长</label>
                <select
                  className="w-full px-4 py-2.5 border border-premium-border rounded-lg bg-premium-bg focus:outline-none focus:ring-2 focus:ring-primary-red/30 focus:border-primary-red transition-colors"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                >
                  <option value="">选择时长</option>
                  <option value="1-10">1-10 小时（试用）</option>
                  <option value="10-50">10-50 小时</option>
                  <option value="50-200">50-200 小时</option>
                  <option value="200+">200+ 小时（企业级）</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-premium-text mb-1">使用场景 / 需求描述</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2.5 border border-premium-border rounded-lg bg-premium-bg focus:outline-none focus:ring-2 focus:ring-primary-red/30 focus:border-primary-red transition-colors resize-none"
                placeholder="请描述您的使用场景，例如：运行 Stable Diffusion XL 生成图片、部署 Llama3-8B 推理服务等"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <div className="text-center pt-2">
              <button
                type="submit"
                className="px-10 py-3 bg-primary-red text-white font-semibold rounded-lg hover:bg-primary-red-hover transition-colors shadow-sm"
              >
                提交咨询
              </button>
              <p className="text-xs text-premium-text-muted mt-2">
                提交即表示同意我们的服务条款
              </p>
            </div>
          </form>
        )}
      </div>

      {/* WeChat CTA */}
      <div className="mt-8 bg-gradient-to-r from-primary-red/5 to-red-700/5 rounded-xl border border-primary-red/20 p-8 text-center">
        <h3 className="text-xl font-bold text-premium-text mb-2">微信快速联系</h3>
        <p className="text-premium-text-muted mb-4">扫码添加微信，实时沟通算力需求</p>
        <div className="inline-flex items-center gap-3 bg-white rounded-lg border border-premium-border px-6 py-3">
          <div className="w-10 h-10 bg-agent-green/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-agent-green" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-premium-text">客服微信</p>
            <p className="text-xs text-premium-text-muted">工作时间 9:00-22:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
