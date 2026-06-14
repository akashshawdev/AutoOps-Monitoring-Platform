from flask import Blueprint, jsonify
from services.health_service import get_all_health, get_system_metrics

health_bp = Blueprint("health", __name__)


@health_bp.route("/", methods=["GET"])
def health():
    return jsonify(get_all_health())


@health_bp.route("/system", methods=["GET"])
def system():
    return jsonify(get_system_metrics())
