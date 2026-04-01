import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { Navigation } from "./Navigation";

export function Layout({ children }: PropsWithChildren) {
  const [isNavVisible, setIsNavVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsNavVisible(window.scrollY > window.innerHeight * 0.78);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app-shell">
      <Navigation isVisible={isNavVisible} />
      {children}
    </div>
  );
}
