--
-- PostgreSQL database dump
--

\restrict UEl9C0PL2Tdl58hs4JbfbJS9OtLeYO3XJgduhEkUanK93jVGCc0lroarT2lGrHn

-- Dumped from database version 16.10 (Homebrew)
-- Dumped by pg_dump version 16.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Category" AS ENUM (
    'MUSIC',
    'ART',
    'FICTION',
    'CINEMA',
    'POETRY'
);


ALTER TYPE public."Category" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'PARTICIPANT',
    'JUDGE',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Status" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'FEATURED'
);


ALTER TYPE public."Status" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Applause; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Applause" (
    id text NOT NULL,
    "submissionId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Applause" OWNER TO postgres;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    body text NOT NULL,
    "submissionId" text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Comment" OWNER TO postgres;

--
-- Name: Featured; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Featured" (
    id text NOT NULL,
    "submissionId" text NOT NULL,
    "weekDropId" text NOT NULL,
    rank integer NOT NULL
);


ALTER TABLE public."Featured" OWNER TO postgres;

--
-- Name: Feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Feedback" (
    id text NOT NULL,
    "submissionId" text NOT NULL,
    "judgeId" text NOT NULL,
    originality integer NOT NULL,
    craft integer NOT NULL,
    impact integer NOT NULL,
    cohesion integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Feedback" OWNER TO postgres;

--
-- Name: Submission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Submission" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    category public."Category" NOT NULL,
    description text,
    "contentUrl" text,
    "wordCount" integer,
    "durationSec" integer,
    status public."Status" DEFAULT 'PENDING'::public."Status" NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "artistBio" text
);


ALTER TABLE public."Submission" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'PARTICIPANT'::public."Role" NOT NULL,
    "displayName" text,
    age integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: WeekDrop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WeekDrop" (
    id text NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    "editorNote" text
);


ALTER TABLE public."WeekDrop" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Applause; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Applause" (id, "submissionId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Comment" (id, body, "submissionId", "authorId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Featured; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Featured" (id, "submissionId", "weekDropId", rank) FROM stdin;
cmg15sb1v0005xcuup3jorqhb	cmg15sb1q0003xcuumpk0hrxr	cmg15s7c30000xcuu26pne8cx	1
cmg15sb8g0009xcuuq9pgtoi1	cmg15sb8d0007xcuupgjbsfee	cmg15s7c30000xcuu26pne8cx	2
cmg15sbcb000dxcuuq9llq18a	cmg15sbc9000bxcuudvhkjsor	cmg15s7c30000xcuu26pne8cx	3
cmg15sbeo000hxcuui72d2uda	cmg15sbel000fxcuur9ng0ycd	cmg15s7c30000xcuu26pne8cx	1
cmg15sbh6000lxcuuqes4wsgt	cmg15sbh4000jxcuurvh37t8f	cmg15s7c30000xcuu26pne8cx	2
cmg15sbjh000pxcuum03btcee	cmg15sbjf000nxcuulnuginke	cmg15s7c30000xcuu26pne8cx	3
cmg15sc400019xcuuxix6whp9	cmg15sc3y0017xcuuuelegefr	cmg15s7c30000xcuu26pne8cx	1
cmg15sdvo001dxcuu3ffwb5n3	cmg15sdvm001bxcuun385q1ww	cmg15s7c30000xcuu26pne8cx	2
cmg15sget001hxcuuzkdytcao	cmg15sges001fxcuupwtd3psm	cmg15s7c30000xcuu26pne8cx	3
cmg15sh3c001lxcuugx7m7xh1	cmg15sh3a001jxcuu7nl1ys29	cmg15s7c30000xcuu26pne8cx	1
cmg15shrx001pxcuul1r8p4x3	cmg15shrv001nxcuu3l09t4ui	cmg15s7c30000xcuu26pne8cx	2
cmg15si7j001txcuulhy89tbi	cmg15si7h001rxcuuoq30gvmx	cmg15s7c30000xcuu26pne8cx	3
cmg15sbqf000xxcuuh4s3c3tt	cmg15sbqe000vxcuu049u99jv	cmg15s7c30000xcuu26pne8cx	1
cmg15sbsr0011xcuuqk59prn2	cmg15sbsp000zxcuu9nvjld8f	cmg15s7c30000xcuu26pne8cx	2
cmg15sbvb0015xcuu6yyt3ii6	cmg15sbva0013xcuuxdsy0j34	cmg15s7c30000xcuu26pne8cx	3
\.


--
-- Data for Name: Feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Feedback" (id, "submissionId", "judgeId", originality, craft, impact, cohesion, comment, "createdAt") FROM stdin;
\.


