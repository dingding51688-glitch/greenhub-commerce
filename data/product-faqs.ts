export interface FAQ {
  question: string;
  answer: string;
}

// Shared delivery FAQ used across all products
const DELIVERY_FAQ: FAQ = {
  question: "How is my order delivered?",
  answer: "We use InPost lockers across the UK for 100% discreet, contactless delivery. After placing your order, you'll receive a locker code via email. Simply go to your nearest InPost locker, enter the code, and collect your package — no face-to-face interaction needed.",
};

const PAYMENT_FAQ: FAQ = {
  question: "What payment methods do you accept?",
  answer: "We accept wallet top-up via bank transfer and cryptocurrency. Your wallet balance can be used to purchase any product instantly. All transactions are discreet with no identifiable descriptions on your bank statement.",
};

const DELIVERY_TIME_FAQ: FAQ = {
  question: "How long does delivery take?",
  answer: "Most orders are dispatched within 24 hours and arrive at your chosen InPost locker within 1-3 working days. You'll receive tracking updates and a notification when your package is ready for collection.",
};

const PACKAGING_FAQ: FAQ = {
  question: "Is the packaging discreet?",
  answer: "Yes, all orders are sent in plain, unmarked packaging with no branding or product descriptions visible. The parcel looks like any normal online order.",
};

