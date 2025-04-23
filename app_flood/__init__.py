from flask import Flask
from app_flood.routes import bp
from flask_cors import CORS
import os

def create_app():
    # Configure absolute paths
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates')
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static')
    #new update
    app = Flask(__name__, template_folder='flood-system/templates', static_folder='flood-system/static')
    app.register_blueprint(bp)

    
    # Configure CORS (keep your existing settings)
    CORS(app, resources={
        r"/api/device-data": {"origins": ["http://192.168.93.4"]},
        r"/api/*": {"origins": "*"}
    })

    # Register blueprint with URL prefix
    from .routes import bp
    app.register_blueprint(bp, url_prefix='/')

    return app
