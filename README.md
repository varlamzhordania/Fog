# FOG

Setup, usage and deployment instructions.

## Requirements

- Docker 24+ with Docker Compose v2
- Git
- `make` (optional; every `make` target below is a shortcut for a `docker compose` command, see the `Makefile`)

---

## Local development

Everything runs in Docker. Code is mounted into the containers, so changes reload automatically.

### 1. Start the stack

```bash
make local-up
```

The first run creates `env/local/*.env` from the `.example` files and builds the images. The defaults work as they are.

| Service    | URL                                  |
|------------|--------------------------------------|
| Storefront | http://localhost:3000                |
| Admin      | http://localhost:8000/admin/         |
| API docs   | http://localhost:8000/api/schema/docs/ |
| PostgreSQL | `127.0.0.1:5433` (credentials in `env/local/compose.env`) |

### 2. Create an admin user

```bash
make local-superuser
```

### 3. Create the OAuth application (needed for login)

1. Open http://localhost:8000/admin/ and go to **OAuth Applications**, then **Add**.
2. Set **Client type** to `Confidential` and **Authorization grant type** to `Resource owner password-based`.
3. Choose a Client id and Client secret (the secret is hashed after the first save, so keep a copy).
4. Put both values in `env/local/frontend.env` as `AUTH_CLIENT_ID` and `AUTH_CLIENT_SECRET`.
5. Apply the change:

```bash
make local-restart-frontend
```

### 4. Load sample data (optional)

```bash
make local-fixtures
```

Sample users share a known development password. Only use this locally.

### Daily commands

| Command                    | What it does                                   |
|----------------------------|------------------------------------------------|
| `make local-up`            | Start (or update) the stack                    |
| `make local-down`          | Stop the stack, keep the data                  |
| `make local-logs`          | Follow all logs                                |
| `make local-shell`         | Shell inside the backend container             |
| `make local-restart-workers` | Restart Celery after changing task code      |
| `make local-reset`         | Stop and **delete** all local data             |

Frontend dependencies are installed automatically when the container starts. After editing `package.json`, run `make local-up`.

### Stripe webhooks (optional)

```bash
stripe listen --forward-to localhost:8000/api/v1/checkout/webhooks/stripe/
```

Copy the printed `whsec_...` value to `STRIPE_WEBHOOK_KEY` in `env/local/backend.env`, then run `make local-up`.

---

## Production deployment

### 1. Prepare the server

- A Linux server with Docker and Compose v2.
- A domain whose DNS points to the server, with ports 80 and 443 open.

```bash
git clone <repository-url> fog && cd fog
```

### 2. Configure

```bash
make init-prod
make secret        # prints a value for DJANGO_SECRET_KEY
```

Fill in the three files:

| File                    | Contains                                                      |
|-------------------------|---------------------------------------------------------------|
| `env/prod/compose.env`  | `SITE_DOMAIN`, `API_DOMAIN`, `PUBLIC_URL`, `API_URL`, `NGINX_MODE`, database credentials |
| `env/prod/backend.env`  | Django secret key, SMTP settings; other payment credentials are configured in Django Admin |
| `env/prod/frontend.env` | OAuth client id and secret (see step 5)                       |

The application image, Docker volumes and `DEBUG=False` are handled by `docker-compose.prod.yml`; there is nothing to comment or uncomment.

### 3. Generate initial Django migrations (required before first deployment)

The custom apps (`account`, `inventory`, `checkout`, and `settings`) must have their migration files in source control. The archive may contain only empty migration directories, so generate the initial migrations before starting the production stack:

```bash
# First configure env/prod/compose.env and env/prod/backend.env as described above.
docker compose -f docker-compose.prod.yml --env-file env/prod/compose.env \
  run --rm backend python manage.py makemigrations account inventory checkout settings
```

Review the generated files under `backend/<app>/migrations/`, keep them with the project source, and then validate the migration plan:

```bash
docker compose -f docker-compose.prod.yml --env-file env/prod/compose.env \
  run --rm backend python manage.py makemigrations --check --dry-run
```

Do not start production until this command reports no model changes pending. The production backend runs `migrate --noinput` automatically at startup.

### 4. Payment network

This version integrates XCash and Stripe; it does not require a `shkeeper_net` Docker network or a SHKeeper container. Configure the payment provider values in Django Admin under the site's Constance settings. For XCash, set the API URL, AppID, HMAC key, and the public HTTPS callback URL:

`https://api.<your-domain>/api/v1/checkout/webhooks/xcash/`

Keep the XCash project webhook enabled and restrict its API IP allowlist to the FOG server's outbound IP where practical.

### 5. First start (HTTP) and certificate

Keep `NGINX_MODE=http` and `USE_HTTPS_IN_ABSOLUTE_URLS=False` *set it to False* for the first start:

```bash
mkdir -p nginx/letsencrypt nginx/certbot-webroot
make prod-up
```

Issue the certificate:

```bash
docker run --rm \
  -v "$PWD/nginx/letsencrypt:/etc/letsencrypt" \
  -v "$PWD/nginx/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d domain.com -d api.domain.com --email you@example.com --agree-tos --no-eff-email
```

Then switch to HTTPS: set `NGINX_MODE=https` in `env/prod/compose.env`, set `USE_HTTPS_IN_ABSOLUTE_URLS=True` in `env/prod/backend.env`, and run:

```bash
make prod-up
```

Certificate renewal (run monthly, for example from cron):

```bash
docker run --rm \
  -v "$PWD/nginx/letsencrypt:/etc/letsencrypt" \
  -v "$PWD/nginx/certbot-webroot:/var/www/certbot" \
  certbot/certbot renew --webroot -w /var/www/certbot \
&& docker compose -f docker-compose.prod.yml --env-file env/prod/compose.env exec nginx nginx -s reload
```

### 6. Admin user and OAuth application

```bash
make prod-superuser
```

Open `https://api.<your-domain>/admin/`, create an **OAuth Application** exactly as described in the local steps above, put its credentials in `env/prod/frontend.env`, and apply:

```bash
make prod-up
```

### 7. Webhooks

- **Stripe:** add `https://api.<your-domain>/api/v1/checkout/webhooks/stripe/` as an endpoint in the Stripe dashboard and configure the signing secret in Django Admin.
- **XCash:** configure the project notify URL as `https://api.<your-domain>/api/v1/checkout/webhooks/xcash/`, and set the matching AppID and HMAC key in Django Admin.

### Operations

| Task                | Command                                    |
|---------------------|--------------------------------------------|
| Deploy an update    | `git pull && make prod-up`                 |
| View logs           | `make prod-logs`                           |
| Service status      | `make prod-ps`                             |
| Database backup     | `make prod-backup` (saved to `backups/`)   |
| Stop                | `make prod-down`                           |

Database migrations run automatically on every start.

---

## Environment files

Real `.env` files are git-ignored. Only the `.example` templates are committed.

```
env/
  local/   compose.env   backend.env   frontend.env
  prod/    compose.env   backend.env   frontend.env
```

`compose.env` is read by Docker Compose, `backend.env` and `frontend.env` are passed to the containers.
