# Content Parity Checklist

| 页面 | 区块 | 状态 | 备注 | 日期 |
| --- | --- | --- | --- | --- |
| Home | Hero | ✅ 与 https://greenhub420.co.uk/ 移动端文案/CTA 对齐 | `HeroClassic` 支持左对齐 + bullet 列表，复刻旧站 “Shop now / How it works” CTA。 | 2026-04-02 |
| Home | Featured products | ✅ Flowers / Pre-rolls / Vapes 卡片顺序、文案、CTA 与旧站一致 | 使用 `featuredCollectionsContent` fixture + 旧站图片链接。 | 2026-04-02 |
| Home | How it works | ✅ 3 步「Place order / We dispatch / Collect locker」文案沿用旧站 | `HowItWorksLocker` 数据与旧站一致，无额外样式差异。 | 2026-04-02 |
| Contact | Hero / Channels | ✅ HOME / CONTACT 面包屑、文案、Email/Telegram CTA、营业时间与旧站一致 | Hero 使用 `tone="soft"` + `contactHeroDetails` 重现 Email / Secure chat / Operating hours；`contactChannels` fixtures 覆盖 Telegram/Email/SMS。 | 2026-04-02 |
| FAQ | Hero / Groups | ✅ HOME / FAQ 文案、Contact/Support CTA、分组问答与旧站一致 | `faqGroups` fixtures 按 Lockers/Payments/Support 分组，`HeroClassic` soft 变体 + details 手风琴复制旧站展开样式。 | 2026-04-02 |
| Terms | Hero / TOC / Sections | ✅ UI 已对齐，文案为占位待 Legal 提供正式稿 | `termsSections` 存占位段落 + 注释；收到新条款后更新 fixtures 并 rerun lint/test。 | 2026-04-02 |
| Shipping | Hero / Timeline / Locker tips / Refund & Support CTA | ✅ 复刻旧站 timeline、locker etiquette、refund policy、support CTA | `shippingTimeline`、`lockerUsageTips`、`returnPolicies`、`supportSteps` 数据逐字；`ShippingPage` 增加 breadcrumb + soft tone hero。 | 2026-04-02 |
