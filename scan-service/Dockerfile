# Uses official Semgrep image so the CLI is already installed.
FROM semgrep/semgrep:latest

WORKDIR /app

# Install our app into a venv (base image is externally-managed, so we can't use system pip).
COPY requirements.txt .
RUN python3 -m venv /app/venv && /app/venv/bin/pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Railway/Fly set PORT; default 8080 for local.
ENV PORT=8080
EXPOSE 8080

# Run gunicorn from the venv so it uses our installed packages.
CMD ["sh", "-c", "/app/venv/bin/gunicorn --bind 0.0.0.0:${PORT:-8080} --timeout 300 app:app"]
