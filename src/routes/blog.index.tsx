import { createFileRoute } from "@tanstack/react-router";
import { listPosts } from "@/lib/portal.functions";
import { ArticleCard, EmptyState, PageHeader } from "@/components/portal-ui";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Portal Aurora" },
      {
        name: "description",
        content:
          "Textos de professores e estudantes sobre estudo, leitura, convivência e bastidores da escola.",
      },
      { property: "og:title", content: "Blog — Portal Aurora" },
      {
        property: "og:description",
        content: "Ideias, dicas e reflexões escritas por professores e alunos da Escola Aurora.",
      },
    ],
  }),
  loader: () => listPosts({ data: { type: "blog" } }),
  component: BlogPage,
});

function BlogPage() {
  const posts = Route.useLoaderData();
  return (
    <>
      <PageHeader
        kicker="Vozes da escola"
        title="Blog"
        description="Textos mais longos, opinativos e autorais de professores, estudantes e equipe pedagógica."
      />
      <div className="container-page py-12">
        {posts.length === 0 ? (
          <EmptyState message="Ainda não há textos publicados." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <ArticleCard
                key={p.id}
                href={`/blog/${p.slug}`}
                title={p.title}
                excerpt={p.excerpt}
                cover={p.cover_url}
                tag={p.categories?.name ?? "Blog"}
                meta={`${p.author_name} · ${formatDate(p.published_at)}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
