CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text DEFAULT 'New Chat'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_pinned boolean DEFAULT false,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text CHECK (role = ANY (ARRAY['user'::text, 'model'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  geo_analysis_id uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_geo_analysis_id_fkey FOREIGN KEY (geo_analysis_id) REFERENCES public.geo_analysis(id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.geo_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location text NOT NULL,
  dataset text CHECK (dataset = ANY (ARRAY['tree_cover'::text, 'carbon_density'::text])),
  boundary USER-DEFINED,
  coordinates USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  analytics jsonb,
  start_year date,
  end_year date,
  h3_grid_map_id uuid,
  job_id uuid NOT NULL UNIQUE,
  chat_id uuid NOT NULL,
  CONSTRAINT geo_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT geo_analysis_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT geo_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT geo_analysis_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT geo_analysis_h3_grid_maps_id_fkey FOREIGN KEY (h3_grid_map_id) REFERENCES public.h3_grid_maps(id)
);

CREATE TABLE public.h3_grid_maps (
  user_id uuid NOT NULL,
  hex_geojson jsonb NOT NULL,
  legend jsonb,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE,
  CONSTRAINT h3_grid_maps_pkey PRIMARY KEY (id),
  CONSTRAINT h3_grid_maps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT h3_grid_maps_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);

CREATE TABLE public.jobs (
  status USER-DEFINED NOT NULL DEFAULT 'queued'::job_status_type,
  err_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
