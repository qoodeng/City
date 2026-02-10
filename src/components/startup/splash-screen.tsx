"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
    onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Sequence:
        // 1. Circle animation (0-1s) -> Removed
        // 2. Text reveal (0.5-1.5s) -> Now 0-1s
        // 3. Exit (1.5s)
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Show window controls (macOS)
            const win = window as unknown as { electron?: { send: (ch: string, v: boolean) => void } };
            if (typeof window !== "undefined" && win.electron) {
                win.electron.send("city:set-window-controls", true);
            }
            setTimeout(() => onComplete?.(), 500); // Wait for exit animation
        }, 1500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000] overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
                >
                    {/* Left Column of Test Logos */}
                    <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between py-4">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={`left-${i}`}
                                className="h-8 w-8 rounded-full bg-[#FFD700] overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-[#000000]" />
                                <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-[#000000]" />
                            </div>
                        ))}
                    </div>

                    {/* Right Column of Test Logos */}
                    <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-between py-4">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={`right-${i}`}
                                className="h-8 w-8 rounded-full bg-[#FFD700] overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-[#000000]" />
                                <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-[#000000]" />
                            </div>
                        ))}
                    </div>

                    <div className="relative flex flex-col items-center justify-center">
                        {/* IBM-style Striped Text */}
                        <div className="relative">
                            <motion.div
                                className="relative z-10 text-9xl font-black tracking-tighter text-transparent"
                                style={{
                                    backgroundImage: "repeating-linear-gradient(180deg, #FFD700, #FFD700 8px, #000000 8px, #000000 16px)",
                                    WebkitBackgroundClip: "text",
                                    backgroundClip: "text",
                                    fontFamily: "var(--font-geist-sans)", // Use Sans for heavier block letters
                                    lineHeight: 1,
                                }}
                                initial={{ backgroundPosition: "0% -100%" }}
                                animate={{ backgroundPosition: "0% 0%" }}
                                transition={{
                                    duration: 1.0,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                C.I.T.Y.
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
