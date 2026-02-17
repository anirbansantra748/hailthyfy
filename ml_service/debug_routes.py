import sys
import os

# Ensure we can import main
sys.path.append(os.getcwd())

try:
    from main import app
    print("Successfully imported app from main.")
    
    print("\n--- Registered Routes ---")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        print(f"Path: {route.path}, Methods: {methods}, Name: {route.name}")
        
except ImportError as e:
    print(f"Failed to import app: {e}")
except Exception as e:
    print(f"Error inspecting app: {e}")
