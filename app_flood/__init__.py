from flask import Flask, render_template
from flask_cors import CORS
from app_flood.routes import bp
import os

def create_app():
    # Define base directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    # Configure Flask
    app = Flask(
        __name__,
        template_folder=os.path.join(base_dir, 'templates'),
        static_folder=os.path.join(base_dir, 'static')
    )

    # Enable CORS
    CORS(app, resources={
        r"/api/device-data": {"origins": ["http://192.168.93.4"]},
        r"/api/*": {"origins": "*"}
    })

    # Register routes
    app.register_blueprint(bp, url_prefix='/')

    # Catch-all route for undefined paths (404 fallback)
    @app.errorhandler(404)
    def not_found(e):
        # Optional: log the 404 error or render a nice error page
        return render_template('404.html'), 404

    return app
