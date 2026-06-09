export interface Token {
  address: string;
  balance: number;
  chainId: number;
  chainName: string;
  decimals: number;
  logo: string | null;
  symbol: string;
  name: string;
  worth: string;
  safe: boolean;
}

export interface QuoteResponse {
  allowanceTarget: string;
  blockNumber: string;
  buyAmount: string;
  buyToken: string;
  sellAmount: string;
  sellToken: string;
  mode: string;
  liquidityAvailable: boolean;
  fees: {
    integratorFee: { amount: string; token: string; type: string } | null;
    zeroExFee: { amount: string; token: string; type: string } | null;
    gasFee: null;
  };
  issues: {
    allowance: { spender: string; token: string } | null;
    balance: { token: string; actual: string; expected: string } | null;
    simulationIncomplete: boolean;
  };
  route: {
    fills: Array<{ from: string; to: string; source: string; proportionBps: string }>;
    tokens: Array<{ address: string; symbol: string }>;
  };
  transaction: {
    to: string;
    data: string;
    gas: string;
    gasPrice: string;
    value: string;
  };
}

export interface WalletData {
  tokens: Token[];
  filteredTokens: Token[];
  totalCount: number;
  success: boolean;
  swappedAmount: number;
  streak: number;
  tx: string[];
  oldSum: number;
}

export interface SwapTarget {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
}
