import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog — Cannabis Guides, News & Tips",
  description:
    "Read the latest guides, tips and news about cannabis delivery in the UK. From strain reviews to InPost locker pickup guides.",
  keywords: [
    "weed blog uk",
    "cannabis delivery guide",
    "weed delivery tips",
    "inpost locker guide",
    "cannabis uk news",
  ],
  openGraph: {
    title: "Blog — Cannabis Guides, News & Tips | Green Hub 420",
    description:
      "Read the latest guides, tips and news about cannabis delivery in the UK.",
    type: "website",
  },
  alternates: {
    canonical: "https://www.greenhub420.co.uk/blog",
  },
};

const STRAPI =
  process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
const STRAPI_PUBLIC =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cms.greenhub420.co.uk";

interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  author: string | null;
  readTime: number | null;
  cover: any;
  publishedAt: string;
}

const categoryLabels: Record<string, string> = {
  guides: "📖 Guides",
  news: "📰 News",
  reviews: "⭐ Reviews",
  tips: "💡 Tips",
  delivery: "🚚 Delivery",
};

async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `${STRAPI}/api/blogs?populate=cover&sort=publishedAt:desc&pagination[pageSize]=50`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCoverUrl(post: BlogPost): string | null {
  const cover = post.cover;
  if (!cover) return null;
  const url = cover.formats?.medium?.url || cover.formats?.small?.url || cover.url;
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${STRAPI_PUBLIC}${url}`;
}

export default async function BlogListPage() {
  const posts = await fetchPosts();

  return (
    <main className="min-h-screen pb-28 pt-6 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Blog</h1>
        <p className="text-white/60 text-sm">
          Guides, tips and news about cannabis delivery in the UK
        </p>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-lg">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => {
            const coverUrl = getCoverUrl(post);
            return (
              <Link
                key={post.documentId}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl bg-[#161618] border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-all duration-300"
              >
                {/* Cover image */}
                {coverUrl && (
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={coverUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Category & date */}
                  <div className="flex items-center gap-3 mb-3 text-xs text-white/50">
                    {post.category && (
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                        {categoryLabels[post.category] || post.category}
                      </span>
                    )}
                    <span>{formatDate(post.publishedAt)}</span>
                    {post.readTime && <span>{post.readTime} min read</span>}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-white/50 text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
