import React from "react";

import { cn } from "@/lib/utils";

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
}

const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626", // Default color
}) => {
  const mouseX = React.useRef<number>(0);
  const mouseY = React.useRef<number>(0);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.current = event.clientX - rect.left;
      mouseY.current = event.clientY - rect.top;

      cardRef.current.style.setProperty("--mouse-x", `${mouseX.current}px`);
      cardRef.current.style.setProperty("--mouse-y", `${mouseY.current}px`);
    }
  };

  React.useEffect(() => {
    const card = cardRef.current;
    if (card) {
      card.addEventListener("mousemove", handleMouseMove as any);
      return () => {
        card.removeEventListener("mousemove", handleMouseMove as any);
      };
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-px",
        "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-radial",
        "before:content-[''] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        className,
      )}
      style={
        {
          "--gradient-size": `${gradientSize}px`,
          "--gradient-color": gradientColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export {
  MagicCard
}; 