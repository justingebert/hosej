"use client";
import { motion } from "framer-motion";

export const HoseJLoader = () => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <motion.h1
                className="text-4xl font-bold text-center relative"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, var(--shine-color) 0%, var(--shine-highlight) 50%, var(--shine-color) 100%)",
                    backgroundSize: "200% 100%",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                }}
                animate={{
                    backgroundPosition: ["100% 0", "-100% 0"],
                }}
                transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
            >
                HoseJ
            </motion.h1>
        </div>
    );
};
