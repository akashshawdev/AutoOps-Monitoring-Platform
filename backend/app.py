import os
from flask import Flask
from flask_cors import CORS
from routes.pipelines import pipelines_bp
from routes.health import health_bp
from routes.logs import logs_bp
from routes.metrics import metrics_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(pipelines_bp, url_prefix="/api/pipelines")
app.register_blueprint(health_bp,    url_prefix="/api/health")
app.register_blueprint(logs_bp,      url_prefix="/api/logs")
app.register_blueprint(metrics_bp,   url_prefix="/api/metrics")

@app.route("/")
def index():
    return {"status": "AutoOps Monitoring Platform API running", "version": "1.0.0"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
