import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Headphones, Megaphone } from "lucide-react";
import { getHomeData } from "@/lib/portal.functions";
import { ArticleCard, CoverImage, Section } from "@/components/portal-ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Aurora — o jornal digital da Escola Aurora" },
      {
        name: "description",
        content:
          "Acompanhe notícias, projetos de alunos, podcasts, eventos e avisos oficiais da Escola Aurora em um só lugar.",
      },
      { property: "og:title", content: "Portal Aurora — o jornal digital da Escola Aurora" },
      {
        property: "og:description",
        content:
          "Notícias, blog, podcast, eventos, projetos dos alunos, avisos e galeria de fotos da Escola Aurora.",
      },
    ],
  }),
  loader: () => getHomeData(),
  component: Home,
});

function Home() {
  const { posts, events, episode, announcements, galleries, projects } = Route.useLoaderData();
  const news = posts.filter((p) => p.type === "noticia");
  const blog = posts.filter((p) => p.type === "blog");
  const lead = news[0] ?? posts[0];
  const rest = news.slice(1, 4);

  return (
    <>
      {announcements.length > 0 && (
        <div className="border-b border-border bg-primary text-primary-foreground">
          <div className="container-page flex flex-wrap items-center gap-3 py-2.5 text-sm">
            <Megaphone className="size-4 shrink-0" />
            <span className="font-medium">{announcements[0]!.title}</span>
            <Link to="/avisos" className="ml-auto underline underline-offset-4">
              Ver todos os avisos
            </Link>
          </div>
        </div>
      )}

      <section className="border-b border-border bg-surface">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="kicker">Edição desta semana</p>
            {lead ? (
              <>
                <h1 className="mt-3 text-4xl leading-tight md:text-5xl">
                  <Link to="/noticias/$slug" params={{ slug: lead.slug }} className="hover:text-accent">
                    {lead.title}
                  </Link>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{lead.excerpt}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {lead.author_name} · {formatDate(lead.published_at)}
                </p>
                <Button asChild className="mt-6">
                  <Link to="/noticias/$slug" params={{ slug: lead.slug }}>
                    Ler a matéria <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <h1 className="mt-3 text-4xl md:text-5xl">Portal Aurora</h1>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-lift">
            <CoverImage
              src={lead?.cover_url ?? "/images/hero-escola.jpg"}
              alt={lead?.title ?? "Escola Aurora"}
              priority
              className="aspect-[4/3] w-full"
            />
          </div>
        </div>
      </section>

      <Section
        title="Últimas notícias"
        action={
          <Link to="/noticias" className="text-sm font-medium text-accent hover:underline">
            Todas as notícias
          </Link>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          {rest.map((p) => (
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
      </Section>

      <div className="container-page grid gap-10 py-4 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-6 border-b border-border pb-3 text-2xl md:text-3xl">Do blog</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {blog.slice(0, 2).map((p) => (
              <ArticleCard
                key={p.id}
                href={`/blog/${p.slug}`}
                title={p.title}
                excerpt={p.excerpt}
                cover={p.cover_url}
                tag={p.categories?.name ?? "Blog"}
                meta={`${p.author_name} · ${formatDate(p.published_at)}`}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-xl">
              <CalendarDays className="size-5 text-accent" /> Próximos eventos
            </h2>
            <ul className="mt-4 space-y-4">
              {events.map((e) => (
                <li key={e.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <Link
                    to="/eventos/$slug"
                    params={{ slug: e.slug }}
                    className="font-medium hover:text-accent"
                  >
                    {e.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(e.starts_at)} · {e.location}
                  </p>
                </li>
              ))}
              {events.length === 0 && (
                <li className="text-sm text-muted-foreground">Nenhum evento agendado.</li>
              )}
            </ul>
          </div>

          {episode && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-xl">
                <Headphones className="size-5 text-accent" /> Último podcast
              </h2>
              <p className="mt-3 font-medium">
                <Link to="/podcast/$slug" params={{ slug: episode.slug }} className="hover:text-accent">
                  #{episode.episode_number} — {episode.title}
                </Link>
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{episode.description}</p>
            </div>
          )}
        </aside>
      </div>

      <Section
        title="Projetos dos alunos"
        action={
          <Link to="/projetos" className="text-sm font-medium text-accent hover:underline">
            Ver todos
          </Link>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          {projects.map((p) => (
            <ArticleCard
              key={p.id}
              href={`/projetos/${p.slug}`}
              title={p.title}
              excerpt={p.summary}
              cover={p.cover_url}
              tag={p.school_class}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Galeria de fotos"
        action={
          <Link to="/galeria" className="text-sm font-medium text-accent hover:underline">
            Todos os álbuns
          </Link>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          {galleries.map((g) => (
            <Link
              key={g.id}
              to="/galeria/$slug"
              params={{ slug: g.slug }}
              className="group overflow-hidden rounded-xl border border-border shadow-soft"
            >
              <CoverImage
                src={g.cover_url}
                alt={g.title}
                className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="bg-card p-4">
                <p className="font-medium group-hover:text-accent">{g.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(g.happened_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
