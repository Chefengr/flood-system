from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Lazy import to avoid circular imports
    from . import routes
    app.register_blueprint(routes.bp)
    
    return app

app = create_app()  # This creates the app instance
