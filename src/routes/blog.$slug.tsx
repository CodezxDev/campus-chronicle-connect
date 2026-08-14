import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPost } from "@/lib/portal.functions";
import { ArticleCard, CoverImage } from "@/components/portal-ui";
import { formatDate, paragraphs } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const data = await getPost({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Texto indisponível — Portal Aurora" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title} — Blog do Portal Aurora` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: BlogDetalhe,
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Não foi possível carregar este texto.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl">Texto não encontrado</h1>
      <Link to="/blog" className="mt-4 inline-block text-accent hover:underline">
        Ver o blog
      </Link>
    </div>
  ),
});

function BlogDetalhe() {
  const { post, related } = Route.useLoaderData();
  return (
    <article>
      <div className="border-b border-border bg-surface">
        <div className="container-page py-12">
          <p className="kicker">{post.categories?.name ?? "Blog"}</p>
          <h1 className="mt-3 max-w-4xl text-4xl leading-tight md:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {post.author_name} · {formatDate(post.published_at)}
          </p>
        </div>
      </div>

      {post.cover_url && (
        <div className="container-page py-8">
          <CoverImage
            src={post.cover_url}
            alt={post.title}
            priority
            className="aspect-[16/9] w-full rounded-2xl border border-border shadow-lift"
          />
        </div>
      )}

      <div className="container-page prose-article max-w-3xl pb-12">
        {paragraphs(post.content).map((p, i) => (
          <p key={i}>{p.replace(/\*\*/g, "")}</p>
        ))}
      </div>

      {related.length > 0 && (
        <div className="container-page pb-16">
          <h2 className="mb-6 border-b border-border pb-3 text-2xl">Outros textos</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <ArticleCard
                key={r.id}
                href={`/blog/${r.slug}`}
                title={r.title}
                excerpt={r.excerpt}
                cover={r.cover_url}
                meta={formatDate(r.published_at)}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
