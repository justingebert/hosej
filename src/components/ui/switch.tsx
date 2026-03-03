"use client";

import * as React from "react";
import { Switch as SwitchPrimitives } from "radix-ui";
import { type AppHapticType, useAppHaptics } from "@/hooks/useAppHaptics";

import { cn } from "@/lib/utils/utils";

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    haptic?: AppHapticType;
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
    ({ className, haptic = "selection", onCheckedChange, ...props }, ref) => {
        const { play } = useAppHaptics();

        const handleCheckedChange = (checked: boolean) => {
            play(haptic);
            onCheckedChange?.(checked);
        };

        return (
            <SwitchPrimitives.Root
                className={cn(
                    "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
                    className
                )}
                onCheckedChange={handleCheckedChange}
                {...props}
                ref={ref}
            >
                <SwitchPrimitives.Thumb
                    className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                    )}
                />
            </SwitchPrimitives.Root>
        );
    }
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
