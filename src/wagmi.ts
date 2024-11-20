import { fallback, http, unstable_connector } from "wagmi";
import { arbitrum, base, celo, optimism, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig } from "wagmi";
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

coinbaseWallet.preference = "all";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet],
    },
    {
      groupName: "Popular",
      wallets: [rainbowWallet, coinbaseWallet],
    },
    {
      groupName: "Wallet Connect",
      wallets: [walletConnectWallet],
    },
  ],
  {
    appName: "Your App Name",
    projectId: "<YOUR WALLETCONNECT PROJECT ID>",
  }
);

export const config = createConfig({
  connectors,
  chains: [optimism, base, celo, arbitrum],
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
