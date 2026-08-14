import { createFileRoute } from "@tanstack/react-router";
import { listProjects } from "@/lib/portal.functions";
import { ArticleCard, EmptyState, PageHeader } from "@/components/portal-ui";

export const Route = createFileRoute("/projetos/")({
  head: () => ({
    meta: [
      { title: "Projetos dos alunos — Portal Aurora" },
      {
        name: "description",
        content:
          "Trabalhos de ciências, história e tecnologia desenvolvidos pelas turmas da Escola Aurora.",
      },
      { property: "og:title", content: "Projetos dos alunos — Portal Aurora" },
      {
        property: "og:description",
        content: "Conheça os projetos criados pelas turmas, com turma, disciplina e orientadores.",
      },
    ],
  }),
  loader: () => listProjects(),
  component: ProjetosPage,
});

function ProjetosPage() {
  const projects = Route.useLoaderData();
  return (
    <>
      <PageHeader
        kicker="Feito pelos estudantes"
        title="Projetos dos alunos"
        description="Investigações, protótipos e produções culturais desenvolvidas ao longo do ano letivo."
      />
      <div className="container-page py-12">
        {projects.length === 0 ? (
          <EmptyState message="Ainda não há projetos publicados." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ArticleCard
                key={p.id}
                href={`/projetos/${p.slug}`}
                title={p.title}
                excerpt={p.summary}
                cover={p.cover_url}
                tag={`${p.school_class ?? ""} · ${p.subject ?? ""}`}
                meta={p.advisor ? `Orientação: ${p.advisor}` : null}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
