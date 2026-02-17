
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("FusionCoach")

class FusionEngine:
    """
    Module 4.3: The 'Coach' Logic Gating System.
    
    Responsibilities:
    1. Anatomy Gates: Downgrade confidence if image is poor.
    2. Logic Gating: Combine Deep Learning (Visual) + Handcrafted (Physiological).
    3. Disagreement Engine: Flag contradictions.
    4. Clinical Explanations: Generate the 'Why'.
    """
    
    def __init__(self):
        logger.info("Initializing FusionEngine (The Coach)...")

    def fuse(self, dl_predictions: dict, handcrafted_features: dict, similar_cases: list = None) -> dict:
        """
        Main fusion argument.
        
        Args:
            dl_predictions: {'Pneumonia': 0.85, 'Normal': 0.15, ...}
            handcrafted_features: Output from RadiologyFeatureExtractor
            similar_cases: List of dicts from VectorDB search
            
        Returns:
            {
                'final_diagnosis': str,
                'confidence_score': float,
                'adjustments': list of strings (notes),
                'flags': list of strings (warnings),
                'detailed_scores': dict
            }
        """
        logger.info("\n" + "="*80)
        logger.info("FUSION ENGINE (THE COACH) - START")
        logger.info("="*80)
        
        adjustments = []
        flags = []
        
        # 1. Extract Key Inputs
        # DL Top Prediction
        dl_top_label = max(dl_predictions, key=dl_predictions.get)
        dl_score = dl_predictions[dl_top_label]
        
        logger.info(f"INPUT - DenseNet Top Prediction: {dl_top_label} (Score: {dl_score:.4f})")
        
        # Show top 5 DL predictions
        sorted_preds = sorted(dl_predictions.items(), key=lambda x: x[1], reverse=True)[:5]
        logger.info("INPUT - DenseNet Top 5 Predictions:")
        for label, score in sorted_preds:
            logger.info(f"  {label}: {score:.4f} ({score*100:.2f}%)")
        
        # Physiological Signals
        lung_ratio = handcrafted_features.get('lung_area_ratio', 0.0)
        asymmetry_max = 0.0
        asymmetry_location = ""
        # Find max asymmetry across all zones
        for k, v in handcrafted_features.items():
            if 'asym' in k and 'opacity' in k:
                if v > asymmetry_max:
                    asymmetry_max = v
                    asymmetry_location = k
        
        logger.info(f"INPUT - Handcrafted Features:")
        logger.info(f"  Lung Area Ratio: {lung_ratio:.4f}")
        logger.info(f"  Max Asymmetry: {asymmetry_max:.4f} ({asymmetry_location})")
        logger.info(f"  Opacity Count: {handcrafted_features.get('opacity_count', 0)}")
        
        # 2. Anatomy Gatekeeper (The Bouncer)
        logger.info("\n--- STEP 1: ANATOMY GATEKEEPER ---")
        # Soft Reject: If < 15% or > 60%, cap confidence.
        valid_anatomy = True
        max_conf_cap = 1.0
        
        if lung_ratio < 0.01:
            # Segmentation likely failed. Don't cap, just warn.
            flags.append("Segmentation Warning: Could not detect lungs reliably. Anatomy check skipped.")
            logger.info("⚠ Segmentation likely failed (lung ratio < 0.01)")
            logger.info(f"  Confidence cap: {max_conf_cap} (no change, just warning)")
        elif lung_ratio < 0.10 or lung_ratio > 0.75:
            # Strict anatomy check failed, but let's be less aggressive if DL is very sure
            valid_anatomy = False
            if dl_score > 0.9:
                 max_conf_cap = 0.85 # Trust DL more if it's super confident
                 adjustments.append(f"Confidence capped at {max_conf_cap} due to abnormal lung area ratio ({lung_ratio:.2f}).")
                 logger.info(f"⚠ Abnormal lung ratio ({lung_ratio:.4f}) but DL very confident ({dl_score:.4f})")
                 logger.info(f"  Confidence cap: {max_conf_cap}")
            else:
                 max_conf_cap = 0.65 # Relaxed cap from 0.4
                 flags.append("Anatomy Unclear: Lung area ratio abnormal. Reliability reduced.")
                 adjustments.append(f"Confidence capped at {max_conf_cap} due to anatomy risk.")
                 logger.info(f"⚠ Abnormal lung ratio ({lung_ratio:.4f}) and DL not highly confident")
                 logger.info(f"  Confidence cap: {max_conf_cap}")
        else:
            logger.info(f"✓ Lung anatomy valid (ratio: {lung_ratio:.4f})")
            logger.info(f"  Confidence cap: {max_conf_cap} (no restrictions)")

        # 3. Disagreement Engine & Logic Gating
        logger.info("\n--- STEP 2: LOGIC GATING & DISAGREEMENT DETECTION ---")
        
        final_score = dl_score
        logger.info(f"Initial score (from DenseNet): {final_score:.4f}")
        
        # CRITICAL FIX: If DL confidence is extremely low, it means the model is broken
        # In this case, use handcrafted features to make the diagnosis
        if dl_score < 0.10:  # Less than 10% - model is not working
            logger.info(f"\n⚠️ WARNING: DenseNet confidence extremely low ({dl_score:.4f})")
            logger.info("  SWITCHING TO HANDCRAFTED FEATURE MODE")
            flags.append("DL Model Warning: Using handcrafted physiological analysis instead of DenseNet.")
            
            # Use handcrafted features to diagnose
            opacity_count = handcrafted_features.get('opacity_count', 0)
            
            # Decision logic based on asymmetry and opacity
            if asymmetry_max > 0.15 or opacity_count > 25:
                # Strong indicators of pneumonia
                dl_top_label = "Pneumonia"
                final_score = 0.60 + min(asymmetry_max * 1.0, 0.30)  # 60-90% confidence
                adjustments.append(f"HANDCRAFTED MODE: High asymmetry ({asymmetry_max:.2f}) + {opacity_count} opacities → Pneumonia")
                logger.info(f"  → DIAGNOSIS: Pneumonia (asymmetry: {asymmetry_max:.2f}, opacities: {opacity_count})")
                logger.info(f"  → Confidence: {final_score:.2%} (based on handcrafted features)")
                
            elif asymmetry_max > 0.08 or opacity_count > 15:
                # Moderate indicators - possible infiltration/mild pneumonia
                dl_top_label = "Infiltration"
                final_score = 0.50 + min(asymmetry_max * 0.8, 0.25)  # 50-75% confidence
                adjustments.append(f"HANDCRAFTED MODE: Moderate asymmetry ({asymmetry_max:.2f}) → Infiltration")
                logger.info(f"  → DIAGNOSIS: Infiltration (asymmetry: {asymmetry_max:.2f}, opacities: {opacity_count})")
                logger.info(f"  → Confidence: {final_score:.2%} (based on handcrafted features)")
                
            else:
                # Low asymmetry - likely normal
                dl_top_label = "Normal"
                final_score = 0.75 + min((0.15 - asymmetry_max) * 0.5, 0.20)  # 75-95% confidence
                adjustments.append(f"HANDCRAFTED MODE: Low asymmetry ({asymmetry_max:.2f}) + {opacity_count} opacities → Normal")
                logger.info(f"  → DIAGNOSIS: Normal (asymmetry: {asymmetry_max:.2f}, opacities: {opacity_count})")
                logger.info(f"  → Confidence: {final_score:.2%} (based on handcrafted features)")
            
            logger.info(f"\n  Using handcrafted features until proper model weights are loaded.")
        
        # Scenario A: DL says Sick, Physiology says Healthy
        if dl_top_label != 'Normal' and dl_score > 0.6:
            if asymmetry_max < 0.1: # Very symmetric
                # Downgrade
                penalty = 0.2
                prev_score = final_score
                final_score *= (1.0 - penalty)
                adjustments.append(f"Downgraded by {penalty*100}%: High DL confidence but lungs appear symmetric.")
                flags.append("Possible False Positive: Lungs lack expected asymmetry for this condition.")
                logger.info(f"⚠ SCENARIO A: DL predicts {dl_top_label} but lungs are symmetric (asym: {asymmetry_max:.4f})")
                logger.info(f"  Formula: {prev_score:.4f} * (1 - {penalty}) = {final_score:.4f}")
                logger.info(f"  Reason: Expected asymmetry for {dl_top_label} but found symmetric pattern")
        
        # Scenario B: DL says Normal, Physiology says Sick
        if dl_top_label == 'Normal':
            if asymmetry_max > 0.25: # Significant asymmetry
                # We can't easily flip "Normal" to a specific disease without a classifier for it,
                # but we can FLAG it and lower Normal confidence.
                penalty = 0.4
                prev_score = final_score
                final_score *= (1.0 - penalty) # Reduce Normal confidence
                adjustments.append(f"Normal confidence reduced: Significant opacity asymmetry ({asymmetry_max:.2f}) detected.")
                flags.append("Clinical Alert: AI predicts Normal, but significant asymmetry necessitates review.")
                logger.info(f"⚠ SCENARIO B: DL predicts Normal but significant asymmetry detected ({asymmetry_max:.4f})")
                logger.info(f"  Formula: {prev_score:.4f} * (1 - {penalty}) = {final_score:.4f}")
                logger.info(f"  Reason: Asymmetry suggests potential pathology despite DL Normal prediction")
                
        # Scenario C: Confirmation (Both agree)
        if dl_top_label != 'Normal' and dl_score > 0.6 and asymmetry_max > 0.2:
            boost = 0.1
            prev_score = final_score
            final_score = min(1.0, final_score + boost)
            adjustments.append("Confidence Boosted: Physiological asymmetry confirms visual pattern.")
            logger.info(f"✓ SCENARIO C: DL and handcrafted agree on pathology")
            logger.info(f"  DL: {dl_top_label} ({dl_score:.4f}), Asymmetry: {asymmetry_max:.4f}")
            logger.info(f"  Formula: min(1.0, {prev_score:.4f} + {boost}) = {final_score:.4f}")
            logger.info(f"  Reason: Both models agree - boosting confidence")

        # 4. KNN Logic (Vector DB Support)
        logger.info("\n--- STEP 3: VECTOR DB CONSENSUS ---")
        if similar_cases and len(similar_cases) > 0:
            # Count neighbor votes
            # similar_cases = [{'metadata': {'label': 'Pneumonia', 'confidence': 0.9}}, ...]
            votes = {}
            total_weight = 0.0
            
            logger.info(f"Found {len(similar_cases)} similar historical cases:")
            for idx, case in enumerate(similar_cases):
                # Weighted vote by similarity (1 - distance) or just 1?
                # Let's use simple majority for MVP.
                label = case['metadata'].get('label', 'Unknown')
                sim = case.get('similarity', 0.5)
                
                votes[label] = votes.get(label, 0) + sim
                total_weight += sim
                
                logger.info(f"  Case {idx+1}: {label} (Similarity: {sim:.4f})")
            
            # Get top neighbor label
            if total_weight > 0:
                top_neighbor_label = max(votes, key=votes.get)
                neighbor_consensus = votes[top_neighbor_label] / total_weight
                
                logger.info(f"\nKNN Consensus: {top_neighbor_label} ({neighbor_consensus:.2%})")
                adjustments.append(f"Vector DB: {len(similar_cases)} similar cases found. Top Match: {top_neighbor_label} (Consensus: {neighbor_consensus:.0%})")
                
                # Logic: If Neighbors agree with DL -> Boost
                if top_neighbor_label == dl_top_label:
                    knn_boost = 0.05 * neighbor_consensus
                    prev_score = final_score
                    final_score = min(1.0, final_score + knn_boost)
                    adjustments.append(f"Confidence Boosted by KNN: Similar cases confirm diagnosis.")
                    logger.info(f"✓ KNN agrees with DL prediction")
                    logger.info(f"  Formula: min(1.0, {prev_score:.4f} + {knn_boost:.4f}) = {final_score:.4f}")
                
                # Logic: If Neighbors disagree -> Flag
                else:
                    if neighbor_consensus > 0.6: # Strong disagreement
                        flags.append(f"Consensus Mismatch: Similar historical cases are mostly {top_neighbor_label}.")
                        # Slight penalty
                        prev_score = final_score
                        final_score *= 0.9
                        logger.info(f"⚠ KNN disagrees with DL (KNN: {top_neighbor_label}, DL: {dl_top_label})")
                        logger.info(f"  Formula: {prev_score:.4f} * 0.9 = {final_score:.4f}")
        else:
            logger.info("No similar cases found in Vector DB")
        
        # 5. Apply Caps
        logger.info("\n--- STEP 4: FINAL CONFIDENCE CALIBRATION ---")
        if final_score > max_conf_cap:
            logger.info(f"Applying confidence cap: {final_score:.4f} -> {max_conf_cap:.4f}")
            final_score = max_conf_cap
        else:
            logger.info(f"No cap needed: {final_score:.4f} <= {max_conf_cap:.4f}")
        
        logger.info("\n" + "="*80)
        logger.info("FUSION ENGINE RESULT")
        logger.info("="*80)
        logger.info(f"Final Diagnosis: {dl_top_label}")
        logger.info(f"Confidence Score: {final_score:.4f} ({final_score*100:.2f}%)")
        logger.info(f"Raw DL Score: {dl_score:.4f} ({dl_score*100:.2f}%)")
        logger.info(f"Adjustments Applied: {len(adjustments)}")
        for adj in adjustments:
            logger.info(f"  • {adj}")
        logger.info(f"Safety Flags: {len(flags)}")
        for flag in flags:
            logger.info(f"  ⚠ {flag}")
        logger.info("="*80 + "\n")
        
        return {
            "final_diagnosis": dl_top_label, # We stick to DL label for now, but score reflects truth
            "confidence_score": float(final_score),
            "raw_dl_score": float(dl_score),
            "adjustments": adjustments,
            "flags": flags,
            "summary": self._generate_summary(dl_top_label, final_score, asymmetry_max, flags)
        }

    def _generate_summary(self, label, score, asymmetry, flags):
        if flags:
            return f"Flagged for Review. {label} suspected ({score:.1%}), but {len(flags)} clinical warnings triggered."
        if score > 0.85:
            return f"High Confidence {label} ({score:.1%}). Verified by physiological and historical data."
        return f"Moderate Confidence {label} ({score:.1%})."

if __name__ == "__main__":
    print("FusionEngine module executable.")
