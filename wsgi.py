from app_flood import create_app
app = create_app()

if __name__ == '__main__':
    # Print all routes for debugging
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule}")
    app.run(host='0.0.0.0', port=5000)
