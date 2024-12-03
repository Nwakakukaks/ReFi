import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster.tsx";
import AppRoutes from "./Routes";
import { WagmiConfig } from "wagmi";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { chains, demoAppInfo, wagmiConfig } from "./wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
  <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
      <RainbowKitProvider appInfo={demoAppInfo} chains={chains}>
          <AppRoutes />
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
);