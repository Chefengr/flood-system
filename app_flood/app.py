from . import create_app

# Legacy support - some systems might expect app in this file
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
