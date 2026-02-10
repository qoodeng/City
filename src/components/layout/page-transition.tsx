"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext, useState } from "react";

// Fix for Next.js 13+ AnimatePresence issue: https://github.com/framer/motion/issues/1850#issuecomment-1973602283
function FrozenRouter(props: { children: React.ReactNode }) {
    const context = useContext(LayoutRouterContext ?? {});
    // Capture context on first render, never update — so exit animations use the old route context
    const [frozen] = useState(context);

    return (
        <LayoutRouterContext.Provider value={frozen}>
            {props.children}
        </LayoutRouterContext.Provider>
    );
}

/**
 * Derive a route "type" so same-type navigations (e.g. issue A → issue B)
 * keep the component mounted and only transition the inner content.
 */
function getRouteType(pathname: string): string {
    if (pathname === "/") return "dashboard";
    if (pathname === "/issues") return "issues";
    if (/^\/issues\/[^/]+$/.test(pathname)) return "issue-detail";
    if (pathname === "/projects") return "projects";
    if (/^\/projects\/[^/]+\/settings$/.test(pathname))
        return "project-settings";
    if (/^\/projects\/[^/]+$/.test(pathname)) return "project-detail";
    return pathname;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const routeType = getRouteType(pathname);

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={routeType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 0.12,
                    ease: "easeOut",
                }}
                className="h-full w-full"
            >
                <FrozenRouter>{children}</FrozenRouter>
            </motion.div>
        </AnimatePresence>
    );
}
