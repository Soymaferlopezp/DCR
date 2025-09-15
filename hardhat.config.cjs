require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || "";
const SOMNIA_CHAIN_ID = Number(process.env.SOMNIA_CHAIN_ID || 0);
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.24",
  networks: {
    somnia: {
      // NOTA: en Hardhat v2 NO se usa "type: 'http'"
      url: SOMNIA_RPC_URL,
      chainId: SOMNIA_CHAIN_ID,
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : []
    }
  }
};
