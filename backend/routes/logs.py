from flask import Blueprint, jsonify, request
from services.log_service import get_recent_logs, get_alerts

logs_bp = Blueprint("logs", __name__)


@logs_bp.route("/", methods=["GET"])
def logs():
    limit = int(request.args.get("limit", 20))
    return jsonify(get_recent_logs(limit=limit))


@logs_bp.route("/alerts", methods=["GET"])
def alerts():
    limit = int(request.args.get("limit", 20))
    return jsonify(get_alerts(limit=limit))
