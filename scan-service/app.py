"""
Minimal scan API: accept a zip file, extract it, run Semgrep, return JSON.
Designed to run inside the official Semgrep Docker image.
"""
import json
import os
import shutil
import subprocess
import tempfile
from flask import Flask, request, jsonify

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB max upload


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


@app.route("/scan", methods=["POST"])
def scan():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Use form field 'file' with a zip file."}), 400

    file = request.files["file"]
    if file.filename == "" or not file.filename.lower().endswith(".zip"):
        return jsonify({"error": "Please upload a zip file."}), 400

    buf = file.read()
    if not buf:
        return jsonify({"error": "Uploaded file is empty."}), 400

    work_dir = None
    try:
        work_dir = tempfile.mkdtemp(prefix="vibescan-")
        # Extract zip using Python's zipfile
        import zipfile
        import io
        with zipfile.ZipFile(io.BytesIO(buf), "r") as z:
            z.extractall(work_dir)

        result = subprocess.run(
            ["semgrep", "scan", "--config", "auto", "--json", "--quiet", work_dir],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=work_dir,
        )

        try:
            semgrep_data = json.loads(result.stdout) if result.stdout else {"results": [], "errors": []}
        except json.JSONDecodeError:
            semgrep_data = {
                "results": [],
                "errors": [],
                "rawStdout": result.stdout,
                "rawStderr": result.stderr,
                "exitCode": result.returncode,
            }

        return jsonify({
            "success": result.returncode in (0, 1),
            "exitCode": result.returncode,
            "semgrep": semgrep_data,
            "stderr": result.stderr or None,
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Scan timed out.", "detail": "Semgrep took too long."}), 504
    except Exception as e:
        return jsonify({"error": "Scan failed", "detail": str(e)}), 500
    finally:
        if work_dir and os.path.isdir(work_dir):
            shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
