
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','editor','autor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role_title TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_editor(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_editor_manage" ON public.categories FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));

-- POSTS (noticias + blog)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'noticia',
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Redação',
  status TEXT NOT NULL DEFAULT 'rascunho',
  featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_search_idx ON public.posts USING gin (to_tsvector('portuguese', title || ' ' || excerpt || ' ' || content));
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (status = 'publicado' AND published_at <= now());
CREATE POLICY "posts_staff_read" ON public.posts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "posts_staff_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "posts_update" ON public.posts FOR UPDATE TO authenticated USING (public.is_editor(auth.uid()) OR author_id = auth.uid()) WITH CHECK (public.is_editor(auth.uid()) OR author_id = auth.uid());
CREATE POLICY "posts_delete" ON public.posts FOR DELETE TO authenticated USING (public.is_editor(auth.uid()) OR author_id = auth.uid());
CREATE TRIGGER posts_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PODCAST
CREATE TABLE public.podcast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  episode_number INTEGER,
  audio_url TEXT,
  duration_seconds INTEGER,
  cover_url TEXT,
  guests TEXT,
  status TEXT NOT NULL DEFAULT 'publicado',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.podcast_episodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.podcast_episodes TO authenticated;
GRANT ALL ON public.podcast_episodes TO service_role;
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "podcast_public_read" ON public.podcast_episodes FOR SELECT USING (status = 'publicado');
CREATE POLICY "podcast_staff_read" ON public.podcast_episodes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "podcast_staff_manage" ON public.podcast_episodes FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER podcast_updated BEFORE UPDATE ON public.podcast_episodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  audience TEXT,
  image_url TEXT,
  registration_url TEXT,
  status TEXT NOT NULL DEFAULT 'publicado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (status = 'publicado');
CREATE POLICY "events_staff_read" ON public.events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "events_staff_manage" ON public.events FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STUDENT PROJECTS
CREATE TABLE public.student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  school_class TEXT,
  subject TEXT,
  year INTEGER,
  students TEXT,
  advisor TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'publicado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.student_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_projects TO authenticated;
GRANT ALL ON public.student_projects TO service_role;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_public_read" ON public.student_projects FOR SELECT USING (status = 'publicado');
CREATE POLICY "projects_staff_read" ON public.student_projects FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "projects_staff_manage" ON public.student_projects FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.student_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal',
  audience TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'publicado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_public_read" ON public.announcements FOR SELECT USING (status = 'publicado' AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "announcements_staff_read" ON public.announcements FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "announcements_staff_manage" ON public.announcements FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GALLERIES
CREATE TABLE public.galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  happened_at DATE,
  status TEXT NOT NULL DEFAULT 'publicado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.galleries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.galleries TO authenticated;
GRANT ALL ON public.galleries TO service_role;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "galleries_public_read" ON public.galleries FOR SELECT USING (status = 'publicado');
CREATE POLICY "galleries_staff_read" ON public.galleries FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "galleries_staff_manage" ON public.galleries FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));

CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_photos TO authenticated;
GRANT ALL ON public.gallery_photos TO service_role;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_public_read" ON public.gallery_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_id AND g.status = 'publicado'));
CREATE POLICY "photos_staff_read" ON public.gallery_photos FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "photos_staff_manage" ON public.gallery_photos FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));

-- SEED
INSERT INTO public.categories (name, slug, color) VALUES
  ('Educação','educacao','blue'),
  ('Esportes','esportes','green'),
  ('Cultura','cultura','amber'),
  ('Ciência','ciencia','violet'),
  ('Comunidade','comunidade','rose');

