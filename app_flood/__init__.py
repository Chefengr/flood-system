from flask import Flask

app = Flask(__name__)

# Remove this line: "from app_flood import routes"
# Instead, import routes AFTER creating the app (or inside a function)
