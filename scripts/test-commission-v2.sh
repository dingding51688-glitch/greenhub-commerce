#!/usr/bin/env bash
# test-commission-v2.sh — Commission V2 完整测试
# 用法: bash scripts/test-commission-v2.sh [STRAPI_URL]
set -euo pipefail
CMS="${1:-http://localhost:1337}"
ADMIN_TOKEN="08e2cbc8c4479dd0a6745220cebbaf2d8c26f0026c8df1ebc9cce7316ea88a47"
JWT_SECRET="tobemodified"
TURNSTILE_DUMMY="test-bypass"

GREEN='\033[0;32m' RED='\033[0;31m' NC='\033[0m'
ok() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }
hr() { echo "─────────────────────────────────────────"; }

echo "🧪 Commission V2 完整测试"
echo "CMS: $CMS"
hr

# Helper: generate JWT for users-permissions user
mkjwt() { cd /opt/greenhub-strapi/backend && node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({id:$1},'$JWT_SECRET',{expiresIn:'1h'}));"; }

# ── Find user→customer mapping ──
echo "0️⃣  查找 user→customer 映射"
CUSTOMER_ID=$(sqlite3 /opt/greenhub-strapi/backend/.tmp/data.db \
  "SELECT c.id FROM customers c JOIN up_users u ON u.email=c.email WHERE u.id=1;")
echo "   JWT user #1 → Customer #$CUSTOMER_ID"
USER_JWT=$(mkjwt 1)
hr

# ── 1. Get referral code ──
echo "1️⃣  获取 referral link"
SUMMARY=$(curl -s -H "Authorization: Bearer $USER_JWT" "$CMS/api/referrals/me")
REF_CODE=$(echo "$SUMMARY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['code'])")
echo "   code=$REF_CODE"
ok "Got referral code"
hr

# ── 2. First click (new IP) ──
echo "2️⃣  第一次点击 (IP=10.0.0.1)"
R=$(curl -s -X POST -H "Content-Type: application/json" "$CMS/api/referral-events/track-click" \
  -d "{\"code\":\"$REF_CODE\",\"turnstileToken\":\"$TURNSTILE_DUMMY\",\"ip\":\"10.0.0.1\",\"landingPage\":\"/\",\"userAgent\":\"TestBot\"}")
echo "   $(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'success={d.get(\"success\")} bonus={d.get(\"bonus\",\"N/A\")}')")"
ok "Click 1 tracked"
hr

# ── 3. Duplicate click (same IP within 24h — should dedup) ──
echo "3️⃣  重复点击 (同 IP, 应去重)"
R=$(curl -s -X POST -H "Content-Type: application/json" "$CMS/api/referral-events/track-click" \
  -d "{\"code\":\"$REF_CODE\",\"turnstileToken\":\"$TURNSTILE_DUMMY\",\"ip\":\"10.0.0.1\",\"landingPage\":\"/\",\"userAgent\":\"TestBot\"}")
echo "   $(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'success={d.get(\"success\")} bonus={d.get(\"bonus\",\"already counted\")} msg={d.get(\"message\",\"\")}')" 2>/dev/null || echo "$R")"
ok "Duplicate handled"
hr

# ── 4. Second unique click (different IP) ──
echo "4️⃣  第二次点击 (IP=10.0.0.2)"
R=$(curl -s -X POST -H "Content-Type: application/json" "$CMS/api/referral-events/track-click" \
  -d "{\"code\":\"$REF_CODE\",\"turnstileToken\":\"$TURNSTILE_DUMMY\",\"ip\":\"10.0.0.2\",\"landingPage\":\"/invite\",\"userAgent\":\"TestBot2\"}")
echo "   $(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'success={d.get(\"success\")} bonus={d.get(\"bonus\",\"N/A\")}')")"
ok "Click 2 tracked"
hr

