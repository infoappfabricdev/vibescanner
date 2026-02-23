# Uses official Semgrep image so the CLI is already installed.
FROM semgrep/semgrep:latest

WORKDIR /app

# Add our web app and its dependencies.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Railway/Fly set PORT; default 8080 for local.
ENV PORT=8080
EXPOSE 8080

# Long timeout so large zips can be scanned.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} --timeout 300 app:app"]
