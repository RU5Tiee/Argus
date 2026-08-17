import logging
from app.core.config import settings

logger = logging.getLogger("argus.ids.cusum")

class CUSUMDetector:
    def __init__(self):
        self.prev_temp: float = 45.0
        self.prev_press: float = 2.4
        self.cusum_score: float = 0.0
        self.k_drift: float = 0.05
        self.h_threshold: float = 1.0

    def evaluate_temp_change(self, current_temp: float, dt: float = 0.1) -> tuple[bool, str, float]:
        """
        Evaluates physical temperature delta against immutable laws of physics.
        Returns: (is_attack, attack_type, delta_t)
        """
        delta_t = abs(current_temp - self.prev_temp)
        rate_per_sec = delta_t / dt if dt > 0 else 0.0

        # Instantaneous Jump Detection (Sudden False Data Injection)
        if delta_t > settings.MAX_TEMP_JUMP_PER_CYCLE:
            logger.warning(
                f"PB-IDS INSTANT JUMP TRIGGERED: Temp jump of {delta_t:.2f}°C in {dt}s "
                f"({rate_per_sec:.1f}°C/sec) exceeds max physical limit ({settings.MAX_TEMP_JUMP_PER_SEC}°C/s)."
            )
            return True, "SUDDEN_PHYSICAL_JUMP", delta_t

        # Cumulative Sum (CUSUM) for Slow-Drift Evasion Attacks
        expected_max_drift = settings.MAX_TEMP_JUMP_PER_CYCLE
        if delta_t > (expected_max_drift * 0.8):
            self.cusum_score = max(0.0, self.cusum_score + (delta_t - self.k_drift))
        else:
            self.cusum_score = max(0.0, self.cusum_score - 0.02)

        if self.cusum_score > self.h_threshold:
            logger.warning(
                f"PB-IDS CUSUM SLOW-DRIFT TRIGGERED: Score {self.cusum_score:.2f} > Threshold {self.h_threshold:.2f}"
            )
            self.cusum_score = 0.0
            return True, "SLOW_DRIFT_EVASION", delta_t

        self.prev_temp = current_temp
        return False, "NORMAL", delta_t

cusum_detector = CUSUMDetector()
