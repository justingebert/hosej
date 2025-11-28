"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils/utils";

const ProgressY = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({className, value, ...props}, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative h-24 w-4 overflow-hidden rounded-full bg-secondary flex items-end", // Set height and adjust flex direction
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className="w-full bg-primary transition-all"
            style={{transform: `translateY(${100 - (value || 0)}%)`, height: "100%"}} // Adjust Y-axis translation
        />
    </ProgressPrimitive.Root>
));
ProgressY.displayName = ProgressPrimitive.Root.displayName;

export { ProgressY };