INSERT INTO public.posts (type,title,slug,excerpt,content,cover_url,category_id,author_name,status,featured,published_at,views) VALUES
('noticia','Feira de Ciências 2026 reúne 42 projetos e lota o ginásio','feira-de-ciencias-2026','Alunos do 6º ao 9º ano apresentaram experimentos sobre energia limpa, água e saúde. O público votou nos três destaques do ano.','A Feira de Ciências deste ano transformou o ginásio em um grande laboratório aberto. Foram 42 projetos desenvolvidos ao longo do semestre, com orientação dos professores de Ciências, Matemática e Geografia.\n\nOs temas mais frequentes foram energia limpa, tratamento de água e alimentação saudável. Entre os destaques, o projeto "Horta Vertical Automatizada", do 9º ano B, usou sensores de umidade para irrigar as plantas apenas quando necessário.\n\n"A feira mostra o que os estudantes conseguem quando têm tempo e apoio para investigar", afirmou a coordenadora pedagógica. Os três projetos mais votados representarão a escola na etapa municipal em setembro.',
'/images/feira-ciencias.jpg',(SELECT id FROM public.categories WHERE slug='ciencia'),'Redação do Portal','publicado',true,now() - interval '1 day',412),
('noticia','Time de vôlei conquista o título intercolegial','volei-titulo-intercolegial','Com uma virada no terceiro set, a equipe sub-15 garantiu a taça diante de mais de 300 torcedores.','A equipe sub-15 de vôlei venceu a final do campeonato intercolegial por 2 sets a 1, de virada. O ginásio recebeu mais de 300 torcedores entre alunos, famílias e professores.\n\nO técnico destacou a evolução do grupo ao longo do ano: "Treinamos duas vezes por semana desde março, e o time aprendeu a jogar junto".\n\nA taça já está exposta no hall de entrada da escola.',
'/images/volei.jpg',(SELECT id FROM public.categories WHERE slug='esportes'),'Núcleo de Esportes','publicado',false,now() - interval '3 days',287),
('noticia','Biblioteca amplia horário e ganha clube de leitura','biblioteca-clube-de-leitura','A partir deste mês, a biblioteca abre até as 18h e recebe encontros quinzenais do novo clube de leitura.','A biblioteca da escola passa a funcionar das 7h às 18h, de segunda a sexta. A mudança atende a um pedido antigo dos estudantes do turno da tarde.\n\nJunto com o novo horário, começa o Clube de Leitura, com encontros quinzenais às quartas-feiras. O primeiro livro escolhido foi definido por votação aberta a alunos e professores.',
'/images/biblioteca.jpg',(SELECT id FROM public.categories WHERE slug='educacao'),'Secretaria Escolar','publicado',false,now() - interval '6 days',163),
('blog','Como organizar seus estudos sem perder os fins de semana','organizar-estudos','Três professores compartilham métodos simples de planejamento semanal que cabem na rotina real de quem também tem vida fora da escola.','Estudar bem não é estudar o dia inteiro. É estudar com constância e com um plano que você consiga cumprir.\n\n**1. Comece pelo calendário, não pela matéria.** Marque primeiro os compromissos fixos: aulas, treinos, trabalho, família. O que sobra é o seu tempo real de estudo.\n\n**2. Blocos curtos vencem maratonas.** Sessões de 40 minutos com 10 de pausa rendem mais do que três horas seguidas.\n\n**3. Revise antes de avançar.** Dez minutos revisando o conteúdo da véspera economizam horas na semana da prova.',
'/images/estudos.jpg',(SELECT id FROM public.categories WHERE slug='educacao'),'Profa. Marina Alves','publicado',true,now() - interval '2 days',521),
('blog','O que aprendemos ao montar o jornal mural da escola','jornal-mural','Estudantes do 8º ano contam os bastidores da produção do mural que hoje é parada obrigatória no corredor central.','Tudo começou com uma reclamação: ninguém sabia o que estava acontecendo na escola. Seis meses depois, o jornal mural virou rotina.\n\nA turma se dividiu em pauta, apuração, texto e diagramação. A parte mais difícil não foi escrever — foi checar a informação antes de publicar.\n\nHoje o mural é atualizado toda segunda-feira e virou fonte oficial de avisos das turmas.',
'/images/jornal-mural.jpg',(SELECT id FROM public.categories WHERE slug='comunidade'),'Turma 8º A','publicado',false,now() - interval '9 days',198);

INSERT INTO public.podcast_episodes (title,slug,description,episode_number,duration_seconds,cover_url,guests,published_at) VALUES
('Escolher o Ensino Médio: medo, dúvida e escolha','escolher-ensino-medio','Conversamos com três alunos do 9º ano e uma orientadora educacional sobre a transição para o Ensino Médio.',12,1860,'/images/podcast.jpg','Orientadora Cláudia Reis e alunos do 9º ano',now() - interval '4 days'),
('Bastidores da Feira de Ciências','bastidores-feira-ciencias','Como nasce um projeto de feira: da ideia solta ao pôster pronto, com direito a tudo que deu errado no caminho.',11,1520,'/images/podcast.jpg','Prof. Rafael Lima',now() - interval '18 days'),
('Leitura na adolescência: por onde começar','leitura-adolescencia','A bibliotecária da escola indica cinco caminhos para quem quer voltar a ler por prazer.',10,1340,'/images/podcast.jpg','Bibliotecária Sônia Prado',now() - interval '32 days');

INSERT INTO public.events (title,slug,description,starts_at,ends_at,location,audience,image_url,registration_url) VALUES
('Mostra Cultural de Primavera','mostra-cultural-primavera','Apresentações de teatro, música e dança das turmas do Fundamental II, com exposição de artes visuais no pátio coberto.',now() + interval '12 days',now() + interval '12 days' + interval '5 hours','Pátio coberto e auditório','Toda a comunidade escolar','/images/teatro.jpg',NULL),
('Reunião de Pais e Mestres — 3º bimestre','reuniao-pais-3-bimestre','Entrega de boletins e conversa individual com os professores de cada turma. Chegue com 15 minutos de antecedência.',now() + interval '5 days',now() + interval '5 days' + interval '3 hours','Salas de aula','Pais e responsáveis','/images/reuniao.jpg',NULL),
('Olimpíada Interna de Matemática','olimpiada-matematica','Prova em duas fases para alunos do 6º ao 9º ano. Inscrições na secretaria até dois dias antes.',now() + interval '26 days',now() + interval '26 days' + interval '4 hours','Bloco B','Alunos do Fundamental II','/images/matematica.jpg',NULL),
('Sarau de Poesia','sarau-poesia','Noite aberta de leitura de poemas autorais e clássicos, com participação de alunos, professores e famílias.',now() - interval '20 days',now() - interval '20 days' + interval '3 hours','Auditório','Toda a comunidade escolar','/images/sarau.jpg',NULL);

