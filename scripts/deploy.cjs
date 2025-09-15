const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("SomniaDevLog");
  const contract = await Factory.deploy();

  await contract.waitForDeployment();
  console.log("SomniaDevLog deployed to:", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
