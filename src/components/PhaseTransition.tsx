import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShabbatModePhase } from "@/hooks/useShabbatMode";

interface PhaseTransitionProps {
  phase: ShabbatModePhase;
  children: ReactNode;
}

// Animated particles for different phases
const PhaseParticles = ({ phase }: { phase: ShabbatModePhase }) => {
  if (phase === "shabbat") {
    // Candle flames
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`candle-${i}`}
            className="absolute text-2xl"
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: [0, 1, 0.8, 0],
              y: [100, -20],
              x: [0, Math.sin(i) * 30],
            }}
            transition={{
              duration: 4,
              delay: i * 0.6,
              repeat: 0,
            }}
            style={{ left: `${15 + i * 14}%`, bottom: 0 }}
          >
            🕯️
          </motion.div>
        ))}
      </div>
    );
  }

  if (phase === "motzei-shabbat") {
    // Stars
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.7, 0],
              scale: [0, 1.2, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3,
              repeat: 0,
            }}
            style={{
              left: `${10 + (i * 11)}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>
    );
  }

  if (phase === "pre-shabbat-rush") {
    // Clock ticking effect
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <motion.div
          className="absolute text-4xl"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.3, 0.5],
          }}
          transition={{ duration: 2, repeat: 0 }}
          style={{ left: "50%", top: "30%", transform: "translateX(-50%)" }}
        >
          ⏰
        </motion.div>
      </div>
    );
  }

  return null;
};

export const PhaseTransition = ({ phase, children }: PhaseTransitionProps) => {
  return (
    <>
      <AnimatePresence>
        <PhaseParticles phase={phase} />
      </AnimatePresence>
      <motion.div
        key={phase}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {children}
      </motion.div>
    </>
  );
};
