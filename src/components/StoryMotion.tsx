import { useEffect, type ReactNode } from "react";
import { AnimatePresence, inView, motion, useAnimate, useReducedMotion } from "motion/react";

export function Reveal({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = scope.current;
    // Keep server-rendered and initially visible content visible; enhance later chapters only.
    if (!element || element.getBoundingClientRect().top < window.innerHeight) return;
    let controls: ReturnType<typeof animate> | undefined;
    const stop = inView(
      element,
      () => {
        controls = animate(
          element,
          reduced
            ? { opacity: [0.5, 1] }
            : { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] },
          { duration: reduced ? 0.12 : 0.36, ease: [0.19, 1, 0.22, 1] },
        );
      },
      { amount: 0.2 },
    );
    return () => {
      stop();
      controls?.stop();
    };
  }, [animate, reduced, scope]);
  return (
    <div ref={scope} className="chapter-reveal">
      {children}
    </div>
  );
}

export function AnimatedValue({ value }: { value: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="animated-value">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            className="value-frame"
            initial={reduced ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, transform: "translateY(-4px)" }}
            transition={{ duration: reduced ? 0.1 : 0.18, ease: [0.25, 1, 0.5, 1] }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
