import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { searchPortal } from "@/lib/portal.functions";
import { EmptyState, PageHeader } from "@/components/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/busca")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => searchPortal({ data: { q: deps.q } }),
  head: () => ({
    meta: [
      { title: "Busca — Portal Aurora" },
      {
        name: "description",
        content: "Pesquise notícias, posts, episódios, eventos, projetos e avisos do Portal Aurora.",
      },
      { property: "og:title", content: "Busca — Portal Aurora" },
      { property: "og:description", content: "Encontre qualquer conteúdo publicado no portal da escola." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuscaPage,
});

function BuscaPage() {
  const results = Route.useLoaderData();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);

  return (
    <>
      <PageHeader kicker="Busca" title="O que você procura?" />
      <div className="container-page max-w-3xl py-12">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/busca", search: { q: term } });
          }}
        >
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar no portal..."
            aria-label="Buscar no portal"
          />
          <Button type="submit">Buscar</Button>
        </form>

        <div className="mt-8">
          {!q ? (
            <EmptyState message="Digite um termo para começar a busca." />
          ) : results.length === 0 ? (
            <EmptyState message={`Nenhum resultado para “${q}”.`} />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {results.length} resultado(s) para “{q}”.
              </p>
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {results.map((r, i) => (
                  <li key={`${r.href}-${i}`} className="p-5">
                    <span className="kicker">{r.kind}</span>
                    <h2 className="mt-1 text-lg">
                      <Link to={r.href} className="hover:text-accent">
                        {r.title}
                      </Link>
                    </h2>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(r.date)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
