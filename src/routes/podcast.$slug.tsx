import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getEpisode } from "@/lib/portal.functions";
import { CoverImage } from "@/components/portal-ui";
import { formatDate, formatDuration, paragraphs } from "@/lib/format";

export const Route = createFileRoute("/podcast/$slug")({
  loader: async ({ params }) => {
    const episode = await getEpisode({ data: { slug: params.slug } });
    if (!episode) throw notFound();
    return episode;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Episódio indisponível — Portal Aurora" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.title} — Podcast do Portal Aurora` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: EpisodioDetalhe,
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Não foi possível carregar este episódio.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl">Episódio não encontrado</h1>
      <Link to="/podcast" className="mt-4 inline-block text-accent hover:underline">
        Ver todos os episódios
      </Link>
    </div>
  ),
});

function EpisodioDetalhe() {
  const episode = Route.useLoaderData();
  return (
    <article className="container-page max-w-3xl py-12">
      <p className="kicker">Episódio {episode.episode_number}</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{episode.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {formatDuration(episode.duration_seconds)} · {formatDate(episode.published_at)}
        {episode.guests ? ` · com ${episode.guests}` : ""}
      </p>

      <CoverImage
        src={episode.cover_url}
        alt={episode.title}
        priority
        className="mt-8 aspect-[16/9] w-full rounded-2xl border border-border shadow-lift"
      />

      {episode.audio_url ? (
        <audio controls src={episode.audio_url} className="mt-8 w-full">
          Seu navegador não suporta o player de áudio.
        </audio>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          O áudio deste episódio ainda não foi publicado.
        </p>
      )}

      <div className="prose-article mt-6">
        {paragraphs(episode.description).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
