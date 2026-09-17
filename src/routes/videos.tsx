import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listVideos } from "@/lib/portal.functions";
import { PageHeader } from "@/components/portal-ui";
import { formatDate } from "@/lib/format";

const videosQuery = queryOptions({
  queryKey: ["videos"],
  queryFn: () => listVideos(),
});

export const Route = createFileRoute("/videos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQuery),
  head: () => ({
    meta: [
      { title: "Vídeos — Portal Aurora" },
      {
        name: "description",
        content:
          "Assista aos vídeos produzidos pelos alunos e pela equipe da Escola Aurora: coberturas, entrevistas e bastidores.",
      },
      { property: "og:title", content: "Vídeos — Portal Aurora" },
      {
        property: "og:description",
        content: "Coberturas, entrevistas e bastidores em vídeo da Escola Aurora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <div className="container-page py-20 text-muted-foreground">
      Não foi possível carregar os vídeos agora.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-muted-foreground">Página não encontrada.</div>
  ),
  component: VideosPage,
});

function embedUrl(url: string) {
  const youtube = url.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideosPage() {
  const { data: videos } = useSuspenseQuery(videosQuery);

  return (
    <div className="pb-20">
      <PageHeader
        kicker="Multimídia"
        title="Vídeos"
        description="Coberturas, entrevistas e bastidores produzidos pela comunidade escolar."
      />
      <div className="container-page mt-10 grid gap-8 md:grid-cols-2">
        {videos.length === 0 && (
          <p className="text-muted-foreground">Nenhum vídeo publicado até o momento.</p>
        )}
        {videos.map((v) => {
          const embed = embedUrl(v.video_url);
          return (
            <article
              key={v.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-soft"
            >
              <div className="aspect-video bg-muted">
                {embed ? (
                  <iframe
                    src={embed}
                    title={v.title}
                    loading="lazy"
                    allowFullScreen
                    className="size-full"
                  />
                ) : (
                  <video src={v.video_url} controls poster={v.thumbnail_url ?? undefined} className="size-full" />
                )}
              </div>
              <div className="p-5">
                <p className="kicker">
                  {v.categories?.name ?? "Geral"} · {formatDate(v.published_at)}
                </p>
                <h2 className="mt-2 text-xl">{v.title}</h2>
                {v.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
