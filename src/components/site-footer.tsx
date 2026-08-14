import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl">Portal Aurora</p>
          <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/70">
            O jornal digital da Escola Aurora: notícias, projetos, podcasts e avisos feitos por
            alunos, professores e equipe pedagógica.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-sidebar-foreground/60">Conteúdo</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/noticias" className="hover:text-sidebar-primary">Notícias</Link></li>
            <li><Link to="/blog" className="hover:text-sidebar-primary">Blog</Link></li>
            <li><Link to="/podcast" className="hover:text-sidebar-primary">Podcast</Link></li>
            <li><Link to="/galeria" className="hover:text-sidebar-primary">Galeria</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-sidebar-foreground/60">Escola</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/eventos" className="hover:text-sidebar-primary">Eventos</Link></li>
            <li><Link to="/avisos" className="hover:text-sidebar-primary">Avisos</Link></li>
            <li><Link to="/sobre" className="hover:text-sidebar-primary">Sobre</Link></li>
            <li><Link to="/contato" className="hover:text-sidebar-primary">Contato</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sidebar-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-sidebar-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Escola Aurora. Todos os direitos reservados.</p>
          <p>Rua das Acácias, 120 — (11) 4000-0000</p>
        </div>
      </div>
    </footer>
  );
}
