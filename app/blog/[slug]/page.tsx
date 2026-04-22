import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const STRAPI =
  process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
const STRAPI_PUBLIC =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cms.greenhub420.co.uk";
const SITE_URL = "https://www.greenhub420.co.uk";

interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  readTime: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  cover: any;
  publishedAt: string;
  updatedAt: string;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `${STRAPI}/api/blogs?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=cover`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchRelated(
  category: string | null,
  currentSlug: string
): Promise<BlogPost[]> {
  if (!category) return [];
  try {
    const res = await fetch(
      `${STRAPI}/api/blogs?filters[category][$eq]=${category}&filters[slug][$ne]=${currentSlug}&populate=cover&pagination[pageSize]=3&sort=publishedAt:desc`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function getCoverUrl(post: BlogPost): string | null {
  const cover = post.cover;
  if (!cover) return null;
  const url =
    cover.formats?.large?.url ||
    cover.formats?.medium?.url ||
    cover.url;
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${STRAPI_PUBLIC}${url}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Convert Strapi richtext (markdown-ish) to HTML
function renderContent(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-white mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-white mt-10 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /^\- (.+)$/gm,
      '<li class="text-white/70 leading-relaxed ml-4 list-disc">$1</li>'
    )
    .replace(
      /^\d+\. (.+)$/gm,
      '<li class="text-white/70 leading-relaxed ml-4 list-decimal">$1</li>'
    )
    .replace(/\n\n/g, '</p><p class="text-white/70 leading-relaxed mb-4">')
    .replace(/^/, '<p class="text-white/70 leading-relaxed mb-4">')
    .concat("</p>");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Post Not Found" };

  const title = post.seoTitle || post.title;
  const description =
    post.seoDescription || post.excerpt || `Read ${post.title} on Green Hub 420`;
  const coverUrl = getCoverUrl(post);

  return {
    title,
    description,
    keywords: post.seoKeywords
      ? post.seoKeywords.split(",").map((k) => k.trim())
      : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author || "Green Hub 420"],
      url: `${SITE_URL}/blog/${post.slug}`,
      ...(coverUrl && {
        images: [{ url: coverUrl, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const coverUrl = getCoverUrl(post);
  const related = await fetchRelated(post.category, post.slug);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt || "",
    author: {
      "@type": "Organization",
      name: post.author || "Green Hub 420",
    },
    publisher: {
      "@type": "Organization",
      name: "Green Hub 420",
      url: SITE_URL,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    ...(coverUrl && { image: coverUrl }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen pb-28 pt-6 px-4 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-emerald-400 transition-colors mb-6"
        >
          ← All posts
        </Link>

        {/* Cover */}
        {coverUrl && (
          <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden mb-8">
            <Image
              src={coverUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 mb-4">
          {post.category && (
            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs">
              {post.category}
            </span>
          )}
          <span>{formatDate(post.publishedAt)}</span>
          {post.readTime && <span>·  {post.readTime} min read</span>}
          {post.author && <span>·  By {post.author}</span>}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 leading-tight">
          {post.title}
        </h1>

        {/* Content */}
        <article
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-white/10">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-white/5 text-white/50 px-3 py-1 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Related Posts</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.documentId}
                  href={`/blog/${r.slug}`}
                  className="block rounded-xl bg-[#161618] border border-white/5 p-4 hover:border-emerald-500/30 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                    {r.title}
                  </h3>
                  <p className="text-xs text-white/40">
                    {formatDate(r.publishedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
