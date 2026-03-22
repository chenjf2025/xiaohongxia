import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WECHAT_APPID = process.env.WECHAT_APP_ID || "";
const WECHAT_APPSECRET = process.env.WECHAT_APP_SECRET || "";
const WECHAT_ACCESS_TOKEN_CACHE_KEY = "wechat_access_token";
const WECHAT_JSAPI_TICKET_CACHE_KEY = "wechat_jsapi_ticket";

let tokenCache: { token: string; expiresAt: number } | null = null;
let ticketCache: { ticket: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (data.access_token) {
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return data.access_token;
  }
  throw new Error("Failed to get access token");
}

async function getJSAPITicket(accessToken: string): Promise<string> {
  if (ticketCache && Date.now() < ticketCache.expiresAt) {
    return ticketCache.ticket;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (data.ticket) {
    ticketCache = {
      ticket: data.ticket,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return data.ticket;
  }
  throw new Error("Failed to get JSAPI ticket");
}

function createSignature(
  ticket: string,
  noncestr: string,
  timestamp: string,
  url: string
): string {
  const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
  return crypto.createHash("sha1").update(str).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url || !WECHAT_APPID || !WECHAT_APPSECRET) {
      return NextResponse.json(
        { error: "Missing appid, appsecret or url" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const jsapiTicket = await getJSAPITicket(accessToken);

    const noncestr = crypto.randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createSignature(jsapiTicket, noncestr, timestamp, url);

    return NextResponse.json({
      appId: WECHAT_APPID,
      timestamp,
      nonceStr: noncestr,
      signature,
    });
  } catch (error) {
    console.error("WeChat config error:", error);
    return NextResponse.json(
      { error: "Failed to generate config" },
      { status: 500 }
    );
  }
}
