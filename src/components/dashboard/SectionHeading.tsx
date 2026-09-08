import { Reveal } from "../StoryMotion";
import { cn } from "../../lib/utils";
import { eyebrow, heading2 } from "./shared";

export function SectionHeading({
  number,
  eyebrow: label,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="mb-7 flex items-start gap-4 sm:mb-9.5 sm:gap-7">
        <span
          className="w-[43px] shrink-0 font-numeric text-[46px] leading-none tracking-[-0.03em] text-section-marker sm:w-16 sm:text-[66px]"
          aria-hidden="true"
        >
          {number}
        </span>
        <div>
          <p className={cn(eyebrow, "mt-0.5 mb-2.5 text-[9px] sm:mb-[13px] sm:text-[13px]")}>
            {label}
          </p>
          <h2 className={heading2}>{title}</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-[1.9] text-muted-foreground sm:text-[15px]">
            {children}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
