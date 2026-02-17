import logging
import uuid
import numpy as np

logger = logging.getLogger("VectorDBManagerMock")

class VectorDBManagerMock:
    def __init__(self, collection_name="xray_embeddings_mock", host="mock", port=0):
        print(f"WARNING: Using MOCK VectorDB implementation with JSON persistence.")
        logger.warning(f"Using MOCK VectorDB implementation with JSON persistence.")
        self.collection = [] # List of dicts: {'id': str, 'embedding': list, 'metadata': dict}
        self._load()

    def add_record(self, image_id, embedding, metadata, handcrafted_features=None):
        try:
            final_metadata = metadata.copy()
            if handcrafted_features:
                for k, v in handcrafted_features.items():
                    if isinstance(v, (int, float, str, bool)):
                         final_metadata[f"feat_{k}"] = v
            
            doc_id = str(image_id) if image_id else str(uuid.uuid4())
            
            record = {
                'id': doc_id,
                'embedding': embedding,
                'metadata': final_metadata
            }
            self.collection.append(record)
            self._save()
            logger.info(f"Added record {doc_id} to Mock DB. Total: {len(self.collection)}")
            return True
        except Exception as e:
            logger.error(f"Error adding record to mock: {e}")
            return False

    def search_similar(self, embedding, k=5, filter_criteria=None):
        if not self.collection:
            logger.warning("Mock VectorDB empty.")
            return []
            
        try:
            query_emb = np.array(embedding)
            results = []
            
            for record in self.collection:
                rec_emb = np.array(record['embedding'])
                # Cosine Similarity
                dot_product = np.dot(query_emb, rec_emb)
                norm_a = np.linalg.norm(query_emb)
                norm_b = np.linalg.norm(rec_emb)
                similarity = dot_product / (norm_a * norm_b + 1e-9)
                
                results.append({
                    "id": record['id'],
                    "metadata": record['metadata'],
                    "distance": 1.0 - similarity,
                    "similarity": float(similarity)
                })
            
            # Sort by similarity desc
            results.sort(key=lambda x: x['similarity'], reverse=True)
            top_k = results[:k]
            
            logger.info(f"--- Mock Search Results (Top {k}) ---")
            for i, res in enumerate(top_k):
                logger.info(f"  [{i+1}] ID: {res['id']} | Sim: {res['similarity']:.4f} | Label: {res['metadata'].get('label')}")
            
            return top_k

        except Exception as e:
            logger.error(f"Error searching mock DB: {e}")
            return []

    def count(self):
        return len(self.collection)

    def _save(self):
        import json
        try:
            with open("mock_vectordb.json", "w") as f:
                json.dump(self.collection, f)
        except Exception as e:
            logger.error(f"Failed to save mock DB: {e}")

    def _load(self):
        import json
        import os
        if os.path.exists("mock_vectordb.json"):
            try:
                with open("mock_vectordb.json", "r") as f:
                    self.collection = json.load(f)
                logger.info(f"Loaded {len(self.collection)} records from mock_vectordb.json")
            except Exception as e:
                logger.error(f"Failed to load mock DB: {e}")

if __name__ == "__main__":
    db = VectorDBManagerMock()
    db.add_record("test", [0.1]*1024, {"label": "Test"})
    res = db.search_similar([0.1]*1024, k=1)
    print("Search result:", res)
