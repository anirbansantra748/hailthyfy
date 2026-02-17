import chromadb
import sys
import os

print(f"Python executable: {sys.executable}")
print(f"ChromaDB version: {chromadb.__version__}")
print(f"ChromaDB file: {chromadb.__file__}")

try:
    from chromadb import PersistentClient
    print("PersistentClient imported successfully.")
    client = PersistentClient(path="./test_db")
    print("PersistentClient instantiated.")
except Exception as e:
    print(f"Error instantiating PersistentClient: {e}")

try:
    import chromadb.config
    print("chromadb.config imported.")
except ImportError:
    print("chromadb.config NOT found.")
