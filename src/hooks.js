import { useState, useEffect } from "react";

// True below the given viewport width; drives phone-friendly layouts (inline
// styles everywhere, so no CSS media queries to lean on).
function useIsNarrow(bp = 640) {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth <= bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [bp]);
  return narrow;
}

export { useIsNarrow };
