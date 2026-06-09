import { createConfig, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || "";

export const wagmiConfig = createConfig({
  chains: [base, mainnet],
  connectors: [
    coinbaseWallet({
      appName: "Kondo Clone",
      appLogoUrl: "/icon.png",
      preference: "smartWalletOnly",
    }),
    injected({ target: "metaMask" }),
    injected(),
  ],
  transports: {
    [base.id]: http(
      alchemyKey
        ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : "https://mainnet.base.org"
    ),
    [mainnet.id]: http(
      alchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : "https://eth.llamarpc.com"
    ),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
