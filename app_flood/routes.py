from flask import Blueprint

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    return "Hello World"

# Add more routes here
@bp.route('/about')
def about():
    return "About Page"
