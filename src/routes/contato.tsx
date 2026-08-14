import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/portal-ui";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Portal Aurora" },
      {
        name: "description",
        content:
          "Fale com a secretaria da Escola Aurora ou com a redação do portal: telefone, e-mail, endereço e horários.",
      },
      { property: "og:title", content: "Contato — Portal Aurora" },
      { property: "og:description", content: "Canais de atendimento da escola e da redação do portal." },
    ],
  }),
  component: ContatoPage,
});

const ITEMS = [
  { icon: Mail, label: "E-mail da redação", value: "redacao@escolaaurora.edu.br" },
  { icon: Phone, label: "Secretaria", value: "(11) 4002-8922" },
  { icon: MapPin, label: "Endereço", value: "Rua das Acácias, 210 — Vila Aurora" },
  { icon: Clock, label: "Atendimento", value: "Segunda a sexta, das 8h às 17h" },
];

function ContatoPage() {
  return (
    <>
      <PageHeader
        kicker="Fale conosco"
        title="Contato"
        description="Envie pautas para a redação ou procure a secretaria para assuntos administrativos."
      />
      <div className="container-page max-w-3xl py-12">
        <ul className="grid gap-4 sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, label, value }) => (
            <li key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <Icon className="size-5 text-accent" />
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 font-medium">{value}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">
          Sugestões de pauta enviadas por estudantes são avaliadas na reunião semanal da redação.
        </p>
      </div>
    </>
  );
}
