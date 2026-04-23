import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.gpuProduct.count();
  if (count > 0) { console.log("Already seeded (" + count + " products)"); return; }
  const products = [
    { name: "Tesla T4 x 1", gpuType: "Tesla T4", vram: "16GB GDDR6", cudaCores: 2560, pricePerHour: 8, stock: 10,
      features: ["Stable Diffusion", "Llama 大模型推理", "模型微调 (LoRA)", "视频渲染", "AI 推理服务"],
      specs: { "核心频率": "585 MHz", "显存带宽": "320 GB/s", "TDP": "70W", "接口": "PCIe 3.0 x16", "驱动": "CUDA 12.x" } },
    { name: "Tesla T4 x 2 (双卡集群)", gpuType: "Tesla T4 x 2", vram: "32GB GDDR6", cudaCores: 5120, pricePerHour: 15, stock: 5,
      features: ["分布式训练", "大批量推理", "并行计算", "双卡加速"],
      specs: { "核心频率": "585 MHz", "显存带宽": "640 GB/s", "TDP": "140W", "接口": "PCIe 3.0 x16 x2", "驱动": "CUDA 12.x" } },
    { name: "A100 40GB", gpuType: "A100-SXM4-40GB", vram: "40GB HBM2", cudaCores: 6912, pricePerHour: 28, stock: 2,
      features: ["大规模模型训练", "A100 大模型推理", "DeepSpeed", "加速计算"],
      specs: { "核心频率": "1.06 GHz", "显存带宽": "1.6 TB/s", "TDP": "400W", "接口": "SXM4", "驱动": "CUDA 12.x" } },
  ];
  for (const p of products) await prisma.gpuProduct.create({ data: p });
  console.log("Seeded " + products.length + " GPU products");
}
main().catch(console.error).finally(() => prisma.$disconnect());
