#!/usr/bin/env node
/**
 * 🔥 Greenhub 部署冒烟测试
 *
 * 用法:
 *   node scripts/smoke-test.mjs                          # 默认测 production
 *   node scripts/smoke-test.mjs https://preview-url.vercel.app
 *   SMOKE_JWT=eyJ... node scripts/smoke-test.mjs         # 带登录态测试
 *
 * 退出码: 0 = 全通过, 1 = 有失败
 */

const BASE = process.argv[2]?.replace(/\/$/, "") || "https://www.greenhub420.co.uk";
const JWT = process.env.SMOKE_JWT || "";
const AUTH = JWT ? { Authorization: `Bearer ${JWT}` } : {};

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, url, opts = {}) {
  const {
    method = "GET",
    body,
    expectStatus,        // number or array of acceptable status codes
    expectBodyContains,  // string that must appear in response body
    expectJson,          // function(json) => true/false
    headers = {},
    requireAuth = false,
  } = opts;

  if (requireAuth && !JWT) {
    console.log(`  ⏭️  ${name} — 跳过 (需要 SMOKE_JWT)`);
    return;
  }

  const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`;
  const fetchOpts = {
    method,
    headers: {
      Accept: "application/json",
      ...AUTH,
      ...headers,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    redirect: "manual",
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const res = await fetch(fullUrl, fetchOpts);
    const status = res.status;
    const acceptable = Array.isArray(expectStatus)
      ? expectStatus
      : expectStatus
        ? [expectStatus]
        : [200, 301, 302, 307, 308];

    let ok = acceptable.includes(status);
    let detail = `${status}`;

    if (ok && expectBodyContains) {
      const text = await res.text();
      if (!text.includes(expectBodyContains)) {
        ok = false;
        detail += ` (missing: "${expectBodyContains}")`;
      }
    }

    if (ok && expectJson) {
      const text = await res.clone().text();
      try {
        const json = JSON.parse(text);
        if (!expectJson(json)) {
          ok = false;
          detail += ` (JSON check failed)`;
        }
      } catch {
        ok = false;
        detail += ` (not valid JSON)`;
      }
    }

    if (ok) {
      passed++;
      console.log(`  ✅ ${name} — ${detail}`);
    } else {
      failed++;
      failures.push({ name, detail, url: fullUrl });
      console.log(`  ❌ ${name} — ${detail}`);
    }
  } catch (err) {
    failed++;
    const detail = err.message.substring(0, 80);
    failures.push({ name, detail, url: fullUrl });
    console.log(`  ❌ ${name} — ${detail}`);
  }
}

async function main() {
  console.log(`\n🔥 Greenhub 冒烟测试`);
  console.log(`   目标: ${BASE}`);
  console.log(`   登录: ${JWT ? "是" : "否 (设置 SMOKE_JWT 启用完整测试)"}`);
  console.log(`   时间: ${new Date().toISOString()}\n`);

  // ─── 1. 页面可访问 ───
  console.log("📄 页面渲染:");
  await check("首页", "/", { expectStatus: 200 });
  await check("产品列表", "/products", { expectStatus: 200 });
  await check("产品详情", "/products/midnight-gelato", { expectStatus: [200, 404] });
  await check("购物车", "/cart", { expectStatus: 200 });
  await check("登录", "/login", { expectStatus: 200 });
  await check("注册", "/register", { expectStatus: 200 });
  await check("钱包", "/wallet", { expectStatus: 200 });
  await check("转账", "/wallet/transfer", { expectStatus: 200 });
  await check("提现", "/wallet/withdraw", { expectStatus: 200 });
  await check("订单", "/orders", { expectStatus: 200 });
  await check("通知", "/account/notifications", { expectStatus: 200 });
  await check("Dashboard", "/dashboard", { expectStatus: 200 });
  await check("Checkout", "/checkout", { expectStatus: 200 });
  await check("Commission Hub", "/referral", { expectStatus: 200 });

  // ─── 2. 推荐链接 ───
  console.log("\n🔗 推荐链接:");
  await check("/ref/xxx redirect", "/ref/test123", {
    expectStatus: [307, 308],
  });
  await check("/invite 页面", "/invite?ref=test", { expectStatus: 200 });

  // ─── 3. Strapi proxy (GET) ───
  console.log("\n🔌 Strapi Proxy (公开):");
  await check("产品 API", "/api/strapi/api/products", {
    expectStatus: [200, 403],
    expectJson: (j) => Array.isArray(j?.data) || j?.error,
  });
  await check("Collections API", "/api/strapi/api/collections", {
    expectStatus: [200, 403, 404],
  });

  // ─── 4. Next.js 内部 API routes ───
  console.log("\n🔐 Next.js API (需登录):");
  await check("Auth /me", "/api/auth/me", {
    requireAuth: true,
    expectStatus: 200,
    expectJson: (j) => j?.id || j?.user?.id,
  });
  await check("Profile", "/api/account/profile", {
    requireAuth: true,
    expectStatus: [200, 401],
  });
  await check("Notifications", "/api/account/notifications", {
    requireAuth: true,
    expectStatus: 200,
    expectJson: (j) => Array.isArray(j?.data),
  });
  await check("Favorites", "/api/account/favorites", {
    requireAuth: true,
    expectStatus: [200, 404],
  });

  // ─── 5. Strapi proxy (需登录) ───
  console.log("\n💰 Strapi Proxy (需登录):");
  await check("钱包余额", "/api/strapi/api/wallet/balance", {
    requireAuth: true,
    expectStatus: 200,
    expectJson: (j) => typeof j?.balance === "number",
  });
  await check("交易记录", "/api/strapi/api/wallet/transactions?page=1&pageSize=1", {
    requireAuth: true,
    expectStatus: 200,
    expectJson: (j) => Array.isArray(j?.data),
  });
  await check("提现记录", "/api/strapi/api/account/withdrawals", {
    requireAuth: true,
    expectStatus: 200,
  });

  // ─── 6. POST 端点不返回 405 ───
  console.log("\n📮 POST 端点 (验证不返回 405):");
  await check("Transfer POST", "/api/account/transfers", {
    requireAuth: true,
    method: "POST",
    body: { toHandle: "__smoke_test__", amount: 1 },
    expectStatus: [400, 422], // 应返回业务错误, 不是 404/405
  });
  await check("Withdrawal POST", "/api/strapi/api/account/withdrawals", {
    requireAuth: true,
    method: "POST",
    body: { amount: 0 },
    expectStatus: [400, 422, 500], // 参数错误, 不是 404/405
  });

  // ─── 7. favicon ───
  console.log("\n🎨 静态资源:");
  await check("favicon", "/favicon.svg", { expectStatus: 200 });

  // ─── 结果 ───
  console.log(`\n${"═".repeat(40)}`);
  console.log(`  通过: ${passed}  失败: ${failed}`);
  if (failures.length) {
    console.log("\n  失败项:");
    for (const f of failures) {
      console.log(`    ❌ ${f.name}: ${f.detail}`);
      console.log(`       ${f.url}`);
    }
  }
  console.log(`${"═".repeat(40)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