--
-- Data for Name: Submission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Submission" (id, title, slug, category, description, "contentUrl", "wordCount", "durationSec", status, "authorId", "createdAt", "artistBio") FROM stdin;
cmfzu70be0001xc0a7eoq2i9u	art	art	ART	art	https://arthousebucket.s3.us-east-2.amazonaws.com/art/art-1758830376086.png	\N	\N	PENDING	cmfykatyp0000xcr2kjjyhjyu	2025-09-25 19:59:36.794	\N
cmfzueo0y0001xccrux7oj2df	my poem	my-poem	POETRY	please be easy on me	https://arthousebucket.s3.us-east-2.amazonaws.com/poetry/my-poem-1758830733678.pdf	\N	\N	PENDING	cmfykatyp0000xcr2kjjyhjyu	2025-09-25 20:05:34.113	\N
cmfzuvh8n0001xczp0klf7p9m	my movie	my-movie	CINEMA	watch it	https://arthousebucket.s3.us-east-2.amazonaws.com/cinema/my-movie-1758831517860.MOV	\N	\N	PENDING	cmfykatyp0000xcr2kjjyhjyu	2025-09-25 20:18:38.47	\N
cmg15sb1q0003xcuumpk0hrxr	ART Example 1	art-example-1	ART	Placeholder description for art 1	https://arthousebucket.s3.us-east-2.amazonaws.com/art/art1.jpg	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:52.43	\N
cmg15sb8d0007xcuupgjbsfee	ART Example 2	art-example-2	ART	Placeholder description for art 2	https://arthousebucket.s3.us-east-2.amazonaws.com/art/art2.jpg	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:52.67	\N
cmg15sbc9000bxcuudvhkjsor	ART Example 3	art-example-3	ART	Placeholder description for art 3	https://arthousebucket.s3.us-east-2.amazonaws.com/art/art3.jpg	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:52.809	\N
cmg15sbel000fxcuur9ng0ycd	POETRY Example 1	poetry-example-1	POETRY	Placeholder description for poetry 1	https://arthousebucket.s3.us-east-2.amazonaws.com/poetry/poem1.txt	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:52.894	\N
cmg15sbh4000jxcuurvh37t8f	POETRY Example 2	poetry-example-2	POETRY	Placeholder description for poetry 2	https://arthousebucket.s3.us-east-2.amazonaws.com/poetry/poem2.txt	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:52.984	\N
cmg15sbjf000nxcuulnuginke	POETRY Example 3	poetry-example-3	POETRY	Placeholder description for poetry 3	https://arthousebucket.s3.us-east-2.amazonaws.com/poetry/poem3.txt	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:53.067	\N
cmg15sbny000rxcuunmi3w4jp	FICTION Example 1	fiction-example-1	FICTION	Placeholder description for fiction 1	https://arthousebucket.s3.us-east-2.amazonaws.com/fiction/.DS_Store	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:53.23	\N
cmg15sbqe000vxcuu049u99jv	FICTION Example 2	fiction-example-2	FICTION	Placeholder description for fiction 2	https://arthousebucket.s3.us-east-2.amazonaws.com/fiction/story1.txt	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:53.318	\N
cmg15sbsp000zxcuu9nvjld8f	FICTION Example 3	fiction-example-3	FICTION	Placeholder description for fiction 3	https://arthousebucket.s3.us-east-2.amazonaws.com/fiction/story2.txt	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:53.402	\N
cmg15sbva0013xcuuxdsy0j34	FICTION Example 4	fiction-example-4	FICTION	Placeholder description for fiction 4	https://arthousebucket.s3.us-east-2.amazonaws.com/fiction/story3.txt	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:53.494	\N
cmg15sc3y0017xcuuuelegefr	CINEMA Example 1	cinema-example-1	CINEMA	Placeholder description for cinema 1	https://arthousebucket.s3.us-east-2.amazonaws.com/cinema/film1.mp4	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:53.806	\N
cmg15sdvm001bxcuun385q1ww	CINEMA Example 2	cinema-example-2	CINEMA	Placeholder description for cinema 2	https://arthousebucket.s3.us-east-2.amazonaws.com/cinema/film2.mp4	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:56.099	\N
cmg15sges001fxcuupwtd3psm	CINEMA Example 3	cinema-example-3	CINEMA	Placeholder description for cinema 3	https://arthousebucket.s3.us-east-2.amazonaws.com/cinema/film3.mp4	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:11:59.38	\N
cmg15sh3a001jxcuu7nl1ys29	MUSIC Example 1	music-example-1	MUSIC	Placeholder description for music 1	https://arthousebucket.s3.us-east-2.amazonaws.com/music/song1.mp3	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:12:00.262	\N
cmg15shrv001nxcuu3l09t4ui	MUSIC Example 2	music-example-2	MUSIC	Placeholder description for music 2	https://arthousebucket.s3.us-east-2.amazonaws.com/music/song2.mp3	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:12:01.147	\N
cmg15si7h001rxcuuoq30gvmx	MUSIC Example 3	music-example-3	MUSIC	Placeholder description for music 3	https://arthousebucket.s3.us-east-2.amazonaws.com/music/song3.mp3	\N	\N	FEATURED	cmg15sb1n0001xcuuh989108x	2025-09-26 18:12:01.709	\N
cmg5zk2540001xctyipu2gegs	my art	my-art	ART	the art	https://arthousebucket.s3.us-east-2.amazonaws.com/art/my-art-1759202180114.jpg	\N	\N	PENDING	cmfykatyp0000xcr2kjjyhjyu	2025-09-30 03:16:20.822	daniel jungwirth is an artist
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, role, "displayName", age, "createdAt") FROM stdin;
cmg15sb1n0001xcuuh989108x	fakeauthor@example.com		PARTICIPANT	Fake Author	\N	2025-09-26 18:11:52.427
cmfykatyp0000xcr2kjjyhjyu	jungwirthdaniel3@gmail.com		JUDGE	Daniel Jungwirth	\N	2025-09-24 22:34:52.849
\.


