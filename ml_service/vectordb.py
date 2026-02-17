import chromadb
import logging
import uuid
import time
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("VectorDBManager")

class VectorDBManager:
    def __init__(self, collection_name="xray_embeddings", host="localhost", port=8000):
        try:
            # Check if we should use local persistence (default for this setup)
            # If CHROMA_HOST is 'localhost' and we are failing, let's just use local dir.
            # Actually, let's prefer local PersistentClient for simplicity unless env var is explicitly set to something else.
            
            db_path = "./chroma_db"
            logger.info(f"Initializing ChromaDB Client (Persistent at {db_path})...")
            
            self.client = chromadb.PersistentClient(path=db_path)
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=collection_name, 
                metadata={"hnsw:space": "cosine"} # Use cosine similarity
            )
            logger.info(f"Connected to collection: {collection_name}")
            logger.info(f"Current collection count: {self.collection.count()}")
            
        except Exception as e:
            logger.error(f"Failed to init ChromaDB: {str(e)}")
            logger.warning("Falling back to IN-MEMORY MOCK VectorDB.")
            
            try:
                from vectordb_mock import VectorDBManagerMock
                self.mock_db = VectorDBManagerMock()
                self.client = "MOCK"
                self.collection = None # Flag to use mock_db logic in methods
            except Exception as e2:
                logger.error(f"Failed to init Mock DB: {e2}")
                self.client = None
                self.collection = None

    def add_record(self, image_id, embedding, metadata, handcrafted_features=None):
        if hasattr(self, 'mock_db') and self.mock_db:
             return self.mock_db.add_record(image_id, embedding, metadata, handcrafted_features)
             
        """
        Add a single record to the vector DB.
        embedding: List of floats (1024-d from DenseNet)
        metadata: Dict (e.g., {"label": "Pneumonia", "confidence": 0.95})
        handcrafted_features: Optional Dict of floats (Physiological metrics)
        """
        if not self.collection:
            logger.warning("VectorDB not initialized. Skipping add_record.")
            return False

        try:
            # Merge Handcrafted Features into Metadata
            # We prefix them to avoid collisions with standard metadata
            final_metadata = metadata.copy()
            if handcrafted_features:
                for k, v in handcrafted_features.items():
                    if isinstance(v, (int, float, str, bool)):
                         final_metadata[f"feat_{k}"] = v
            
            # Ensure ID is string
            doc_id = str(image_id) if image_id else str(uuid.uuid4())
            
            self.collection.add(
                ids=[doc_id],
                embeddings=[embedding],
                metadatas=[final_metadata]
            )
            logger.info(f"Added record {doc_id} to VectorDB")
            return True
        except Exception as e:
            logger.error(f"Error adding record: {str(e)}")
            return False

    def search_similar(self, embedding, k=5, filter_criteria=None):
        if hasattr(self, 'mock_db') and self.mock_db:
             return self.mock_db.search_similar(embedding, k, filter_criteria)
             
        """
        Search for k most similar vectors.
        filter_criteria: Optional Dict for ChromaDB 'where' clause.
                         e.g., {"feat_asym_Lower_opacity": {"$gt": 0.1}}
        """
        if not self.collection or self.collection.count() == 0:
            logger.warning("VectorDB empty or not initialized. Returning empty search results.")
            return []

        try:
            t0 = time.time()
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=k,
                where=filter_criteria, # Apply Logic Filter
                include=["metadatas", "distances"]
            )
            
            # Format results
            # results['ids'][0] is the list of IDs for the first query
            formatted_results = []
            if results['ids'] and len(results['ids']) > 0:
                logger.info(f"--- Vector Search Results (Top {k}) ---")
                for i in range(len(results['ids'][0])):
                    doc_id = results['ids'][0][i]
                    meta = results['metadatas'][0][i]
                    dist = results['distances'][0][i]
                    sim = 1.0 - dist
                    
                    formatted_results.append({
                        "id": doc_id,
                        "metadata": meta,
                        "distance": dist,
                        "similarity": sim
                    })
                    
                    label = meta.get('label', 'Unknown')
                    conf = meta.get('confidence', 'N/A')
                    logger.info(f"  [{i+1}] ID: {doc_id} | Sim: {sim:.4f} | Label: {label} (Conf: {conf})")
                    
                logger.info("---------------------------------------")
            else:
                logger.info("--- Vector Search Results: NONE FOUND ---")
            
            logger.info(f"Search found {len(formatted_results)} results in {(time.time()-t0)*1000:.2f}ms")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching VectorDB: {str(e)}")
            return []

    def count(self):
        if hasattr(self, 'mock_db') and self.mock_db:
             return self.mock_db.count()
             
        if self.collection:
            return self.collection.count()
        return 0

if __name__ == "__main__":
    print("This module provides the VectorDBManager class for ChromaDB.")
