import cv2
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("LungSegmenter")

class LungSegmenter:
    """
    Module 4.1: Segmentation Engine
    Responsible for:
    1. Creating a binary mask of the lungs.
    2. Splitting the mask into 6 Zones (L/R x Upper/Middle/Lower).
    3. Calculating Anatomical Validity Metrics.
    """

    def __init__(self, target_size=(512, 512)):
        self.target_size = target_size
        logger.info(f"LungSegmenter initialized with target size {self.target_size}")

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Resize and normalize image for consistency.
        """
        if image is None:
            return None
        
        # Resize
        img_resized = cv2.resize(image, self.target_size)
        
        # Normalize to 0-255 uint8
        img_norm = cv2.normalize(img_resized, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        return img_norm

    def segment_lungs(self, image: np.ndarray) -> np.ndarray:
        """
        Generates a binary mask where Lungs = 255, Background = 0.
        Uses Heuristic approach:
        1. Inversion (Lungs are dark -> Bright).
        2. Otsu Thresholding.
        3. Morphological Cleaning.
        4. Connected Component Analysis (Keep largest 2 blobs).
        """
        try:
            # 1. Enhance Contrast (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            img_clahe = clahe.apply(image)

            # 2. Thresholding
            # In X-rays, Lungs are dark (low intensity), Bones/Tissue are bright.
            # We want lungs to be the foreground (White/255) for the mask.
            # So we typically invert or threshold the dark pixels.
            
            # Simple inverse binary threshold might work, but Otsu is better on inverted image.
            # Invert: Dark lungs become bright.
            img_inv = cv2.bitwise_not(img_clahe)
            
            # Otsu's thresholding
            _, mask = cv2.threshold(img_inv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # 3. Morphological Operations (Clean up)
            # Use small kernel for opening (remove noise)
            kernel_open = np.ones((5,5), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_open, iterations=2)
            
            # Use LARGER kernel for closing to encompass opacities (pneumonia) inside lungs
            # Pneumonia looks like "not lung" (bright) to the thresholder, so it creates holes.
            # We must close them to include the pathology in the analysis.
            kernel_close = np.ones((20,20), np.uint8) 
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_close, iterations=2)

            # 4. Connected Components (Keep valid lungs)
            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Sort by area (Largest first)
            contours = sorted(contours, key=cv2.contourArea, reverse=True)
            
            # Create a clean mask
            final_mask = np.zeros_like(mask)
            
            # Heuristic: Keep the top 2 largest contours IF they are reasonable size
            # Or just keep the top few and filter by geometry.
            # For simplicity in MVP: Keep top 2 largest contours (likely Left & Right lung).
            # Note: Sometimes lungs are connected, so top 1 might be both.
            
            for i, cnt in enumerate(contours):
                if i >= 2: break # Only take top 2
                
                area = cv2.contourArea(cnt)
                total_area = image.shape[0] * image.shape[1]
                
                # Filter noise: Must be at least 5% of image
                if area > 0.05 * total_area:
                    cv2.drawContours(final_mask, [cnt], -1, 255, thickness=cv2.FILLED)
            
            return final_mask
            
        except Exception as e:
            logger.error(f"Error in segmentation: {e}")
            # Fallback: Return empty mask or full image?
            return np.zeros_like(image)

    def get_zonal_masks(self, lung_mask: np.ndarray) -> dict:
        """
        Splits the lung mask into 6 logic zones.
        Returns a dictionary of masks:
        {
            'L_Upper': mask, 'L_Middle': ..., 'L_Lower': ...,
            'R_Upper': ..., 'R_Middle': ..., 'R_Lower': ...
        }
        """
        zones = {}
        h, w = lung_mask.shape
        
        # 1. Split Left vs Right Logic
        # Calculate center of mass or bounding box center
        M = cv2.moments(lung_mask)
        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
        else:
            cX = w // 2 # Fallback
            
        # Create Left/Right Masks
        left_mask_full = np.zeros_like(lung_mask)
        left_mask_full[:, :cX] = 255 # Left side of image (patient's right? Standard: Patient's Right is Image Left)
        # Wait, radiological convention:
        # Image Left = Patient Right
        # Image Right = Patient Left
        # Let's stick to Image Coordinates for names first (Left_Side, Right_Side), 
        # then map to anatomical if needed.
        # "Left Lung" anatomically is on the Right side of the image.
        # To avoid confusion, let's use 'Left_Image_Side' (Patient Right) and 'Right_Image_Side' (Patient Left)
        # But typically "Left Lung" means the lung on the left side of the body.
        # Let's use anatomical names:
        # RIGHT_LUNG (on image left)
        # LEFT_LUNG (on image right)
        
        # We'll stick to: 'Right_Lung' (Image Left, 0 to cX) and 'Left_Lung' (Image Right, cX to w)
        
        # Apply Logic AND with the main mask
        mask_right_lung_anatomical = cv2.bitwise_and(lung_mask, lung_mask, mask=np.zeros_like(lung_mask))
        mask_right_lung_anatomical[:, :cX] = lung_mask[:, :cX] # Image Left
        
        mask_left_lung_anatomical = cv2.bitwise_and(lung_mask, lung_mask, mask=np.zeros_like(lung_mask))
        mask_left_lung_anatomical[:, cX:] = lung_mask[:, cX:] # Image Right

        # 2. Split Vertical Zones (Upper, Middle, Lower)
        # Find the vertical bounding box of the lungs to avoid empty space
        # Get all white pixels
        points = cv2.findNonZero(lung_mask)
        if points is not None:
            x, y, w_box, h_box = cv2.boundingRect(points)
            top_y = y
            bottom_y = y + h_box
        else:
            top_y, bottom_y = 0, h
            
        lung_height = bottom_y - top_y
        third = lung_height // 3
        
        y1 = top_y + third
        y2 = top_y + 2 * third
        
        # Calculate masks
        # Upper: top_y to y1
        # Middle: y1 to y2
        # Lower: y2 to bottom_y
        
        # Utility to slice
        def create_zone(base_mask, y_start, y_end):
            z = np.zeros_like(base_mask)
            z[y_start:y_end, :] = base_mask[y_start:y_end, :]
            return z

        # Right Lung (Image Left) Zones
        zones['R_Upper'] = create_zone(mask_right_lung_anatomical, top_y, y1)
        zones['R_Middle'] = create_zone(mask_right_lung_anatomical, y1, y2)
        zones['R_Lower'] = create_zone(mask_right_lung_anatomical, y2, bottom_y)
        
        # Left Lung (Image Right) Zones
        zones['L_Upper'] = create_zone(mask_left_lung_anatomical, top_y, y1)
        zones['L_Middle'] = create_zone(mask_left_lung_anatomical, y1, y2)
        zones['L_Lower'] = create_zone(mask_left_lung_anatomical, y2, bottom_y)
        
        return zones

    def calculate_lung_area_ratio(self, lung_mask: np.ndarray) -> float:
        """
        Module 5.1: Anatomy Validator Logic
        """
        total_pixels = lung_mask.size
        lung_pixels = np.count_nonzero(lung_mask)
        
        if total_pixels == 0: return 0.0
        return lung_pixels / total_pixels

if __name__ == "__main__":
    print("LungSegmenter module executable.")
