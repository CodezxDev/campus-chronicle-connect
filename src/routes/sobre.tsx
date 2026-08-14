import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal-ui";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o portal — Portal Aurora" },
      {
        name: "description",
        content:
          "Quem faz o Portal Aurora: equipe editorial de alunos e professores da Escola Aurora e sua linha editorial.",
      },
      { property: "og:title", content: "Sobre o portal — Portal Aurora" },
      {
        property: "og:description",
        content: "A redação escolar, seus princípios editoriais e como participar.",
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <>
      <PageHeader
        kicker="Quem somos"
        title="Sobre o Portal Aurora"
        description="O jornal digital feito pela comunidade da Escola Aurora."
      />
      <div className="container-page max-w-3xl py-12">
        <div className="prose-article">
          <p>
            O Portal Aurora é o veículo de comunicação oficial da Escola Aurora. Ele reúne notícias
            do dia a dia, textos autorais do blog, episódios de podcast, a agenda de eventos, os
            projetos das turmas, os avisos da secretaria e a galeria de fotos da escola.
          </p>
          <h2>Nossa linha editorial</h2>
          <p>
            Publicamos conteúdos que informam com precisão, respeitam a privacidade dos estudantes e
            dão espaço a diferentes vozes da comunidade escolar. Textos assinados por alunos passam
            por revisão de um professor orientador antes da publicação.
          </p>
          <h2>Como participar</h2>
          <p>
            Estudantes de todas as séries podem enviar pautas, fotos e sugestões de episódios. A
            redação se reúne semanalmente na biblioteca, e professores podem indicar projetos de
            turma para a seção de projetos.
          </p>
        </div>
      </div>
    </>
  );
}
