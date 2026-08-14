import { createFileRoute } from "@tanstack/react-router";
import { listPosts } from "@/lib/portal.functions";
import { ArticleCard, EmptyState, PageHeader } from "@/components/portal-ui";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Notícias — Portal Aurora" },
      {
        name: "description",
        content:
          "Tudo o que acontece na Escola Aurora: conquistas, mudanças, feiras, esportes e vida escolar.",
      },
      { property: "og:title", content: "Notícias — Portal Aurora" },
      {
        property: "og:description",
        content: "Cobertura diária da vida escolar feita pela redação do Portal Aurora.",
      },
    ],
  }),
  loader: () => listPosts({ data: { type: "noticia" } }),
  component: NoticiasPage,
});

function NoticiasPage() {
  const posts = Route.useLoaderData();
  return (
    <>
      <PageHeader
        kicker="Redação"
        title="Notícias da escola"
        description="Cobertura do dia a dia da Escola Aurora, escrita pela equipe do portal e por estudantes."
      />
      <div className="container-page py-12">
        {posts.length === 0 ? (
          <EmptyState message="Ainda não há notícias publicadas." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <ArticleCard
                key={p.id}
                href={`/noticias/${p.slug}`}
                title={p.title}
                excerpt={p.excerpt}
                cover={p.cover_url}
                tag={p.categories?.name ?? "Notícia"}
                meta={`${p.author_name} · ${formatDate(p.published_at)}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
