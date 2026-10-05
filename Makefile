LOCAL := docker compose -f docker-compose.local.yml --env-file env/local/compose.env
PROD  := docker compose -f docker-compose.prod.yml  --env-file env/prod/compose.env

.DEFAULT_GOAL := help
.PHONY: help secret \
    init-local local-up local-down local-reset local-logs local-ps local-shell \
    local-superuser local-fixtures local-restart-workers \
    init-prod prod-up prod-down prod-logs prod-ps prod-superuser prod-backup

help:
	@echo "Local:       make local-up | local-down | local-logs | local-shell | local-superuser | local-fixtures | local-restart-workers | local-reset"
	@echo "Production:  make init-prod | prod-up | prod-down | prod-logs | prod-superuser | prod-backup"
	@echo "Utilities:   make secret"

secret:
	@python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# ---------------------------------------------------------------- local ----

init-local:
	@for f in compose backend frontend; do \
		[ -f env/local/$$f.env ] || { cp env/local/$$f.env.example env/local/$$f.env; echo "created env/local/$$f.env"; }; \
	done

local-up: init-local
	$(LOCAL) up --build -d

local-down:
	$(LOCAL) down

local-reset:
	$(LOCAL) down -v

local-logs:
	$(LOCAL) logs -f --tail=100

local-ps:
	$(LOCAL) ps

local-shell:
	$(LOCAL) exec backend sh

local-superuser:
	$(LOCAL) exec backend python manage.py createsuperuser

local-fixtures:
	$(LOCAL) exec backend python manage.py load_fixtures

local-restart-workers:
	$(LOCAL) restart celery celery-beat

local-restart-frontend:
	$(LOCAL) restart frontend

local-restart-backend:
	$(LOCAL) restart backend

# ----------------------------------------------------------- production ----

init-prod:
	@for f in compose backend frontend; do \
		[ -f env/prod/$$f.env ] || { cp env/prod/$$f.env.example env/prod/$$f.env; echo "created env/prod/$$f.env"; }; \
	done
	@echo "Fill in env/prod/*.env, then run: make prod-up"

prod-up:
	$(PROD) up --build -d

prod-down:
	$(PROD) down

prod-logs:
	$(PROD) logs -f --tail=100

prod-ps:
	$(PROD) ps

prod-superuser:
	$(PROD) exec backend python manage.py createsuperuser

prod-backup:
	@mkdir -p backups
	$(PROD) exec -T db sh -c 'pg_dump -U "$$POSTGRES_USER" "$$POSTGRES_DB"' > backups/db-$$(date +%F-%H%M).sql
	@echo "saved to backups/"
