from flask import Blueprint, jsonify, request
from services.github_service import get_workflow_runs, get_workflow_jobs, get_pipeline_summary
from services.log_service import init_db, ingest_failed_runs

pipelines_bp = Blueprint("pipelines", __name__)

# make sure DB exists on first import
init_db()


@pipelines_bp.route("/", methods=["GET"])
def list_runs():
    limit = int(request.args.get("limit", 20))
    data, code = get_workflow_runs(limit=limit)
    return jsonify(data), code


@pipelines_bp.route("/summary", methods=["GET"])
def summary():
    data, code = get_pipeline_summary()
    return jsonify(data), code


@pipelines_bp.route("/<int:run_id>/jobs", methods=["GET"])
def run_jobs(run_id):
    data, code = get_workflow_jobs(run_id)
    return jsonify(data), code


@pipelines_bp.route("/ingest", methods=["POST"])
def ingest():
    """Pull latest runs and store failed ones into the local DB."""
    runs, code = get_workflow_runs(limit=50)
    if code != 200:
        return jsonify(runs), code
    count = ingest_failed_runs(runs)
    return jsonify({"ingested_failures": count}), 200
