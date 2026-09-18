/** Dados oficiais da escola usados em todo o portal. */
export const SITE = {
  name: "Portal MOSC",
  schoolName: "E.E. Madre Odette de Souza Carvalho",
  shortSchool: "Madre Odette de Souza Carvalho",
  titleSuffix: "Portal MOSC | E.E. Madre Odette de Souza Carvalho",
  address: "Av. João Batista Medina, 889 — Jardim Novo Embu, Embu das Artes - SP",
  phone: "(11) 4704-3610",
  phoneHref: "tel:+551147043610",
  dependency: "Pública Estadual — PEI (Programa de Ensino Integral)",
  stages: "Ensino Fundamental e Ensino Médio",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "Av. João Batista Medina, 889 - Jardim Novo Embu, Embu das Artes - SP",
    ),
  logo: "/logo-mosc.png",
  ogImage: "/og-portal-mosc.jpg",
  description:
    "Notícias, blog, podcast, eventos, projetos dos alunos, avisos e galeria de fotos da E.E. Madre Odette de Souza Carvalho, em Embu das Artes.",
} as const;

export function pageTitle(page?: string) {
  return page ? `${page} | ${SITE.name}` : SITE.titleSuffix;
}
