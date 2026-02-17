import chromadb
import os

def check_db():
    db_path = "./chroma_db"
    print(f"Checking DB at {db_path}")
    if not os.path.exists(db_path):
        print("DB path does not exist.")
    
    try:
        client = chromadb.PersistentClient(path=db_path)
        print("Client initialized.")
        cols = client.list_collections()
        print(f"Collections: {[c.name for c in cols]}")
        
        for c in cols:
            print(f"Collection {c.name} has {c.count()} items.")
            if c.count() > 0:
                print("First item metadata:", c.get(limit=1)['metadatas'])
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
