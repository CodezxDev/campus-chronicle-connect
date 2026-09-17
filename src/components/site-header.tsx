import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  { to: "/noticias", label: "Notícias" },
  { to: "/blog", label: "Blog" },
  { to: "/podcast", label: "Podcast" },
  { to: "/eventos", label: "Eventos" },
  { to: "/projetos", label: "Projetos" },
  { to: "/avisos", label: "Avisos" },
  { to: "/galeria", label: "Galeria" },
  { to: "/videos", label: "Vídeos" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    navigate({ to: "/busca", search: { q: term } });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary font-display text-lg text-primary-foreground">
            P
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">Portal Aurora</span>
            <span className="block text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              Escola Aurora
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-accent" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden items-center gap-2 lg:ml-4 lg:flex">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar no portal"
              aria-label="Buscar no portal"
              className="h-9 w-48 pl-8"
            />
          </div>
        </form>

        <Button asChild variant="outline" size="sm" className="ml-auto hidden lg:ml-0 lg:inline-flex">
          <Link to={signedIn ? "/admin" : "/auth"}>{signedIn ? "Painel" : "Entrar"}</Link>
        </Button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          className="ml-auto inline-flex size-10 items-center justify-center rounded-md border border-border lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface lg:hidden">
          <div className="container-page space-y-3 py-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar no portal"
                aria-label="Buscar no portal"
                className="pl-8"
              />
            </form>
            <nav className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={signedIn ? "/admin" : "/auth"}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-accent"
              >
                {signedIn ? "Painel administrativo" : "Entrar"}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
