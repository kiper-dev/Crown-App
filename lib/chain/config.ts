import { sepolia } from "viem/chains";

// Сеть, в которой сейчас работает режим chain (тестнет).
export const ACTIVE_CHAIN = sepolia;

// ──────────────────────────────────────────────────────────────────
// Адреса контрактов. Их даёт бэкендер после деплоя в тестнет.
// Пока сплиттер не задеплоен — оставить нулевой адрес: фронт это увидит
// и покажет честное сообщение вместо попытки отправить транзакцию в пустоту.
// (См. Crown-App/docs/front.md — план сборки F3: «адреса тестнета от бэка».)
// ──────────────────────────────────────────────────────────────────
export const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const ADDRESSES = {
  // Splitter 97/3 из Crown-Core.
  splitter: ZERO as `0x${string}`,
  // USDC в тестнете (Sepolia). Известный тестовый USDC от Circle:
  usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
};

export function isSplitterConfigured() {
  return ADDRESSES.splitter !== ZERO;
}

// ABI ровно тех функций, которые зовёт фронт (из contracts/evm/src/Splitter.sol).
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
