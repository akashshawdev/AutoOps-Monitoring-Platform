from flask import Blueprint, jsonify
from services.health_service import get_system_metrics
from services.github_service import get_pipeline_summary

metrics_bp = Blueprint("metrics", __name__)


@metrics_bp.route("/", methods=["GET"])
def metrics():
    system = get_system_metrics()
    pipeline, code = get_pipeline_summary()
    if code != 200:
        pipeline = {}
    return jsonify({
        "system":   system,
        "pipeline": pipeline,
    })
