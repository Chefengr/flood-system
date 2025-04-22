import os
from flask import Flask

def create_app():
    # Get absolute path to templates
    template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates'))
    
    app = Flask(__name__,
               template_folder=template_dir,
               static_folder='../static')
    
    # Rest of your config...
    return app