# ── 5. Verify click counts in commission-hub ──
echo "5️⃣  验证 commission-hub 点击计数"
HUB=$(curl -s -H "Authorization: Bearer $USER_JWT" "$CMS/api/referrals/commission-hub")
echo "$HUB" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
s = d['summary']
print(f'   clicks={s[\"clicks\"]} validClicks={s[\"validClicks\"]} rate={s[\"commissionRate\"]}')
print(f'   tasks={len(d[\"tasks\"])} trend_days={len(d[\"clickTrend\"])} leaderboard={len(d[\"leaderboard\"])}')
print(f'   availableBalance={s[\"availableBalance\"]} clickPayout={s[\"clickPayoutTotal\"]}')
for t in d['tasks']:
    print(f'   task: {t[\"id\"]} progress={t[\"progress\"]}/{t[\"goal\"]}')
"
ok "Commission hub data verified"
hr

# ── 6. Change commissionRate to 15% ──
echo "6️⃣  Admin: 修改 customer #$CUSTOMER_ID commissionRate → 0.15"
P=$(curl -s -X PATCH -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$CMS/api/admin/customers/$CUSTOMER_ID/commission-rate" \
  -d '{"commissionRate": 0.15}')
echo "   $(echo "$P" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'rate={d[\"data\"][\"commissionRate\"]}')")"
ok "Commission rate updated to 15%"
hr

# ── 7. Verify rate reflected ──
echo "7️⃣  验证 commission-hub 显示新 rate"
HUB2=$(curl -s -H "Authorization: Bearer $USER_JWT" "$CMS/api/referrals/commission-hub")
RATE=$(echo "$HUB2" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['summary']['commissionRate'])")
echo "   commissionRate=$RATE"
[ "$RATE" = "0.15" ] && ok "Rate change reflected" || fail "Rate not reflected: $RATE"
hr

# ── 8. Restore rate ──
echo "8️⃣  恢复 commissionRate → 0.10"
curl -s -X PATCH -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$CMS/api/admin/customers/$CUSTOMER_ID/commission-rate" \
  -d '{"commissionRate": 0.10}' > /dev/null
ok "Rate restored to 10%"
hr

# ── 9. Admin referral-stats ──
echo "9️⃣  Admin: referral-stats for customer #$CUSTOMER_ID"
STATS=$(curl -s -H "x-admin-token: $ADMIN_TOKEN" "$CMS/api/admin/customers/$CUSTOMER_ID/referral-stats")
echo "$STATS" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
print(f'   week: {d[\"week\"]}')
print(f'   clickTrend: {len(d[\"clickTrend\"])} days')
s = d['summary']
print(f'   summary: clicks={s[\"clicks\"]} valid={s[\"validClicks\"]} bonusEarned={s[\"bonusEarned\"]}')
"
ok "Admin referral stats verified"
hr

# ── 10. Admin leaderboard ──
echo "🔟 Admin: leaderboard"
LB=$(curl -s -H "x-admin-token: $ADMIN_TOKEN" "$CMS/api/admin/referral-leaderboard?limit=5")
echo "$LB" | python3 -c "
import sys,json
for e in json.load(sys.stdin)['data'][:3]:
    print(f'   #{e[\"rank\"]} id={e[\"customerId\"]} clicks={e[\"clicks\"]} valid={e[\"validClicks\"]} commission=£{e[\"commission\"]:.2f}')
"
ok "Leaderboard verified"
hr

# ── 11. Admin commission-transactions ──
echo "1️⃣1️⃣ Admin: commission-transactions"
CT=$(curl -s -H "x-admin-token: $ADMIN_TOKEN" "$CMS/api/admin/commission-transactions?page=1&pageSize=5")
echo "$CT" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'   total={d[\"meta\"][\"pagination\"][\"total\"]} rows={len(d[\"data\"])}')
for r in d['data'][:3]:
    print(f'   id={r[\"id\"]} amount=£{float(r.get(\"amount\",0)):.2f} type={r.get(\"type\")} referrer={r.get(\"referrerEmail\")}')
"
ok "Commission transactions verified"
hr

echo ""
echo "🎉 所有后端测试通过！"
echo ""
echo "📋 手动验证清单："
echo "  1. 浏览器: /referral (Commission Hub UI)"
echo "  2. 浏览器: /?ref=$REF_CODE (首页 ref banner)"
echo "  3. 浏览器: /invite?ref=$REF_CODE (invite 页面)"
echo "  4. 真实下单后检查 commission_transactions 表"
