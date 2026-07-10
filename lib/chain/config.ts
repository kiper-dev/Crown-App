import { sepolia } from "viem/chains";

// The network the chain mode currently runs on (testnet).
export const ACTIVE_CHAIN = sepolia;

// ──────────────────────────────────────────────────────────────────
// Contract addresses. Supplied by the backend dev after the testnet deploy.
// While the splitter isn't deployed — leave the zero address: the front end
// detects this and shows an honest message instead of firing a transaction into the void.
// (See Crown-App/docs/front.md — build plan F3: "testnet addresses from the backend".)
// ──────────────────────────────────────────────────────────────────
export const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const ADDRESSES = {
  // Splitter 97/3 from Crown-Core.
  splitter: ZERO as `0x${string}`,
  // USDC on testnet (Sepolia). Circle's known test USDC:
  usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
};

export function isSplitterConfigured() {
  return ADDRESSES.splitter !== ZERO;
}

// ABI of exactly the functions the front end calls (from contracts/evm/src/Splitter.sol).
export const SPLITTER_ABI = [
  {
    type: "function",
    name: "donate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "streamer", type: "address" },
      { name: "gross", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;
