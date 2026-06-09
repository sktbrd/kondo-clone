import { base } from "wagmi/chains";

export const CHAIN_ID = 8453; // Base mainnet
export const CHAIN = base;
export const APP_NAME = "Kondo Clone";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const ALLOWANCE_HOLDER = "0x0000000000001ff3684f28c67538d4d072c22734";
export const DEFAULT_SELECT_COUNT = 20;
export const FEE_BPS = 300; // 3% integrator fee
export const FEE_RECIPIENT = process.env.NEXT_PUBLIC_FEE_RECIPIENT || "0x0000000000000000000000000000000000000000";

export const DEFAULT_SWAP_TARGETS: Array<{address: string; symbol: string; name: string; decimals: number; logo: string}> = [
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "https://media.upon.ly/uponly/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png",
  },
  {
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logo: "https://media.upon.ly/uponly/tokens/base/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  },
  {
    address: "0x2b5050F01d64FBb3e4Ac44dc07f0732BFb5ecadF",
    symbol: "QR",
    name: "QR coin",
    decimals: 18,
    logo: "https://token-registry.s3.amazonaws.com/icons/tokens/base/128/0x2b5050f01d64fbb3e4ac44dc07f0732bfb5ecadf.png",
  },
  {
    address: "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
    symbol: "cbBTC",
    name: "Coinbase Wrapped BTC",
    decimals: 8,
    logo: "https://token-registry.s3.amazonaws.com/icons/tokens/base/128/0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf.png",
  },
];

export const ERC20_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
] as const;

export const ZORA_CURRENCY_ABI = [
  { name: "currency", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
] as const;
