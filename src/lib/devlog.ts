export const devlogAddress = "0xbc6BBA2bAdF319788073B8CA42d7c169178ed952" as const;

export const devlogAbi = [
  {
    type: "function",
    name: "registerMyContract",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }, { name: "contractAddress", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "ping",
    stateMutability: "nonpayable",
    inputs: [{ name: "contractUsed", type: "address" }, { name: "kind", type: "uint8" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getMyContracts",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "addrs", type: "address[]" },
      { name: "labels", type: "string[]" },
    ],
  },
  {
    type: "event",
    name: "ContractRegistered",
    inputs: [
      { name: "dev", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "contractAddress", type: "address", indexed: true },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DevPing",
    inputs: [
      { name: "dev", type: "address", indexed: true },
      { name: "contractUsed", type: "address", indexed: true },
      { name: "kind", type: "uint8", indexed: false },
    ],
    anonymous: false,
  },
] as const;
