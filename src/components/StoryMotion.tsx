import { useEffect, type ReactNode } from "react";
import {
  AnimatePresence,
  inView,
  motion,
  useAnimate,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { formatNumber } from "../lib/data";

const numberSpring = { visualDuration: 0.6, bounce: 0 };
const formatInteger = (value: number) => formatNumber(Math.round(value));

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
  return <div ref={scope}>{children}</div>;
}

export function AnimatedValue({ value }: { value: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="relative inline-block">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            className="relative inline-block"
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

export function AnimatedNumber({
  value,
  format = formatInteger,
}: {
  value: number;
  format?: (value: number) => string;
}) {
  const reduced = useReducedMotion();
  const spring = useSpring(value, numberSpring);
  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [reduced, spring, value]);
  const text = useTransform(spring, format);
  return (
    <span className="tabular-nums">
      <span className="sr-only">{format(value)}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </span>
  );
}
