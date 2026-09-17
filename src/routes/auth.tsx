import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { quickAdminLogin } from "@/lib/quick-admin.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso da equipe — Portal Aurora" },
      {
        name: "description",
        content: "Área de acesso para a equipe editorial e a secretaria da Escola Aurora.",
      },
      { property: "og:title", content: "Acesso da equipe — Portal Aurora" },
      { property: "og:description", content: "Entre para gerenciar o conteúdo do Portal Aurora." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const quickLogin = useServerFn(quickAdminLogin);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/admin", replace: true });
        else toast.success("Confira seu e-mail para confirmar a conta.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/admin", replace: true });
  }

  async function handleAdminPassword(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const result = await quickLogin({ data: { password: adminPassword } });
      if (!result.ok) {
        toast.error("Senha de administrador incorreta.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: result.secret,
      });
      if (error) throw error;
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <p className="kicker">Portal Aurora</p>
      <h1 className="mt-2 text-3xl">
        {mode === "entrar" ? "Acesso da equipe" : "Criar conta da equipe"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Área restrita para redação, coordenação e secretaria.
      </p>

      <form
        onSubmit={handleAdminPassword}
        className="mt-8 space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft"
      >
        <div>
          <p className="font-medium">Entrar como administrador</p>
          <p className="text-sm text-muted-foreground">
            Digite apenas a senha da administração para gerenciar o portal.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Senha de administrador</Label>
          <Input
            id="admin-password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={adminLoading}>
          {adminLoading ? "Entrando..." : "Entrar como administrador"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs uppercase tracking-widest text-muted-foreground">
        ou use uma conta
      </p>


      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "criar" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <Button variant="outline" className="mt-3" onClick={handleGoogle}>
        Entrar com Google
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "entrar" ? "criar" : "entrar")}
        className="mt-6 text-sm text-muted-foreground hover:text-accent"
      >
        {mode === "entrar" ? "Ainda não tem conta? Criar acesso" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
