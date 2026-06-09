"use client";
import { useState, useCallback } from "react";
import { useAccount, useReadContract, useSendCalls } from "wagmi";
import { encodeFunctionData, maxUint256, parseUnits } from "viem";
import useSWR from "swr";
import { base } from "wagmi/chains";
import { ERC20_ABI, ALLOWANCE_HOLDER, DEFAULT_SWAP_TARGETS, FEE_BPS } from "@/lib/constants";
import type { Token, WalletData, SwapTarget, QuoteResponse } from "@/types";
import { TokenList } from "./TokenList";
import { SwapTargetPicker } from "./SwapTargetPicker";
import { SettingsPanel } from "./SettingsPanel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SwapInterfaceProps {
  address: string;
}

interface SwapCall {
  token: Token;
  quote: { data: string; to: string; value: bigint; buyAmount: string } | null;
  send: boolean;
  txFailed: boolean;
}

export function SwapInterface({ address }: SwapInterfaceProps) {
  const { connector } = useAccount();
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [targetToken, setTargetToken] = useState<SwapTarget>(DEFAULT_SWAP_TARGETS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [defaultSelectCount, setDefaultSelectCount] = useState(20);
  const [hideZora, setHideZora] = useState(false);
  const [hideClanker, setHideClanker] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<"idle" | "quoting" | "approving" | "swapping" | "done" | "error">("idle");
  const [completedSwaps, setCompletedSwaps] = useState<string[]>([]);

  const { data: walletData, mutate: refetch } = useSWR<WalletData>(
    address ? `/api/web/wallet/${address}` : null,
    fetcher,
    {
      fallbackData: {
        tokens: [], filteredTokens: [], totalCount: 0,
        success: false, swappedAmount: 0, streak: 0, tx: [], oldSum: 0,
      },
      revalidateOnFocus: false,
    }
  );

  const { sendCalls, isPending: isSendingCalls } = useSendCalls();

  const tokens = walletData?.tokens || [];
  const filteredTokens = tokens.filter((t) => {
    if (hideZora && t.name?.toLowerCase().includes("zora")) return false;
    if (hideClanker && t.name?.toLowerCase().includes("clanker")) return false;
    return true;
  });

  const toggleToken = useCallback((address: string) => {
    setSelectedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  }, []);

  const selectTop = useCallback(
    (count: number) => {
      const sorted = [...filteredTokens]
        .sort((a, b) => parseFloat(b.worth) - parseFloat(a.worth))
        .slice(0, count)
        .map((t) => t.address);
      setSelectedTokens(new Set(sorted));
    },
    [filteredTokens]
  );

  const clearSelection = useCallback(() => setSelectedTokens(new Set()), []);

  const handleSwap = useCallback(async () => {
    if (!address || selectedTokens.size === 0) return;
    setIsSwapping(true);
    setSwapStatus("quoting");

    try {
      // 1. Fetch quotes for all selected tokens
      const selectedList = filteredTokens.filter((t) => selectedTokens.has(t.address));

      const quoteResults = await Promise.allSettled(
        selectedList.map(async (token): Promise<SwapCall> => {
          try {
            const sellAmount = parseUnits(
              token.balance.toString(),
              token.decimals
            ).toString();

            const params = new URLSearchParams({
              sellToken: token.address,
              buyToken: targetToken.address,
              taker: address,
              sellAmount,
              swapFeeToken: targetToken.address,
            });

            const res = await fetch(`/api/web/wallet/quote?${params}`);
            const q: QuoteResponse = await res.json();

            if (!q.liquidityAvailable || q.issues?.balance) {
              return { token, quote: null, send: false, txFailed: false };
            }

            return {
              token,
              quote: {
                data: q.transaction.data,
                to: q.transaction.to,
                value: BigInt(q.transaction.value || "0"),
                buyAmount: q.buyAmount,
              },
              send: true,
              txFailed: false,
            };
          } catch {
            return { token, quote: null, send: false, txFailed: true };
          }
        })
      );

      const swapCalls = quoteResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<SwapCall>).value)
        .filter((r) => r.send && r.quote);

      if (swapCalls.length === 0) {
        setSwapStatus("error");
        return;
      }

      setSwapStatus("approving");

      // 2. Build approval calls for tokens that need it
      const approvalCalls = swapCalls.map((sc) => ({
        to: sc.token.address as `0x${string}`,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ALLOWANCE_HOLDER as `0x${string}`, maxUint256],
        }),
        value: 0n,
      }));

      // 3. Build swap calls
      const txCalls = swapCalls.map((sc) => ({
        to: sc.quote!.to as `0x${string}`,
        data: sc.quote!.data as `0x${string}`,
        value: sc.quote!.value,
      }));

      setSwapStatus("swapping");

      // 4. Send batch via EIP-5792
      sendCalls(
        {
          account: address as `0x${string}`,
          chainId: base.id,
          calls: [...approvalCalls, ...txCalls],
        },
        {
          onSuccess: (result) => {
            console.log("Batch swap success:", result);
            setCompletedSwaps((prev) => [...prev, ...swapCalls.map((s) => s.token.symbol)]);
            setSelectedTokens(new Set());
            setSwapStatus("done");
            refetch();
          },
          onError: (error) => {
            console.error("Batch swap error:", error);
            setSwapStatus("error");
          },
          onSettled: () => {
            setIsSwapping(false);
          },
        }
      );
    } catch (error) {
      console.error("Swap error:", error);
      setSwapStatus("error");
      setIsSwapping(false);
    }
  }, [address, selectedTokens, filteredTokens, targetToken, sendCalls, refetch]);

  const canSwap = selectedTokens.size > 0 && !isSwapping && !isSendingCalls;
  const isFarcasterWallet = connector?.id === "farcaster";

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center justify-center gap-2 px-4 py-4 shrink-0"
        style={{ background: "#5C36D6" }}
      >
        <span className="text-white font-semibold text-lg">Batch swap tokens to</span>
        <SwapTargetPicker
          selected={targetToken}
          options={DEFAULT_SWAP_TARGETS}
          onSelect={setTargetToken}
        />
      </header>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <span className="text-sm text-white/60">{selectedTokens.size} selected</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-white/60 hover:text-white transition-colors"
          >
            ⚙️
          </button>
          <button
            onClick={() => selectTop(defaultSelectCount)}
            className="text-sm text-[#5C36D6] hover:underline"
          >
            Select {defaultSelectCount}
          </button>
          <button
            onClick={clearSelection}
            className="text-sm text-white/60 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          defaultSelectCount={defaultSelectCount}
          onDefaultSelectChange={setDefaultSelectCount}
          hideZora={hideZora}
          onHideZoraChange={setHideZora}
          hideClanker={hideClanker}
          onHideClankerChange={setHideClanker}
        />
      )}

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        <TokenList
          tokens={filteredTokens}
          selectedTokens={selectedTokens}
          onToggle={toggleToken}
          isLoading={!walletData?.success}
        />
      </div>

      {/* Swap button */}
      <div className="px-4 py-4 shrink-0">
        <button
          onClick={handleSwap}
          disabled={!canSwap}
          className={`w-full py-5 rounded-2xl text-xl font-semibold text-white transition-all duration-200 ${
            canSwap
              ? "bg-[#5C36D6] active:scale-95"
              : "bg-[#5C36D6]/40 cursor-not-allowed"
          }`}
        >
          {isSwapping
            ? swapStatus === "quoting"
              ? "Quoting batch swap..."
              : swapStatus === "approving"
              ? "Approving batch swap..."
              : swapStatus === "swapping"
              ? "Processing batch swap..."
              : "Processing..."
            : selectedTokens.size > 0
            ? `Swap ${selectedTokens.size} token${selectedTokens.size !== 1 ? "s" : ""}`
            : "Select tokens to swap"}
        </button>
      </div>
    </div>
  );
}
