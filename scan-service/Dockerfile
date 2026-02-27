# Uses official Semgrep image so the CLI is already installed.
FROM semgrep/semgrep:latest

WORKDIR /app

# Install wget for fetching Gitleaks (Semgrep base image is Alpine — use apk).
ARG GITLEAKS_VERSION=8.30.0
ARG TARGETARCH
RUN apk add --no-cache wget ca-certificates
RUN case "${TARGETARCH}" in \
      amd64) ARCH="x64" ;; \
      arm64) ARCH="arm64" ;; \
      *) ARCH="x64" ;; \
    esac \
    && wget -q "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_${ARCH}.tar.gz" -O /tmp/gitleaks.tar.gz \
    && tar -xzf /tmp/gitleaks.tar.gz -C /usr/local/bin gitleaks \
    && chmod +x /usr/local/bin/gitleaks \
    && rm /tmp/gitleaks.tar.gz

# Install our app into a venv (base image is externally-managed, so we can't use system pip).
COPY requirements.txt .
RUN python3 -m venv /app/venv && /app/venv/bin/pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Run as non-root for security (let Alpine assign UID/GID to avoid conflict with base image).
RUN addgroup appgroup && adduser -G appgroup -D appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Railway/Fly set PORT; default 8080 for local.
ENV PORT=8080
EXPOSE 8080

# Run gunicorn from the venv so it uses our installed packages.
CMD ["sh", "-c", "/app/venv/bin/gunicorn --bind 0.0.0.0:${PORT:-8080} --timeout 300 app:app"]
