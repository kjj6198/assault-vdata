import { useEffect, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  inView,
  motion,
  useAnimate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { formatNumber } from "../lib/data";
import { useReducedMotionPreference } from "../lib/use-reduced-motion";

const numberTransition = { duration: 0.6, ease: (progress: number) => 1 - (1 - progress) ** 4 };
const formatInteger = (value: number) => formatNumber(Math.round(value));

export function Reveal({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useReducedMotionPreference();
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
  const reduced = useReducedMotionPreference();
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
            transition={{
              duration: reduced ? 0.12 : 0.18,
              ease: [0.25, 1, 0.5, 1],
              ...(reduced && { transform: { duration: 0 } }),
            }}
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
  const reduced = useReducedMotionPreference();
  const current = useMotionValue(value);
  useEffect(() => {
    if (reduced) {
      current.jump(value);
      return;
    }
    const animation = animate(current, value, numberTransition);
    return () => animation.stop();
  }, [current, reduced, value]);
  const text = useTransform(current, format);
  return (
    <span className="tabular-nums">
      <span className="sr-only">{format(value)}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </span>
  );
}

/** Spring for one digit rolling into place. */
const digitSpring = { type: "spring", visualDuration: 0.45, bounce: 0.18 } as const;
const digitVariants = {
  enter: (direction: number) => ({ opacity: 0, y: `${direction * 100}%` }),
  rest: { opacity: 1, y: "0%" },
  exit: (direction: number) => ({ opacity: 0, y: `${direction * -100}%` }),
};

export function AnimatedDigits({ value }: { value: number }) {
  const reduced = useReducedMotionPreference();
  const [previous, setPrevious] = useState({ value, direction: 1 });
  if (previous.value !== value) {
    setPrevious({ value, direction: value > previous.value ? 1 : -1 });
  }
  const direction = reduced ? 0 : previous.direction;
  return (
    <span className="inline-flex leading-none tabular-nums">
      <span className="sr-only">{value}</span>
      {String(value)
        .split("")
        .map((digit, index) => (
          <span
            className="relative inline-block h-4 w-[1ch] overflow-hidden"
            key={index}
            aria-hidden="true"
          >
            <AnimatePresence custom={direction} initial={false} mode="popLayout">
              <motion.span
                className="inline-block"
                key={digit}
                custom={direction}
                variants={digitVariants}
                initial="enter"
                animate="rest"
                exit="exit"
                transition={reduced ? { duration: 0.12 } : digitSpring}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
    </span>
  );
}
