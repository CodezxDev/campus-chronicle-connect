import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { getEvent } from "@/lib/portal.functions";
import { CoverImage } from "@/components/portal-ui";
import { formatDateTime, paragraphs } from "@/lib/format";

export const Route = createFileRoute("/eventos/$slug")({
  loader: async ({ params }) => {
    const event = await getEvent({ data: { slug: params.slug } });
    if (!event) throw notFound();
    return event;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Evento indisponível — Portal Aurora" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.title} — Eventos do Portal Aurora` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: EventoDetalhe,
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Não foi possível carregar este evento.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl">Evento não encontrado</h1>
      <Link to="/eventos" className="mt-4 inline-block text-accent hover:underline">
        Ver a agenda
      </Link>
    </div>
  ),
});

function EventoDetalhe() {
  const event = Route.useLoaderData();
  return (
    <article className="container-page max-w-3xl py-12">
      <p className="kicker">Evento</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{event.title}</h1>

      <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <CalendarDays className="size-4 text-accent" /> {formatDateTime(event.starts_at)}
        </li>
        {event.location && (
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-accent" /> {event.location}
          </li>
        )}
        {event.audience && (
          <li className="flex items-center gap-2">
            <Users className="size-4 text-accent" /> {event.audience}
          </li>
        )}
      </ul>

      <CoverImage
        src={event.image_url}
        alt={event.title}
        priority
        className="mt-8 aspect-[16/9] w-full rounded-2xl border border-border shadow-lift"
      />

      <div className="prose-article mt-4">
        {paragraphs(event.description).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
