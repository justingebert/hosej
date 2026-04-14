"use client";

export function StepIndicator({
    totalSteps,
    currentStep,
}: {
    totalSteps: number;
    currentStep: number;
}) {
    return (
        <div className="flex justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                        idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                />
            ))}
        </div>
    );
}
