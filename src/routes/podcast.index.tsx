import { createFileRoute, Link } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { listEpisodes } from "@/lib/portal.functions";
import { CoverImage, EmptyState, PageHeader } from "@/components/portal-ui";
import { formatDate, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/podcast/")({
  head: () => ({
    meta: [
      { title: "Podcast — Portal Aurora" },
      {
        name: "description",
        content:
          "Episódios do podcast da Escola Aurora, com conversas entre alunos, professores e convidados.",
      },
      { property: "og:title", content: "Podcast — Portal Aurora" },
      {
        property: "og:description",
        content: "Conversas sobre escola, estudo e vida adolescente, em episódios curtos.",
      },
    ],
  }),
  loader: () => listEpisodes(),
  component: PodcastPage,
});

function PodcastPage() {
  const episodes = Route.useLoaderData();
  return (
    <>
      <PageHeader
        kicker="Áudio"
        title="Podcast da Escola Aurora"
        description="Conversas quinzenais entre estudantes, professores e convidados sobre a vida escolar."
      />
      <div className="container-page py-12">
        {episodes.length === 0 ? (
          <EmptyState message="Ainda não há episódios publicados." />
        ) : (
          <ul className="space-y-5">
            {episodes.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-soft sm:flex-row"
              >
                <CoverImage
                  src={e.cover_url}
                  alt={e.title}
                  className="h-32 w-full shrink-0 rounded-lg sm:w-48"
                />
                <div>
                  <p className="kicker">Episódio {e.episode_number}</p>
                  <h2 className="mt-1 text-xl">
                    <Link to="/podcast/$slug" params={{ slug: e.slug }} className="hover:text-accent">
                      {e.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Headphones className="size-3.5" />
                    {formatDuration(e.duration_seconds)} · {formatDate(e.published_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
