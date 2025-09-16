export const devlogAddress =
  (process.env.NEXT_PUBLIC_DEVLOG_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const devlogAbi = [
  // events
  {
    type: "event",
    name: "ContractRegistered",
    inputs: [
      { name: "dev", type: "address", indexed: true },
      { name: "contractAddress", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DevPing",
    inputs: [
      { name: "dev", type: "address", indexed: true },
      { name: "contractUsed", type: "address", indexed: true },
      { name: "kind", type: "uint8", indexed: false } // 0 owner, 1 public
    ],
    anonymous: false
  },
  // functions
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "registerMyContract",
    inputs: [
      { name: "name", type: "string" },
      { name: "contractAddress", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "ping",
    inputs: [
      { name: "contractUsed", type: "address" },
      { name: "kind", type: "uint8" } // aceptará number o bigint: usa 0n en el frontend
    ],
    outputs: []
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getMyContracts",
    inputs: [],
    outputs: [
      { name: "addrs", type: "address[]" },
      { name: "labels", type: "string[]" }
    ]
  }
] as const;