// Per-product FAQs keyed by slug
const PRODUCT_FAQS: Record<string, FAQ[]> = {
  stardawg: [
    { question: "What does Stardawg taste and smell like?", answer: "Stardawg has a distinctive diesel and earthy pine aroma with hints of citrus. The flavour is pungent with skunky, fuel-like notes that experienced users love. It's one of the most recognisable strains in the UK." },
    { question: "How potent is Stardawg?", answer: "Stardawg typically contains 22-25% THC, making it one of the stronger hybrid strains available. It delivers an uplifting cerebral high followed by full-body relaxation. Beginners should start with a small amount." },
    { question: "What are the effects of Stardawg?", answer: "Stardawg provides an initial euphoric and creative head high, followed by a calming body effect. It's great for socialising, creative work, or unwinding after a long day. Effects typically last 2-3 hours." },
    DELIVERY_FAQ,
    PACKAGING_FAQ,
  ],
  "amnesia-haze": [
    { question: "What does Amnesia Haze taste like?", answer: "Amnesia Haze has a complex flavour profile with sweet citrus and lemon notes, combined with earthy and spicy undertones. The aroma is fresh and uplifting with a distinctive haze scent." },
    { question: "Is Amnesia Haze good for daytime use?", answer: "Yes, Amnesia Haze is one of the best daytime strains available. Its sativa-dominant genetics provide an energetic, creative, and focused high without heavy sedation. Perfect for social events or productive days." },
    { question: "How strong is Amnesia Haze?", answer: "Amnesia Haze contains 22-25% THC. It's known for its powerful cerebral effects that can be intense for beginners. Start low and go slow if you're new to this strain." },
    DELIVERY_FAQ,
    DELIVERY_TIME_FAQ,
  ],
  gumbo: [
    { question: "What is Gumbo strain?", answer: "Gumbo is a popular hybrid strain known for its unique bubblegum-like flavour and relaxing effects. It has a sweet, candy-like aroma with earthy undertones. Originally from the US, it's become hugely popular in the UK market." },
    { question: "What are the effects of Gumbo?", answer: "Gumbo delivers a balanced high that starts with euphoria and mental clarity, then transitions into deep physical relaxation. It's ideal for evening use, stress relief, and helping with sleep. THC content is typically 20-24%." },
    { question: "Does Gumbo help with sleep?", answer: "Yes, many users find Gumbo excellent for sleep due to its indica-leaning effects. The relaxing body high helps ease tension and quiet the mind, making it a popular choice for those with insomnia." },
    DELIVERY_FAQ,
    PAYMENT_FAQ,
  ],
  "lemon-cherry-gelato": [
    { question: "What does Lemon Cherry Gelato taste like?", answer: "Lemon Cherry Gelato has a delicious sweet and fruity flavour combining tangy lemon, sweet cherry, and creamy gelato notes. The aroma is equally appealing with a dessert-like sweetness that fills the room." },
    { question: "Is Lemon Cherry Gelato indica or sativa?", answer: "Lemon Cherry Gelato is an indica-dominant hybrid. It provides a relaxing body high combined with a gentle mental uplift. Great for evening relaxation without complete couch-lock." },
    { question: "How potent is Lemon Cherry Gelato?", answer: "With around 19.7% THC, Lemon Cherry Gelato is moderately potent and suitable for both experienced and newer users. It offers a smooth, enjoyable high without being overwhelming." },
    DELIVERY_FAQ,
    PACKAGING_FAQ,
  ],
  "candy-runtz": [
    { question: "What does Candy Runtz taste like?", answer: "Candy Runtz lives up to its name with an incredibly sweet, candy-like flavour. Expect fruity, sugary notes similar to Skittles or Starburst, with a smooth, creamy exhale. It's one of the tastiest strains available." },
    { question: "What are the effects of Candy Runtz?", answer: "Candy Runtz delivers a balanced hybrid high — euphoric and giggly at first, melting into full-body relaxation. At 18.5% THC it's potent but approachable, perfect for socialising or a chill evening." },
    { question: "Is Candy Runtz good for beginners?", answer: "Candy Runtz is a great choice for beginners due to its moderate THC level of 18.5% and smooth, enjoyable effects. The flavour is very pleasant and the high is balanced without being too intense." },
    DELIVERY_FAQ,
    DELIVERY_TIME_FAQ,
  ],
  "thc-premium-hash": [
    { question: "What is THC Premium Hash?", answer: "Our THC Premium Hash is a high-quality concentrated cannabis product made from pressed trichomes. It has a smooth, earthy flavour with spicy undertones and delivers a potent, long-lasting body high." },
    { question: "How do you use hash?", answer: "Hash can be smoked in a joint mixed with tobacco or herbal mix, used in a pipe or bong, or vaporised. You can also crumble it into edibles. Start with a small amount as hash is more concentrated than flower." },
    { question: "Is hash stronger than flower?", answer: "Hash is generally more concentrated than flower, so the effects can be stronger and longer-lasting. Our premium hash has around 18.5% THC. Start with a small amount, especially if you're used to smoking flower." },
    DELIVERY_FAQ,
    PAYMENT_FAQ,
  ],
  "apple-tart": [
    { question: "What does Apple Tart strain taste like?", answer: "Apple Tart has a sweet, fruity flavour with distinct green apple and pastry notes. The aroma is like a freshly baked apple dessert with hints of cinnamon and vanilla. A truly unique and enjoyable smoking experience." },
    { question: "What are the effects of Apple Tart?", answer: "Apple Tart is an indica-dominant strain that provides deep relaxation and stress relief. The high starts with a gentle mental calm before settling into a warm, full-body stone. Great for evening use and unwinding." },
    { question: "Is Apple Tart good for anxiety?", answer: "Many users report that Apple Tart helps with anxiety due to its calming indica effects. The gentle onset and relaxing body high can help ease worried thoughts. However, individual results vary." },
    DELIVERY_FAQ,
    PACKAGING_FAQ,
  ],
  "frozen-dream": [
    { question: "What is Frozen Dream strain?", answer: "Frozen Dream is a premium hybrid strain with frosty, trichome-covered buds that give it a 'frozen' appearance. It's known for its sweet, minty flavour and balanced effects that combine mental clarity with physical relaxation." },
    { question: "What does Frozen Dream taste like?", answer: "Frozen Dream has a refreshing minty and sweet flavour profile with hints of berries and cream. The smoke is smooth and cool, making it a pleasant strain to smoke or vape." },
    { question: "How strong is Frozen Dream?", answer: "Frozen Dream contains 22-25% THC, placing it in the high-potency category. It delivers powerful but well-balanced effects. Experienced users will appreciate the strength while beginners should go easy." },
    DELIVERY_FAQ,
    DELIVERY_TIME_FAQ,
  ],
  "pixie-pop-runtz": [
    { question: "What is Pixie Pop Runtz?", answer: "Pixie Pop Runtz is an exciting hybrid strain from the Runtz family, known for its incredibly sweet, candy-like flavour and colourful, dense buds. It's a crowd favourite for both taste and potent effects." },
    { question: "What does Pixie Pop Runtz taste like?", answer: "Pixie Pop Runtz has an ultra-sweet flavour reminiscent of fizzy sweets and fruit candy. The aroma is fruity and sugary with berry and tropical notes. One of the most flavourful strains you'll find." },
    { question: "What are the effects of Pixie Pop Runtz?", answer: "Pixie Pop Runtz delivers a euphoric, uplifting head high that transitions into comfortable body relaxation. At 22-25% THC it's potent — expect giggles, creativity, and eventual mellow vibes." },
    DELIVERY_FAQ,
    PACKAGING_FAQ,
  ],
  "baby-yoda": [
    { question: "What is Baby Yoda strain?", answer: "Baby Yoda is a trending hybrid strain that's gained massive popularity for its unique appearance and powerful effects. The dense, sticky buds have a distinctive look and deliver a well-rounded high." },
    { question: "What does Baby Yoda taste like?", answer: "Baby Yoda has a complex flavour profile with sweet, earthy notes and hints of pine and citrus. The smoke is smooth with a pleasant herbal aftertaste that lingers." },
    { question: "Is Baby Yoda strain strong?", answer: "Yes, Baby Yoda typically contains 22-25% THC, making it a potent strain. It provides strong cerebral effects paired with deep body relaxation. Best suited for experienced users or those looking for a powerful session." },
    DELIVERY_FAQ,
    PAYMENT_FAQ,
  ],
};

