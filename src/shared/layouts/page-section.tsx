import * as React from "react";
import { cn } from "@/lib/utils";

export function PageSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col px-6 py-12",
        className,
      )}
    >
      <div className="mb-8 max-w-3xl">
        {eyebrow ? (
          <p className="text-muted-foreground mb-2 text-sm font-medium tracking-normal uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-foreground text-3xl font-semibold tracking-normal sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-3 text-base leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
