import cv2
import numpy as np
import logging
from skimage.feature import graycomatrix, graycoprops, local_binary_pattern
from scipy.stats import skew, kurtosis
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("HandcraftedFeatures")

class HandcraftedFeatureExtractor:
    def __init__(self):
        logger.info("Initializing HandcraftedFeatureExtractor...")

    def extract_features(self, image_bytes: bytes) -> dict:
        """
        Main method to extract all handcrafted features from raw image bytes.
        """
        try:
            start_total = time.time()
            logger.info("Starting feature extraction pipeline...")

            # 1. Preprocessing
            img_gray = self._preprocess(image_bytes)
            if img_gray is None:
                logger.error("Preprocessing failed. Returning empty features.")
                return {}

            features = {}

            # 2. Histogram Features (Intensity)
            logger.info("Extracting Histogram features...")
            hist_feats = self._extract_histogram(img_gray)
            features.update(hist_feats)
            logger.info(f"Histogram features extracted: {list(hist_feats.keys())}")

            # 3. Texture Features (GLCM)
            logger.info("Extracting GLCM Texture features...")
            glcm_feats = self._extract_glcm(img_gray)
            features.update(glcm_feats)
            logger.info(f"GLCM features extracted: {list(glcm_feats.keys())}")

            # 4. Local Binary Patterns (LBP)
            logger.info("Extracting LBP features...")
            lbp_feats = self._extract_lbp(img_gray)
            features.update(lbp_feats)
            logger.info(f"LBP features extracted: {list(lbp_feats.keys())}")

            # 5. Structural Features (Edges & CTR)
            logger.info("Extracting Structural features (Edges, CTR)...")
            struct_feats = self._extract_structural(img_gray)
            features.update(struct_feats)
            logger.info(f"Structural features extracted: {list(struct_feats.keys())}")

            total_time = (time.time() - start_total) * 1000
            logger.info(f"Feature extraction complete in {total_time:.2f}ms. Total features: {len(features)}")
            
            return features

        except Exception as e:
            logger.error(f"Critical error in feature extraction: {str(e)}", exc_info=True)
            return {}

    def _preprocess(self, image_bytes):
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            if img is None:
                logger.error("Failed to decode image bytes")
                return None

            # Resize for consistency (e.g., 512x512)
            img_resized = cv2.resize(img, (512, 512))
            logger.debug(f"Image preprocessed: {img_resized.shape}")
            return img_resized
        except Exception as e:
            logger.error(f"Error in preprocessing: {str(e)}")
            return None

    def _extract_histogram(self, img):
        try:
            # Flatten image
            pixels = img.flatten()
            
            t0 = time.time()
            res = {
                "hist_mean": float(np.mean(pixels)),
                "hist_std": float(np.std(pixels)),
                "hist_skew": float(skew(pixels)),
                "hist_kurtosis": float(kurtosis(pixels)),
                "hist_max": float(np.max(pixels)),
                "hist_min": float(np.min(pixels))
            }
            logger.debug(f"Histogram calculation took {(time.time()-t0)*1000:.2f}ms")
            return res
        except Exception as e:
            logger.error(f"Error in Histogram extraction: {str(e)}")
            return {}

    def _extract_glcm(self, img):
        try:
            t0 = time.time()
            # GLCM requires integer type, usually slightly quantified to reduce matrix size
            # We'll use 8 bins (0-255 -> 0-7) for speed if needed, but 256 is fine for 512x512
            # Let's simple use the image as is (0-255)
            
            # Distances: 1 pixel, 3 pixels. Angles: 0, 45, 90, 135 degrees
            distances = [1, 3]
            angles = [0, np.pi/4, np.pi/2, 3*np.pi/4]
            
            glcm = graycomatrix(img, distances=distances, angles=angles, levels=256, symmetric=True, normed=True)
            
            # Calculate properties
            contrast = graycoprops(glcm, 'contrast').mean()
            dissimilarity = graycoprops(glcm, 'dissimilarity').mean()
            homogeneity = graycoprops(glcm, 'homogeneity').mean()
            energy = graycoprops(glcm, 'energy').mean()
            correlation = graycoprops(glcm, 'correlation').mean()
            
            res = {
                "texture_contrast": float(contrast),
                "texture_dissimilarity": float(dissimilarity),
                "texture_homogeneity": float(homogeneity),
                "texture_energy": float(energy),
                "texture_correlation": float(correlation)
            }
            logger.debug(f"GLCM calculation took {(time.time()-t0)*1000:.2f}ms")
            return res
        except Exception as e:
            logger.error(f"Error in GLCM extraction: {str(e)}")
            return {}

    def _extract_lbp(self, img):
        try:
            t0 = time.time()
            # Parameters for LBP
            radius = 3
            n_points = 8 * radius
            
            lbp = local_binary_pattern(img, n_points, radius, method='uniform')
            
            # Histogram of LBP
            n_bins = int(lbp.max() + 1)
            hist, _ = np.histogram(lbp.ravel(), bins=n_bins, range=(0, n_bins), density=True)
            
            # We can use entropy or specific high-frequency bins as features
            # Here we store just the entropy (complexity) and top 2 bin values
            lbp_entropy = -np.sum(hist * np.log2(hist + 1e-7))
            sorted_hist = np.sort(hist)[::-1]
            
            res = {
                "lbp_entropy": float(lbp_entropy),
                "lbp_uniformity": float(sorted_hist[0]), # Most common pattern
                "lbp_edge_density": float(sorted_hist[1]) # Second most common
            }
            logger.debug(f"LBP calculation took {(time.time()-t0)*1000:.2f}ms")
            return res
        except Exception as e:
            logger.error(f"Error in LBP extraction: {str(e)}")
            return {}

    def _extract_structural(self, img):
        try:
            t0 = time.time()
            features = {}
            
            # 1. Canny Edges
            edges = cv2.Canny(img, 100, 200)
            edge_pixel_ratio = np.count_nonzero(edges) / edges.size
            features["edge_density"] = float(edge_pixel_ratio)
            
            # 2. Experimental CTR (Cardiothoracic Ratio)
            # Find contours to approximate lungs and heart
            # This is a HEURISTIC approximation. 
            # We assume the largest dark regions are lungs and the central bright region is heart/spine.
            
            # Threshold to separate bones/fluid (bright) from air (dark)
            _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
            
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            # Sort contours by area
            contours = sorted(contours, key=cv2.contourArea, reverse=True)
            
            # Typically: 
            # - Largest contour often encompasses the whole chest cavity or body outline
            # - Two large internal dark regions are lungs (in inverted image) or bright bones (in normal)
            
            # Heuristic: Calculate width of the bounding box of the largest valid contour (Body/Ribs) vs Heart
            # For robust CTR, we need segmentation. Here we rely on "Projection Profile"
            
            # Horizontal projection profile (sum of pixels along vertical axis)
            h_proj = np.sum(img, axis=0)
            
            # Chest width: approximate by width of non-zero (or above threshold) profile
            non_zero_indices = np.where(h_proj > np.max(h_proj) * 0.2)[0]
            if len(non_zero_indices) > 0:
                chest_width = non_zero_indices[-1] - non_zero_indices[0]
            else:
                chest_width = 1
                
            # Heart width: usually the central peak in the projection
            # Smooth the profile
            # This is very rough: just taking central 1/3rd max width? 
            # Let's stick to a simpler proxy: "Central Brightness Ratio"
            
            h, w = img.shape
            center_strip = img[:, w//3 : 2*w//3]
            features["central_brightness_mean"] = float(np.mean(center_strip))
            
            # Estimated CTR (Dummy heuristic for now if robust seg fails)
            # Real CTR requires segmentation. We will return a placeholder or simple ratio
            # edge density is a good proxy for structural complexity
            
            features["estimated_ctr_proxy"] = features["central_brightness_mean"] / (np.mean(img) + 1e-6)

            logger.debug(f"Structural analysis took {(time.time()-t0)*1000:.2f}ms")
            return features
            
        except Exception as e:
            logger.error(f"Error in Structural extraction: {str(e)}")
            return {}

if __name__ == "__main__":
    print("This module provides the HandcraftedFeatureExtractor class.")
