"""
Scan API: accept a zip file, extract it, run Semgrep and Gitleaks, return unified findings.
Designed to run inside the official Semgrep Docker image with Gitleaks installed.
"""
import json
import os
import shutil
import subprocess
import tempfile
from flask import Flask, request, jsonify

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB max upload

# Unified finding shape: same as Semgrep-style so Next.js buildReport can consume.
# Each item: scanner, check_id, path, start: { line }, extra: { message, severity }
GITLEAKS_SEVERITY = "critical"


def path_relative_to_work(path, work_dir):
    """Strip work_dir prefix so path is relative to project root (extracted zip)."""
    if not path or not work_dir:
        return path or ""
    path = path if isinstance(path, str) else str(path)
    work = work_dir.rstrip(os.sep)
    if path == work or path.startswith(work + os.sep):
        return path[len(work) + 1 :] if len(path) > len(work) else path[len(work) :]
    return path


def normalize_semgrep_result(r, work_dir=None):
    """Turn one Semgrep result into a unified finding dict."""
    extra = r.get("extra") or {}
    severity = (extra.get("severity") or "medium").lower()
    if severity in ("error", "critical", "high"):
        severity = "high"
    elif severity in ("warning", "medium"):
        severity = "medium"
    else:
        severity = "low"
    raw_path = r.get("path") or ""
    path = path_relative_to_work(raw_path, work_dir) if work_dir else raw_path
    return {
        "scanner": "semgrep",
        "check_id": r.get("check_id") or "",
        "path": path,
        "start": {"line": r.get("start", {}).get("line") if isinstance(r.get("start"), dict) else None},
        "extra": {
            "message": extra.get("message") or "",
            "severity": severity,
        },
    }


def normalize_gitleaks_finding(f, work_dir=None):
    """Turn one Gitleaks finding into a unified finding dict. Gitleaks = critical."""
    # Gitleaks JSON: RuleID, Description, File, StartLine or Line, etc.
    raw_path = f.get("File") or f.get("file") or ""
    path = path_relative_to_work(raw_path, work_dir) if work_dir else raw_path
    line = f.get("StartLine") or f.get("Line") or f.get("line")
    if line is not None:
        try:
            line = int(line)
        except (TypeError, ValueError):
            line = None
    msg = f.get("Description") or f.get("description") or f.get("RuleID") or "Secret detected"
    return {
        "scanner": "gitleaks",
        "check_id": f.get("RuleID") or "gitleaks-secret",
        "path": path,
        "start": {"line": line},
        "extra": {
            "message": msg,
            "severity": GITLEAKS_SEVERITY,
        },
    }


def run_semgrep(work_dir):
    """Run Semgrep; return (success, list of unified findings, raw_data for compatibility)."""
    try:
        result = subprocess.run(
            ["semgrep", "scan", "--config", "auto", "--json", "--quiet", work_dir],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=work_dir,
        )
        try:
            data = json.loads(result.stdout) if result.stdout else {"results": [], "errors": []}
        except json.JSONDecodeError:
            data = {
                "results": [],
                "errors": [],
                "rawStdout": result.stdout,
                "rawStderr": result.stderr,
                "exitCode": result.returncode,
            }
        results = data.get("results") or []
        if not isinstance(results, list):
            results = []
        findings = [normalize_semgrep_result(r, work_dir) for r in results]
        success = result.returncode in (0, 1)
        return success, findings, data
    except subprocess.TimeoutExpired:
        return False, [], {"results": [], "errors": ["Semgrep timed out"]}
    except Exception as e:
        return False, [], {"results": [], "errors": [str(e)]}


def run_gitleaks(work_dir):
    """Run Gitleaks detect (no-git, source=dir); return (success, list of unified findings, raw list)."""
    try:
        # --report-path - writes JSON to stdout. Exit code 1 when findings exist.
        result = subprocess.run(
            ["gitleaks", "detect", "--no-git", "--source", work_dir, "--report-format", "json", "--report-path", "-"],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=work_dir,
        )
        raw_list = []
        try:
            if result.stdout and result.stdout.strip():
                raw_list = json.loads(result.stdout)
            if not isinstance(raw_list, list):
                raw_list = []
        except json.JSONDecodeError:
            raw_list = []
        findings = [normalize_gitleaks_finding(f, work_dir) for f in raw_list]
        # Exit 1 = findings found (success); 0 = no findings; 2 = error
        success = result.returncode in (0, 1)
        return success, findings, raw_list
    except subprocess.TimeoutExpired:
        return False, [], []
    except Exception:
        return False, [], []


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "VibeScan scan API",
        "health": "/health",
        "scan": "POST /scan with multipart form field 'file' (zip)",
    })


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
        import zipfile
        import io
        work_dir = tempfile.mkdtemp(prefix="vibescan-")
        with zipfile.ZipFile(io.BytesIO(buf), "r") as z:
            z.extractall(work_dir)

        semgrep_ok, semgrep_findings, semgrep_data = run_semgrep(work_dir)
        gitleaks_ok, gitleaks_findings, gitleaks_data = run_gitleaks(work_dir)

        unified = semgrep_findings + gitleaks_findings
        # Sort: critical > high > medium > low (same order as Next.js)
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}

        def sort_key(f):
            sev = (f.get("extra") or {}).get("severity") or "low"
            return (severity_order.get(sev, 99), f.get("path") or "", f.get("start") and f["start"].get("line") or 0)

        unified.sort(key=sort_key)

        # Consider scan successful if at least one scanner succeeded
        success = semgrep_ok or gitleaks_ok
        exit_code = 0 if success else 1

        return jsonify({
            "success": success,
            "exitCode": exit_code,
            "findings": unified,
            "semgrep": semgrep_data,
            "gitleaks": gitleaks_data,
            "stderr": None,
        })
    except Exception as e:
        return jsonify({"error": "Scan failed", "detail": str(e)}), 500
    finally:
        if work_dir and os.path.isdir(work_dir):
            shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
