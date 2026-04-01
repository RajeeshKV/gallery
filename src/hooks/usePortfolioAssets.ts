import { useEffect, useState } from "react";
import { fetchPortfolioAssets } from "../lib/api";
import type { PortfolioResponse } from "../types/portfolio";

type State = {
  data: PortfolioResponse | null;
  isLoading: boolean;
  error: string | null;
};

const REFRESH_INTERVAL_MS = 60_000;

export function usePortfolioAssets() {
  const [state, setState] = useState<State>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    let currentController: AbortController | null = null;

    const load = async () => {
      currentController?.abort();
      const controller = new AbortController();
      currentController = controller;

      try {
        const data = await fetchPortfolioAssets(controller.signal);
        if (!active) {
          return;
        }

        setState({
          data,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState((current) => ({
          data: current.data,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to reach the asset service.",
        }));
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      currentController?.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  return state;
}
