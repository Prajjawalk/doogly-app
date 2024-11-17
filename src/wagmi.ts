import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { fallback, http, unstable_connector } from "wagmi";
import { arbitrum, base, celo, optimism, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const config = getDefaultConfig({
  appName: "Doogly App",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
  chains: [
    optimism,
    base,
    celo,
    arbitrum,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [sepolia] : []),
  ],
  transports: {
    [optimism.id]: fallback([
      unstable_connector(injected),
      unstable_connector(walletConnect),
      http(),
    ]),
    [arbitrum.id]: fallback([
      unstable_connector(injected),
      unstable_connector(walletConnect),
      http(),
    ]),
    [celo.id]: fallback([
      unstable_connector(injected),
      unstable_connector(walletConnect),
      http(),
    ]),
    [base.id]: fallback([
      unstable_connector(injected),
      unstable_connector(walletConnect),
      http(),
    ]),
  },
});