--
-- Data for Name: WeekDrop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WeekDrop" (id, "startsAt", "endsAt", "editorNote") FROM stdin;
cmg15s7c30000xcuu26pne8cx	2025-09-26 18:11:47.548	2025-10-03 18:11:47.548	This week’s drop reminds us that the “art world” is no longer confined to white walls and whispered gallery talk—it’s spilling out online, messy, brilliant, and impossible to ignore. Our fiction winner cuts sharper than most headlines, while the poetry submission proves brevity can still bruise. The cinema pick is scrappy and urgent, exactly the kind of film that would never survive a studio notes meeting (and thank God for that). Music brought us an unexpected hook that’s been stuck in the office all week—sorry, not sorry. As for the art winner: it’s the kind of piece that makes you double-take, the digital age’s answer to stopping someone dead in their tracks on a street corner.
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a622e847-5dd5-44a6-b313-2f96cda757fc	285f9c8cf0a3dbb0ccf0b35b83a88c49ca0534d9a362a0b6f6c73621887c7ff2	2025-09-24 15:56:16.053789-05	20250924205616_init	\N	\N	2025-09-24 15:56:16.043069-05	1
bb89087e-348f-4fef-b2eb-64824abed65f	c1bc6745bda3714286dc86e161baab2596e60f333b6808f2fa706dd5f7ad408b	2025-09-29 12:27:46.934298-05	20250929172746_add_editor_note_to_weekdrop	\N	\N	2025-09-29 12:27:46.932833-05	1
c64a05c0-dd5f-4ceb-8e23-05a7795b0b59	932441410f0a99c5f22baffabf3a7d6ff7b5e86e90ed897c5e1bc21088f19744	2025-09-29 17:44:29.614645-05	20250929224429_add_artist_bio	\N	\N	2025-09-29 17:44:29.61302-05	1
\.


--
-- Name: Applause Applause_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Applause"
    ADD CONSTRAINT "Applause_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Featured Featured_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Featured"
    ADD CONSTRAINT "Featured_pkey" PRIMARY KEY (id);


--
-- Name: Feedback Feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_pkey" PRIMARY KEY (id);


--
-- Name: Submission Submission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Submission"
    ADD CONSTRAINT "Submission_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WeekDrop WeekDrop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WeekDrop"
    ADD CONSTRAINT "WeekDrop_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Applause_submissionId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Applause_submissionId_userId_key" ON public."Applause" USING btree ("submissionId", "userId");


--
-- Name: Feedback_submissionId_judgeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Feedback_submissionId_judgeId_key" ON public."Feedback" USING btree ("submissionId", "judgeId");


--
-- Name: Submission_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Submission_slug_key" ON public."Submission" USING btree (slug);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Applause Applause_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Applause"
    ADD CONSTRAINT "Applause_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public."Submission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Applause Applause_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Applause"
    ADD CONSTRAINT "Applause_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public."Submission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Featured Featured_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Featured"
    ADD CONSTRAINT "Featured_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public."Submission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Featured Featured_weekDropId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Featured"
    ADD CONSTRAINT "Featured_weekDropId_fkey" FOREIGN KEY ("weekDropId") REFERENCES public."WeekDrop"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Feedback Feedback_judgeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Feedback Feedback_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public."Submission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Submission Submission_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Submission"
    ADD CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict UEl9C0PL2Tdl58hs4JbfbJS9OtLeYO3XJgduhEkUanK93jVGCc0lroarT2lGrHn

