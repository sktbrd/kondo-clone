import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
  if (!alchemyKey) {
    return NextResponse.json({
      tokens: [], filteredTokens: [], totalCount: 0,
      success: false, swappedAmount: 0, streak: 0, tx: [], oldSum: 0,
      error: "Missing NEXT_PUBLIC_ALCHEMY_KEY environment variable",
    });
  }

  try {
    const response = await fetch(
      `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "alchemy_getTokenBalances",
          params: [address, "DEFAULT_TOKENS"],
        }),
      }
    );
    const data = await response.json();
    const rawBalances = data.result?.tokenBalances || [];

    const tokensWithMeta = await Promise.allSettled(
      rawBalances
        .filter((t: { tokenBalance: string }) => t.tokenBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000")
        .slice(0, 50)
        .map(async (token: { contractAddress: string; tokenBalance: string }) => {
          const metaResp = await fetch(
            `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0", id: 1,
                method: "alchemy_getTokenMetadata",
                params: [token.contractAddress],
              }),
            }
          );
          const metaData = await metaResp.json();
          const meta = metaData.result;
          const decimals = meta?.decimals || 18;
          const balance = parseInt(token.tokenBalance, 16) / Math.pow(10, decimals);
          return {
            address: token.contractAddress,
            balance,
            chainId: 8453,
            chainName: "Base",
            decimals,
            logo: meta?.logo || null,
            symbol: meta?.symbol || "???",
            name: meta?.name || "Unknown",
            worth: "0",
            safe: balance > 0.001,
          };
        })
    );

    const tokens = tokensWithMeta
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    return NextResponse.json({
      tokens, filteredTokens: [], totalCount: tokens.length,
      success: true, swappedAmount: 0, streak: 0, tx: [], oldSum: 0,
    });
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json({
      tokens: [], filteredTokens: [], totalCount: 0,
      success: false, swappedAmount: 0, streak: 0, tx: [], oldSum: 0,
    });
  }
}
