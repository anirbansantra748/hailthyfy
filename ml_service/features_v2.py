
import cv2
import numpy as np
import logging
from skimage.feature import graycomatrix, graycoprops, local_binary_pattern
from scipy.stats import entropy
from segmentation import LungSegmenter

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RadiologyFeatures")

class RadiologyFeatureExtractor:
    """
    Module 4.2: Advanced Feature Extractors
    Implements:
    1. Zonal Feature Analysis (Intensity, Texture).
    2. Bilateral Asymmetry Metrics.
    3. Morphology & Shape Analysis.
    4. Frequency Domain Analysis (Gabor).
    """

    def __init__(self):
        logger.info("Initializing RadiologyFeatureExtractor...")
        self.segmenter = LungSegmenter()

    def extract(self, image_bytes: bytes) -> dict:
        try:
            logger.info("="*80)
            logger.info("HANDCRAFTED FEATURE EXTRACTION - START")
            logger.info("="*80)
            
            # 1. Preprocess & Segment
            # We need to decode bytes first, similar to original features.py
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_raw = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            if img_raw is None:
                logger.error("Failed to decode image")
                return {}

            logger.info(f"Image decoded: Shape={img_raw.shape}, Dtype={img_raw.dtype}")

            # Use segmenter to normalize and get masks
            img = self.segmenter.preprocess(img_raw)
            logger.info(f"Image preprocessed: Shape={img.shape}, Range=[{img.min()}, {img.max()}]")
            
            lung_mask = self.segmenter.segment_lungs(img)
            lung_pixels_count = np.count_nonzero(lung_mask)
            logger.info(f"Lung segmentation complete: {lung_pixels_count} lung pixels identified")
            
            # Get Zones
            zones = self.segmenter.get_zonal_masks(lung_mask)
            logger.info(f"Zonal masks created: {list(zones.keys())}")
            
            features = {}
            
            # 2. Global Anatomy Metrics
            features['lung_area_ratio'] = self.segmenter.calculate_lung_area_ratio(lung_mask)
            logger.info(f"Global Lung Area Ratio: {features['lung_area_ratio']:.4f}")
            
            # 3. Zonal Analysis (Intensity & Texture)
            # Calculate Global Mean for Normalization
            lung_pixels = img[lung_mask > 0]
            if len(lung_pixels) > 0:
                global_mean = np.mean(lung_pixels)
            else:
                global_mean = 1.0 # Avoid div/0
                
            features['global_lung_mean'] = float(global_mean)
            logger.info(f"Global Lung Mean Intensity: {global_mean:.2f}")
            
            logger.info("\n--- ZONAL ANALYSIS ---")
            # Iterate zones
            zone_metrics = {}
            for z_name, z_mask in zones.items():
                z_pixels = img[z_mask > 0]
                
                if len(z_pixels) == 0:
                    zone_metrics[f"{z_name}_mean"] = 0.0
                    zone_metrics[f"{z_name}_std"] = 0.0
                    zone_metrics[f"{z_name}_entropy"] = 0.0
                    zone_metrics[f"{z_name}_contrast"] = 0.0
                    logger.info(f"  {z_name}: No pixels (skipped)")
                    continue
                
                # Intensity
                z_mean = np.mean(z_pixels)
                z_std = np.std(z_pixels)
                
                # Normalized Intensity
                zone_metrics[f"{z_name}_mean"] = float(z_mean)
                zone_metrics[f"{z_name}_norm_mean"] = float(z_mean / (global_mean + 1e-6))
                zone_metrics[f"{z_name}_std"] = float(z_std)
                
                # Texture (LBP Entropy - faster than GLCM for zones)
                # LBP radius 1, points 8
                lbp = local_binary_pattern(img, 8, 1, method='uniform')
                lbp_zone = lbp[z_mask > 0]
                hist, _ = np.histogram(lbp_zone, bins=np.arange(0, 59), density=True)
                z_entropy = entropy(hist + 1e-7)
                zone_metrics[f"{z_name}_entropy"] = float(z_entropy)
                
                # Log zone details
                logger.info(f"  {z_name}: Mean={z_mean:.2f}, Std={z_std:.2f}, Norm={zone_metrics[f'{z_name}_norm_mean']:.3f}, Entropy={z_entropy:.3f}")
                
            features.update(zone_metrics)

            # 4. Bilateral Asymmetry
            logger.info("\n--- BILATERAL ASYMMETRY ---")
            # Compare L vs R for each zone level
            for level in ['Upper', 'Middle', 'Lower']:
                l_key = f"L_{level}"
                r_key = f"R_{level}"
                
                # Opacity Asymmetry
                l_val = zone_metrics.get(f"{l_key}_mean", 0)
                r_val = zone_metrics.get(f"{r_key}_mean", 0)
                asym = abs(l_val - r_val) / (l_val + r_val + 1e-6)
                features[f"asym_{level}_opacity"] = float(asym)
                
                # Texture Asymmetry
                l_txt = zone_metrics.get(f"{l_key}_entropy", 0)
                r_txt = zone_metrics.get(f"{r_key}_entropy", 0)
                asym_txt = abs(l_txt - r_txt) / (l_txt + r_txt + 1e-6)
                features[f"asym_{level}_texture"] = float(asym_txt)
                
                # Log asymmetry details
                logger.info(f"  {level} Opacity Asymmetry: {asym:.4f} (L={l_val:.2f}, R={r_val:.2f})")
                logger.info(f"  {level} Texture Asymmetry: {asym_txt:.4f} (L={l_txt:.3f}, R={r_txt:.3f})")

            # 5. Morphology (Shape of Opacities)
            logger.info("\n--- MORPHOLOGY ANALYSIS ---")
            # Threshold high intensity regions inside lungs
            # 'High' means significantly brighter than global mean
            thresh_val = global_mean + 1.5 * np.std(lung_pixels) if len(lung_pixels) > 0 else 127
            logger.info(f"  Opacity threshold: {thresh_val:.2f} (Mean + 1.5*Std)")
            
            _, opacity_mask = cv2.threshold(img, thresh_val, 255, cv2.THRESH_BINARY)
            
            # Mask with lungs
            opacity_mask = cv2.bitwise_and(opacity_mask, lung_mask)
            
            # Find contours of opacities
            contours, _ = cv2.findContours(opacity_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Analyze largest opacity
                max_cnt = max(contours, key=cv2.contourArea)
                area = cv2.contourArea(max_cnt)
                perimeter = cv2.arcLength(max_cnt, True)
                
                if perimeter > 0:
                    compactness = (4 * np.pi * area) / (perimeter ** 2)
                else:
                    compactness = 0.0
                    
                features['max_opacity_area'] = float(area)
                features['max_opacity_compactness'] = float(compactness)
                features['opacity_count'] = len(contours)
                
                logger.info(f"  Detected {len(contours)} opacities")
                logger.info(f"  Largest opacity: Area={area:.1f}, Compactness={compactness:.3f}")
            else:
                features['max_opacity_area'] = 0.0
                features['max_opacity_compactness'] = 0.0
                features['opacity_count'] = 0
                logger.info(f"  No significant opacities detected")

            # 6. Frequency Analysis (Gabor)
            logger.info("\n--- FREQUENCY ANALYSIS (Gabor) ---")
            # Apply one Gabor filter (average direction) as a general "Lung Marking" detector
            # Wavelength 10, Theta 0 (Vertical lines - ribs/spine? No, we want tissue pattern)
            # Multiple filters
            gabor_means = []
            for theta in [0, np.pi/4, np.pi/2, 3*np.pi/4]:
                kernel = cv2.getGaborKernel((21, 21), 5.0, theta, 10.0, 0.5, 0, ktype=cv2.CV_32F)
                filtered = cv2.filter2D(img, cv2.CV_8UC3, kernel)
                # Mask with lungs
                filtered_lung = filtered[lung_mask > 0]
                if len(filtered_lung) > 0:
                    gabor_means.append(np.mean(filtered_lung))
            
            if gabor_means:
                features['gabor_mean_energy'] = float(np.mean(gabor_means))
                logger.info(f"  Gabor mean energy: {features['gabor_mean_energy']:.3f}")
            else:
                features['gabor_mean_energy'] = 0.0
                logger.info(f"  Gabor mean energy: 0.0 (no valid filter responses)")

            # SUMMARY
            logger.info("\n" + "="*80)
            logger.info("HANDCRAFTED FEATURES SUMMARY")
            logger.info("="*80)
            logger.info(f"Total Features Extracted: {len(features)}")
            logger.info(f"Lung Area Ratio: {features['lung_area_ratio']:.4f} {'✓ NORMAL' if 0.15 < features['lung_area_ratio'] < 0.60 else '⚠ ABNORMAL'}")
            
            # Find max asymmetry
            max_asym = 0.0
            max_asym_location = ""
            for level in ['Upper', 'Middle', 'Lower']:
                asym_val = features.get(f"asym_{level}_opacity", 0)
                if asym_val > max_asym:
                    max_asym = asym_val
                    max_asym_location = level
            
            logger.info(f"Max Opacity Asymmetry: {max_asym:.4f} in {max_asym_location} zone {'⚠ SIGNIFICANT' if max_asym > 0.25 else '✓ SYMMETRIC'}")
            logger.info(f"Opacity Count: {features['opacity_count']} {'⚠ MULTIPLE' if features['opacity_count'] > 3 else '✓ NORMAL/FEW'}")
            logger.info("="*80 + "\n")

            return features

        except Exception as e:
            logger.error(f"Error in RadiologyFeatureExtractor: {e}", exc_info=True)
            return {}

if __name__ == "__main__":
    print("RadiologyFeatureExtractor module executable.")
