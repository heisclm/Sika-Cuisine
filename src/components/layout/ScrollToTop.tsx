"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Ensures that every page transition starts cleanly from the very top (0, 0)
 * instead of retaining the previous page's scroll position.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Immediate scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
