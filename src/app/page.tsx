"use client";
import { useAccount } from "wagmi";
import { SwapInterface } from "@/components/SwapInterface";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useEffect, useState } from "react";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="flex flex-col min-h-screen bg-black text-white">
      {isConnected && address ? (
        <SwapInterface address={address} />
      ) : (
        <ConnectWallet />
      )}
    </main>
  );
}
