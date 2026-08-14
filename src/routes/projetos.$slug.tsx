import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProject } from "@/lib/portal.functions";
import { CoverImage } from "@/components/portal-ui";
import { paragraphs } from "@/lib/format";

export const Route = createFileRoute("/projetos/$slug")({
  loader: async ({ params }) => {
    const project = await getProject({ data: { slug: params.slug } });
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Projeto indisponível — Portal Aurora" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.title} — Projetos do Portal Aurora` },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.summary },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: ProjetoDetalhe,
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Não foi possível carregar este projeto.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl">Projeto não encontrado</h1>
      <Link to="/projetos" className="mt-4 inline-block text-accent hover:underline">
        Ver todos os projetos
      </Link>
    </div>
  ),
});

function ProjetoDetalhe() {
  const project = Route.useLoaderData();
  return (
    <article className="container-page max-w-3xl py-12">
      <p className="kicker">
        {project.school_class} · {project.subject} · {project.year}
      </p>
      <h1 className="mt-3 text-4xl md:text-5xl">{project.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{project.summary}</p>

      <CoverImage
        src={project.cover_url}
        alt={project.title}
        priority
        className="mt-8 aspect-[16/9] w-full rounded-2xl border border-border shadow-lift"
      />

      <dl className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Estudantes</dt>
          <dd className="mt-1">{project.students}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Orientação</dt>
          <dd className="mt-1">{project.advisor}</dd>
        </div>
      </dl>

      <div className="prose-article mt-4">
        {paragraphs(project.description).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
