<p align="center">
  <img src="./frontend/src/assets/logo.svg" alt="Canopiq Logo" width="150"/>
</p>

# Canopiq: GeoAI Agent for Planetary Carbon 🛰️ & Environmental Monitoring 🌱

Canopiq is an advanced, planetary-scale GeoAI Agent designed to democratize complex environmental monitoring and carbon accounting. By bridging the gap between natural language processing (NLP) and cloud-based remote sensing data, Canopiq enables scientists, researchers, and academic students to estimate biomass carbon sequestration, cover vegetation and land-use distribution for any geographic location using simple, conversational queries.

Traditional geospatial analysis requires deep expertise in satellite data processing, complex programming languages, and heavy GIS software. Canopiq eliminates this barrier to entry. Users can interact with the platform as if they were speaking to an expert data scientist—asking natural language questions about local tree cover, biomass density, or land-use distribution —and instantly receive structured, visual, and scientifically sound analytical reports.

<video width="100%" autoplay muted loop>
    <source src="./frontend/public/demo.mp4" type="video/mp4">
</video>

# ✨ Key Features

- **AI-Driven Geospatial Analysis:** When a user submits a natural language query, the AI pipeline (Graph-Based Multi-Agent Workflow orchestrated via LangGraph and powered by Gemini model) parses the user's intent. It extracts relevant spatial boundaries, timeframes, and environmental parameters, translating the prompt into executable GIS data tasks.

- **GIS Data Processing & Spatial Indexing:** The translated requests are routed to Google Earth Engine (GEE), which performs heavy-lifting computations (such as linear regression models for biomass estimation) across massive satellite datasets from Sentinel-2. To optimize performance and ensure rapid query times, spatial data is binned using Uber's H3 Grid Indexing system, which groups geospatial regions into highly performant hexagonal clusters.

- **Interactive Markdown Report & Dynamic Mapping:** The computed results are streamed back to a responsive frontend interface built with React.js and TypeScript. Users can interactively explore an auto-generated, rich Markdown report that integrates seamlessly with a dynamic React Leaflet 2D map displaying precise H3 grid overlays. Instead of a static dashboard layout, granular time-series data and environmental trends are natively embedded directly within the narrative flow of the generated report using highly composable Recharts visualizations.

# 🛠️ Tech Stack

- **Frontend:** React.js, TypeScript, Zustand, Chakra UI v3, React Leaflet, Recharts, React Markdown

- **Backend & Data Validation:** FastAPI, Python, Pydantic, Celery Worker, Redis Queue

- **Database & Auth & Synchronization:** Supabase (PostgreSQL, PostGIS, Real-Time WebSocket)

- **AI & LLM Orchestration:** LangChain, LangGraph, Gemini AI, Graph-based Agentic Workflow, NLP (Natural Language Processing), Prompt Engineering

- **Geospatial Computing:** Google Earth Engine, GeoPandas, H3 Grid Indexing

- **Testing:** Jest, PyTest

# ⚙️ Architecture

![architecture_diagram](./frontend/public/architecture_diagram.png)

# 🗄️ Database Schemas

```mermaid
erDiagram
	users {
		uuid id PK
		text username "UNIQUE"
		text email "UNIQUE"
		text avatar_url
		timestamp_with_time_zone created_at
		timestamp_with_time_zone updated_at
	}

	chats {
		uuid id PK
		uuid user_id FK
		text title
		timestamp_with_time_zone created_at
		timestamp_with_time_zone updated_at
		boolean is_pinned
	}

	messages {
		uuid id PK
		uuid chat_id FK
		uuid user_id FK
		uuid geo_analysis_id FK
		text role "user | model"
		text content
		timestamp_with_time_zone created_at
	}

	geo_analysis {
		uuid id PK
		uuid user_id FK
		uuid chat_id FK
		uuid job_id FK "UNIQUE"
		uuid h3_grid_map_id FK
		text location
		text dataset "tree_cover | carbon_density | land_use_distribution"
		geometry boundary
		geometry coordinates
		timestamp_with_time_zone created_at
		jsonb analytics
		date start_year
		date end_year
	}

	jobs {
		uuid id PK "UNIQUE"
		uuid user_id FK
		text status "queued | analyzing_prompt | computing_gee | generating_report | completed | failed | canceled"
		text err_message
		timestamp_with_time_zone created_at
		timestamp_with_time_zone updated_at
	}

	h3_grid_maps {
		uuid id PK
		uuid user_id FK
		uuid job_id FK "UNIQUE"
		geometry hex_geojson
		jsonb legend
	}

	users ||--o{ chats : "has"
	users ||--o{ messages : "sends"
	users ||--o{ geo_analysis : "requests"
	users ||--o{ jobs : "triggers"
	users ||--o{ h3_grid_maps : "owns"

	chats ||--o{ messages : "contains"
	chats ||--o{ geo_analysis : "contains"

	jobs ||--|| geo_analysis : "processes"
	jobs ||--|| h3_grid_maps : "generates"

	h3_grid_maps ||--o{ geo_analysis : "referenced_by"
	geo_analysis ||--o{ messages : "attached_to"
```

# 📂 Project Structure

Canopiq is architected as a production-ready monorepo consisting of a decoupled React frontend application and a domain-driven monolithic FastAPI backend pipeline:

	Canopiq/
	├── backend/               # 🐍 FastAPI & Python, Monolith Server, LangChain GeoAI Agent
	├── frontend/              # ⚛️ React & TypeScript, Geospatial Dashboard UI
	├── docker-compose.yml     # Orchestrator spinning up backend, frontend
	├── Makefile               # Developer environment task automations (build, test, run)
	└── README.md              # Main project hub documentation

# 📖 Services Documentation

For more details about technical implementations specific to each service, explore their dedicated documentation hubs: 
- **[Frontend Architecture](./frontend/README.md)**: Explains the MVC-based pattern using Zustand and custom React Hooks controllers, alongside the Jest unit testing.
- **[Backend & GeoAI Agent](./backend/README.md)**: Dives into the asynchronous LangGraph agentic pipeline, Google Earth Engine (GEE) satellite computing, and Uber H3 grid indexing with GeoPandas.
