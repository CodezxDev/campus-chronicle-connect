import { createFileRoute, Link } from "@tanstack/react-router";
import { listGalleries } from "@/lib/portal.functions";
import { CoverImage, EmptyState, PageHeader } from "@/components/portal-ui";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/galeria/")({
  head: () => ({
    meta: [
      { title: "Galeria de fotos — Portal Aurora" },
      {
        name: "description",
        content: "Álbuns de fotos das feiras, jogos, saraus e celebrações da Escola Aurora.",
      },
      { property: "og:title", content: "Galeria de fotos — Portal Aurora" },
      {
        property: "og:description",
        content: "Registros visuais dos momentos marcantes da comunidade escolar.",
      },
    ],
  }),
  loader: () => listGalleries(),
  component: GaleriaPage,
});

function GaleriaPage() {
  const galleries = Route.useLoaderData();
  return (
    <>
      <PageHeader
        kicker="Memória visual"
        title="Galeria de fotos"
        description="Álbuns organizados por evento, com registros feitos por estudantes e pela equipe."
      />
      <div className="container-page py-12">
        {galleries.length === 0 ? (
          <EmptyState message="Ainda não há álbuns publicados." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => (
              <Link
                key={g.id}
                to="/galeria/$slug"
                params={{ slug: g.slug }}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
              >
                <CoverImage
                  src={g.cover_url}
                  alt={g.title}
                  className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="p-5">
                  <h2 className="text-lg group-hover:text-accent">{g.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(g.happened_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
