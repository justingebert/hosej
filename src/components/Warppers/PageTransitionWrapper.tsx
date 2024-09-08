"use client"; // This makes the component client-side

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransitionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current path
  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    // Ensuring the component only renders on the client
    setShowChild(true);
  }, []);

  if (!showChild) return null; // Avoid rendering on the server

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname} // Unique key per page
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
