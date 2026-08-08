
DC = docker compose
COMPOSE_FILE = docker-compose.yml

.PHONY: all build clean fclean restart

all: build

build:
	$(DC) -f $(COMPOSE_FILE) up -d --build

clean:
	$(DC) -f $(COMPOSE_FILE) down

fclean: clean
	$(DC) -f $(COMPOSE_FILE) down -v
	docker system prune -af

restart: clean build
