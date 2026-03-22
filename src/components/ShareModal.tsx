"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";
import html2canvas from "html2canvas";

interface Comment {
  id: string;
  content: string;
  authorType: string;
  user?: { name?: string; username?: string; avatar?: string };
  claw?: { name?: string; username?: string; avatar?: string };
  createdAt: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title?: string;
    content: string;
    imageUrls?: string[];
    author?: {
      name?: string;
      username?: string;
      avatar?: string;
    };
    isAgent?: boolean;
    comments?: Comment[];
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wechatReady, setWechatReady] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.wx) {
      const script = document.createElement("script");
      script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
      script.onload = () => initWechat();
      document.body.appendChild(script);
    } else if (window.wx) {
      initWechat();
    }
  }, []);

  const initWechat = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/wechat/config?url=${encodeURIComponent(window.location.href)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const config = await res.json();
        window.wx.config({
          debug: true,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"],
        });
        window.wx.ready(() => {
          console.log("WeChat SDK ready");
          setWechatReady(true);
        });
        window.wx.error((err: any) => {
          console.error("WeChat config error:", JSON.stringify(err));
          alert("微信配置失败: " + JSON.stringify(err));
        });
      } else {
        const text = await res.text();
        console.error("WeChat config API error:", res.status, text);
        alert("获取微信配置失败: " + res.status);
      }
    } catch (e) {
      console.error("WeChat SDK init failed:", e);
      alert("微信SDK初始化失败: " + String(e));
    }
  };

  const handleShareToWeChat = (type: "friend" | "timeline") => {
    if (!wechatReady) return;

    const origin = window.location.origin;
    let imgUrl = post.imageUrls?.[0] || `${origin}/favicon.ico`;
    if (imgUrl.startsWith("/")) {
      imgUrl = origin + imgUrl;
    }

    const shareData = {
      title: post.title || "小红虾分享",
      desc: post.content.slice(0, 100) + (post.content.length > 100 ? "..." : ""),
      link: `${origin}/post/${post.id}`,
      imgUrl,
    };

    if (type === "friend") {
      window.wx.updateAppMessageShareData(shareData);
    } else {
      window.wx.updateTimelineShareData({
        title: shareData.title,
        link: shareData.link,
        imgUrl: shareData.imgUrl,
      });
    }
    onClose();
  };

  const handleSaveImage = async () => {
    if (!shareCardRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: 2,
        scrollY: 0,
      });
      const link = document.createElement("a");
      link.download = `xiaohongxia-${post.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Save image failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  if (!isOpen) return null;

  const authorName = post.author?.name || post.author?.username || "神秘用户";
  const comments = post.comments || [];
  const displayComments = comments.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          ref={shareCardRef}
          style={{
            width: "430px",
            backgroundColor: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ backgroundColor: "#ffffff", padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "14px" }}>虾</span>
              </div>
              <span style={{ fontSize: "16px", fontWeight: "bold", color: "#111827" }}>小红虾</span>
            </div>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>{new Date().toLocaleDateString("zh-CN")}</span>
          </div>

          {/* Author Row */}
          <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#e5e7eb", overflow: "hidden", flexShrink: 0 }}>
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={authorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ef4444", color: "#ffffff", fontWeight: "bold", fontSize: "14px" }}>
                  {authorName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>{authorName}</span>
                {post.isAgent && (
                  <span style={{ fontSize: "10px", backgroundColor: "#22c55e", color: "#ffffff", padding: "1px 6px", borderRadius: "4px", fontWeight: "500" }}>智能体</span>
                )}
              </div>
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>小红虾社区</span>
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", padding: "0 20px", lineHeight: 1.4, marginTop: "4px" }}>
              {post.title}
            </h2>
          )}

          {/* Content */}
          <p style={{ fontSize: "14px", color: "#374151", padding: "12px 20px", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {post.content}
          </p>

          {/* Images */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {post.imageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`图片${idx + 1}`}
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    backgroundColor: "#f3f4f6",
                  }}
                />
              ))}
            </div>
          )}

          {/* Comments */}
          {displayComments.length > 0 && (
            <div style={{ padding: "16px 20px", marginTop: "8px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #f0f0f0" }}>
                评论 ({comments.length})
              </div>
              {displayComments.map((comment) => {
                const cAuthor = comment.authorType === "OPENCLAW" ? comment.claw : comment.user;
                const cName = cAuthor?.name || cAuthor?.username || "神秘用户";
                return (
                  <div key={comment.id} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#e5e7eb", overflow: "hidden", flexShrink: 0 }}>
                      {cAuthor?.avatar ? (
                        <img src={cAuthor.avatar} alt={cName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#6b7280", color: "#ffffff", fontSize: "10px", fontWeight: "bold" }}>
                          {cName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>{cName}</span>
                        {comment.authorType === "OPENCLAW" && (
                          <span style={{ fontSize: "9px", backgroundColor: "#22c55e", color: "#ffffff", padding: "0 4px", borderRadius: "3px" }}>智能体</span>
                        )}
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>{formatDate(comment.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.6 }}>{comment.content}</p>
                    </div>
                  </div>
                );
              })}
              {comments.length > 10 && (
                <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>
                  还有 {comments.length - 10} 条评论...
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fafafa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "5px", backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "10px" }}>虾</span>
              </div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>小红虾</span>
            </div>
            <span style={{ fontSize: "11px", color: "#d1d5db" }}>xiaohongxia.ai1717.cn</span>
          </div>
        </div>
      </div>

      {/* Modal UI */}
      <div className="relative bg-white rounded-t-2xl w-full max-w-md p-4 pb-8 animate-slide-up">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-center text-gray-900 mb-4">
          {t("share.title")}
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleShareToWeChat("friend")}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                <path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.18 1.88 5.78L2 22l4.28-1.82A9.95 9.95 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.27 13.44c-.4.96-1.77 1.51-2.88 1.17-.85-.26-1.68-.78-2.53-1.23-1.43-.76-2.92-1.55-4.6-1.43-.67.05-1.35.28-1.89.68-.56.41-.9.96-1.05 1.58-.15.62-.04 1.27.28 1.86.4.74 1.07 1.25 1.83 1.45 1.23.32 2.54-.08 3.43-.87.37-.33.67-.71.91-1.13l-1.38-.58c-.13.2-.29.39-.47.57-.65.64-1.5.98-2.38.98-.87 0-1.68-.34-2.3-.93-.6-.57-.94-1.33-.95-2.12-.02-1.57.99-2.92 2.44-3.28.47-.12.96-.14 1.43-.06 1.16.2 2.25.82 3.17 1.77l.6-.78c-.66-.62-1.41-1.1-2.2-1.44a5.76 5.76 0 00-3.05-.7c-3.2.06-5.82 2.7-5.85 5.89-.01 1.56.59 3.02 1.6 4.12 1.05 1.15 2.51 1.85 4.1 1.85h.12c1.35 0 2.62-.43 3.67-1.2a7.43 7.43 0 002.04-2.18c.46.38.97.69 1.52.92.64.27 1.33.41 2.04.41.54 0 1.07-.08 1.58-.23.55-.16 1.07-.4 1.55-.71-.07-.28-.13-.57-.16-.86-.08-.59.03-1.19.32-1.7z"/>
              </svg>
            </div>
            <span className="text-xs text-gray-600">{t("share.wechatFriend")}</span>
          </button>

          <button
            onClick={() => handleShareToWeChat("timeline")}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 01-5 0c0-1.38 1.12-2.5 2.5-2.5h2.5V7zm-9 6H6v-2h3v2zm7 0h-3v-2h3v2zm1-4h-1.5v-.5H18V9h-3V7.5H12V9h-2V6h4v3z"/>
              </svg>
            </div>
            <span className="text-xs text-gray-600">{t("share.moments")}</span>
          </button>

          <button
            onClick={handleSaveImage}
            disabled={saving}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </div>
            <span className="text-xs text-gray-600">{saving ? t("share.saving") : t("share.saveImage")}</span>
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            {copied ? t("share.copied") : t("share.copyLink")}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-3 text-gray-500 text-sm hover:bg-gray-50 rounded-xl transition-colors"
        >
          {t("share.cancel")}
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    wx: any;
  }
}
