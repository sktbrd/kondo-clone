import { NextRequest, NextResponse } from "next/server";

const ZEROX_API_KEY = process.env.ZEROX_API_KEY || "";
const FEE_RECIPIENT = process.env.NEXT_PUBLIC_FEE_RECIPIENT || "";
const ZEROX_BASE_URL = "https://api.0x.org/swap/permit2/quote";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const buyToken = searchParams.get("buyToken");
  const sellToken = searchParams.get("sellToken");
  const taker = searchParams.get("taker");
  const sellAmount = searchParams.get("sellAmount");
  const swapFeeToken = searchParams.get("swapFeeToken") || buyToken;

  if (!buyToken || !sellToken || !taker) {
    return NextResponse.json(
      {
        name: "INPUT_INVALID",
        message: "The input is invalid",
        data: {
          details: [
            !buyToken && { field: "buyToken", reason: "Required" },
            !sellToken && { field: "sellToken", reason: "Required" },
            !taker && { field: "taker", reason: "Required" },
          ].filter(Boolean),
        },
      },
      { status: 200 }
    );
  }

  if (!ZEROX_API_KEY) {
    return NextResponse.json(
      { error: "Missing ZEROX_API_KEY. Add it to your .env file." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    chainId: "8453",
    buyToken,
    sellToken,
    taker,
    ...(sellAmount && { sellAmount }),
    ...(swapFeeToken && FEE_RECIPIENT && {
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: "300",
      swapFeeToken,
    }),
  });

  try {
    const response = await fetch(`${ZEROX_BASE_URL}?${params}`, {
      headers: {
        "0x-api-key": ZEROX_API_KEY,
        "0x-version": "v2",
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("0x API error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
