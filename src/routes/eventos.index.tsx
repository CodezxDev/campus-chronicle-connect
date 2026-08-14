import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { listEvents } from "@/lib/portal.functions";
import { CoverImage, EmptyState, PageHeader } from "@/components/portal-ui";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos — Portal Aurora" },
      {
        name: "description",
        content:
          "Calendário de mostras culturais, reuniões de pais, olimpíadas e demais eventos da Escola Aurora.",
      },
      { property: "og:title", content: "Eventos — Portal Aurora" },
      {
        property: "og:description",
        content: "Agenda completa dos próximos eventos da Escola Aurora e registros dos anteriores.",
      },
    ],
  }),
  loader: () => listEvents(),
  component: EventosPage,
});

function EventosPage() {
  const events = Route.useLoaderData();
  const now = new Date().toISOString();
  const upcoming = events.filter((e) => e.starts_at >= now);
  const past = events.filter((e) => e.starts_at < now).reverse();

  return (
    <>
      <PageHeader
        kicker="Agenda"
        title="Eventos da escola"
        description="Mostras, reuniões, competições e celebrações abertas à comunidade escolar."
      />
      <div className="container-page space-y-12 py-12">
        <section>
          <h2 className="mb-6 border-b border-border pb-3 text-2xl">Próximos eventos</h2>
          {upcoming.length === 0 ? (
            <EmptyState message="Nenhum evento agendado no momento." />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {upcoming.map((e) => (
                <Link
                  key={e.id}
                  to="/eventos/$slug"
                  params={{ slug: e.slug }}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
                >
                  <CoverImage src={e.image_url} alt={e.title} className="aspect-[16/10] w-full" />
                  <div className="p-5">
                    <p className="kicker">{formatDateTime(e.starts_at)}</p>
                    <h3 className="mt-2 text-lg group-hover:text-accent">{e.title}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {e.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-6 border-b border-border pb-3 text-2xl">Já aconteceram</h2>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {past.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                  <Link
                    to="/eventos/$slug"
                    params={{ slug: e.slug }}
                    className="font-medium hover:text-accent"
                  >
                    {e.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">{formatDateTime(e.starts_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
