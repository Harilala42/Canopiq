CREATE TYPE message_role_type AS ENUM ('user', 'model');

CREATE TYPE dataset_type AS ENUM ('carbon_density', 'tree_cover', 'land_use_distribution');

CREATE TYPE job_status_type AS ENUM ('queued', 'analyzing_prompt', 'computing_gee', 'generating_report', 'completed', 'failed', 'canceled');

CREATE TABLE users (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	username text NOT NULL,
	email text NOT NULL UNIQUE,
	avatar_url text,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),

	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE chats (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	title text DEFAULT 'New Chat'::text,
	is_pinned boolean DEFAULT false,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),

	CONSTRAINT chats_pkey PRIMARY KEY (id),
	CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE jobs (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	status job_status_type NOT NULL,
	err_message text,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),

	CONSTRAINT jobs_pkey PRIMARY KEY (id),
	CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE h3_grid_maps (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	legend jsonb NOT NULL,
	h3_cells text[] NOT NULL,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),
	job_id uuid NOT NULL UNIQUE,

	CONSTRAINT h3_grid_maps_pkey PRIMARY KEY (id),
	CONSTRAINT h3_grid_maps_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT h3_grid_maps_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE geo_analysis (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	chat_id uuid NOT NULL,
	location text NOT NULL,
	dataset dataset_type NOT NULL,
	start_time date,
	end_time date,
	boundary geometry(Polygon, 4326) NOT NULL,
	coordinates geometry(Point, 4326) NOT NULL,
	analytics jsonb NOT NULL,
	h3_grid_map_id uuid NOT NULL,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),
	job_id uuid NOT NULL UNIQUE,

	CONSTRAINT geo_analysis_pkey PRIMARY KEY (id),
	CONSTRAINT geo_analysis_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
	CONSTRAINT geo_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT geo_analysis_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
	CONSTRAINT geo_analysis_h3_grid_maps_id_fkey FOREIGN KEY (h3_grid_map_id) REFERENCES h3_grid_maps(id) ON DELETE CASCADE
);

CREATE TABLE messages (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	chat_id uuid NOT NULL,
	role message_role_type NOT NULL,
	content text NOT NULL,
	geo_analysis_id uuid,
	created_at timestamp with time zone DEFAULT now(),
	updated_at timestamp with time zone DEFAULT now(),

	CONSTRAINT messages_pkey PRIMARY KEY (id),
	CONSTRAINT messages_geo_analysis_id_fkey FOREIGN KEY (geo_analysis_id) REFERENCES geo_analysis(id) ON DELETE SET NULL,
	CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
	CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE geo_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

CREATE POLICY "Users can access their own chats" ON chats
	FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access messages from their chats" ON messages
	FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own jobs" ON jobs
	FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own geo-analysis" ON geo_analysis
	FOR SELECT USING (auth.uid() = user_id);
