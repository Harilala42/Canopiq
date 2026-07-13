
DC = docker compose
COMPOSE_FILE = docker-compose.yml

.PHONY: all build clean fclean restart

all: build

build:
	$(DC) -f $(COMPOSE_FILE) up -d --build

clean:
	$(DC) -f $(COMPOSE_FILE) down
	docker system prune -f

fclean: clean
	docker volume rm $$(docker volume ls -q) || true
	docker image rm $$(docker image ls -q) || true

restart: clean build