INSERT INTO public.student_projects (title,slug,summary,description,school_class,subject,year,students,advisor,cover_url) VALUES
('Horta Vertical Automatizada','horta-vertical','Sistema de irrigação com sensores de umidade que economiza até 40% de água na horta da escola.','O projeto nasceu da constatação de que a horta era regada sempre no mesmo horário, chovesse ou não. Os alunos montaram sensores de umidade ligados a uma placa programável que aciona a bomba apenas quando o solo está seco.\n\nDurante dois meses de teste, o consumo de água caiu 40% e as mudas apresentaram crescimento mais uniforme.','9º B','Ciências e Tecnologia',2026,'Ana Beatriz, Caio Ferreira, Letícia Sousa','Prof. Rafael Lima','/images/horta.jpg'),
('Memórias do Bairro','memorias-do-bairro','Coletânea de entrevistas com moradores antigos, transformada em livreto e exposição fotográfica.','Os estudantes entrevistaram 18 moradores com mais de 70 anos que vivem no bairro desde a infância. As histórias foram transcritas, editadas e reunidas em um livreto de 60 páginas distribuído na biblioteca.','8º A','História',2026,'Turma 8º A','Profa. Marina Alves','/images/memorias.jpg'),
('Robótica com Sucata','robotica-sucata','Braço robótico construído com materiais reaproveitados para ensinar conceitos de mecânica e programação.','Usando papelão rígido, seringas e mangueiras, o grupo construiu um braço hidráulico funcional capaz de mover objetos leves. A segunda versão incorporou servomotores e controle por aplicativo.','7º C','Ciências',2026,'Pedro Nunes, Julia Kim, Marcos Vale','Prof. Rafael Lima','/images/robotica.jpg');

INSERT INTO public.announcements (title,body,priority,audience,pinned,starts_at,ends_at) VALUES
('Reunião de pais do 3º bimestre na próxima semana','A entrega de boletins acontece na próxima semana, no horário do turno de cada turma. A presença de um responsável é obrigatória.','alta','Pais e responsáveis',true,now() - interval '2 days',now() + interval '6 days'),
('Inscrições abertas para a Olimpíada de Matemática','As inscrições podem ser feitas na secretaria, das 8h às 17h, até dois dias antes da prova.','normal','Alunos do Fundamental II',false,now() - interval '1 day',now() + interval '24 days'),
('Alteração no horário do transporte escolar','A partir de segunda-feira, a rota Norte passa a sair 10 minutos mais cedo. Confira o novo quadro no mural da entrada.','urgente','Alunos e responsáveis',false,now(),now() + interval '10 days');

INSERT INTO public.galleries (title,slug,description,cover_url,happened_at) VALUES
('Feira de Ciências 2026','galeria-feira-ciencias','Registros dos 42 projetos apresentados no ginásio.','/images/feira-ciencias.jpg',CURRENT_DATE - 1),
('Final do Intercolegial de Vôlei','galeria-volei','A virada no terceiro set e a comemoração no ginásio lotado.','/images/volei.jpg',CURRENT_DATE - 3),
('Sarau de Poesia','galeria-sarau','Uma noite de poemas autorais no auditório.','/images/sarau.jpg',CURRENT_DATE - 20);

INSERT INTO public.gallery_photos (gallery_id,image_url,caption,position) VALUES
((SELECT id FROM public.galleries WHERE slug='galeria-feira-ciencias'),'/images/feira-ciencias.jpg','Abertura da feira no ginásio',1),
((SELECT id FROM public.galleries WHERE slug='galeria-feira-ciencias'),'/images/horta.jpg','A horta vertical automatizada em funcionamento',2),
((SELECT id FROM public.galleries WHERE slug='galeria-feira-ciencias'),'/images/robotica.jpg','Braço robótico feito com sucata',3),
((SELECT id FROM public.galleries WHERE slug='galeria-volei'),'/images/volei.jpg','Ponto final da partida',1),
((SELECT id FROM public.galleries WHERE slug='galeria-volei'),'/images/teatro.jpg','Torcida no ginásio',2),
((SELECT id FROM public.galleries WHERE slug='galeria-sarau'),'/images/sarau.jpg','Leitura de poema autoral',1),
((SELECT id FROM public.galleries WHERE slug='galeria-sarau'),'/images/biblioteca.jpg','Exposição de livros na entrada',2);
