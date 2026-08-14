import { createFileRoute } from "@tanstack/react-router";
import { Pin } from "lucide-react";
import { listAnnouncements } from "@/lib/portal.functions";
import { EmptyState, PageHeader } from "@/components/portal-ui";
import { formatDate, paragraphs } from "@/lib/format";

export const Route = createFileRoute("/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos da escola — Portal Aurora" },
      {
        name: "description",
        content:
          "Comunicados oficiais da Escola Aurora para alunos, famílias e professores, sempre atualizados.",
      },
      { property: "og:title", content: "Avisos da escola — Portal Aurora" },
      {
        property: "og:description",
        content: "Reuniões, mudanças de horário, inscrições e comunicados urgentes da Escola Aurora.",
      },
    ],
  }),
  loader: () => listAnnouncements(),
  component: AvisosPage,
});

const PRIORITY_STYLES: Record<string, string> = {
  urgente: "border-destructive/40 bg-destructive/5",
  alta: "border-warning/50 bg-warning/10",
  normal: "border-border bg-card",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgente: "Urgente",
  alta: "Importante",
  normal: "Aviso",
};

function AvisosPage() {
  const announcements = Route.useLoaderData();
  return (
    <>
      <PageHeader
        kicker="Comunicação oficial"
        title="Avisos da escola"
        description="Comunicados válidos no momento, publicados pela secretaria e pela coordenação."
      />
      <div className="container-page py-12">
        {announcements.length === 0 ? (
          <EmptyState message="Nenhum aviso vigente no momento." />
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className={`rounded-xl border p-6 shadow-soft ${PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES["normal"]}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="kicker">{PRIORITY_LABEL[a.priority] ?? "Aviso"}</span>
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Pin className="size-3" /> fixado
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.audience} · publicado em {formatDate(a.starts_at)}
                  </span>
                </div>
                <h2 className="mt-2 text-xl">{a.title}</h2>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {paragraphs(a.body).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {a.ends_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Válido até {formatDate(a.ends_at)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