// Pre-roll products share FAQs with their parent strain + pre-roll specific FAQ
const PREROLL_FAQ: FAQ = {
  question: "What is a pre-rolled joint?",
  answer: "Our pre-rolls are professionally rolled 1g joints using premium ground flower. They're ready to smoke straight away — no grinding, rolling, or equipment needed. Perfect for convenience and consistency.",
};

const PREROLL_QUALITY_FAQ: FAQ = {
  question: "What paper do you use for pre-rolls?",
  answer: "We use unbleached, natural hemp rolling papers for all our pre-rolls. They burn slowly and evenly, providing a smooth smoking experience without any chemical taste.",
};

// Map pre-roll slugs to their parent strain
const PREROLL_PARENT_MAP: Record<string, string> = {
  "stardawg-per-roll-1g": "stardawg",
  "amnesia-haze-per-roll-1g": "amnesia-haze",
  "lemon-cherry-gelato-per-roll-1g": "lemon-cherry-gelato",
  "gumbo-per-roll-1g": "gumbo",
  "candy-runtz-per-roll-1g": "candy-runtz",
  "pixie-pop-runtz-per-roll-1g": "pixie-pop-runtz",
  "frozen-dream-runtz-per-roll-1g": "frozen-dream",
  "apple-tart-runtz-per-roll-1g": "apple-tart",
  "baby-yoda-per-roll-1g": "baby-yoda",
};

export function getProductFAQs(slug: string): FAQ[] {
  // Direct match
  if (PRODUCT_FAQS[slug]) return PRODUCT_FAQS[slug];

  // Pre-roll: use parent strain FAQs + pre-roll specific
  const parentSlug = PREROLL_PARENT_MAP[slug];
  if (parentSlug && PRODUCT_FAQS[parentSlug]) {
    const parentFaqs = PRODUCT_FAQS[parentSlug].slice(0, 2); // Take first 2 strain-specific
    return [PREROLL_FAQ, ...parentFaqs, PREROLL_QUALITY_FAQ, DELIVERY_FAQ];
  }

  // Fallback
  return [DELIVERY_FAQ, DELIVERY_TIME_FAQ, PAYMENT_FAQ, PACKAGING_FAQ];
}
