const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deployments = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../src/contracts/deployments.json"), "utf8"));
  const deployer = deployments.deployer;

  console.log("🔍 Starting contract verification on", hre.network.name);

  const contracts = [
    { name: "PolUSDC", address: deployments.PolUSDC, args: [deployer] },
    { name: "PolDOT", address: deployments.PolDOT, args: [deployer] },
    { name: "RotaFiFactory", address: deployments.RotaFiFactory, args: [deployer] }
  ];

  for (const contract of contracts) {
    try {
      console.log(`\n📡 Verifying ${contract.name} at ${contract.address}...`);
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.args,
      });
      console.log(`✅ ${contract.name} verified!`);
    } catch (e) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log(`✅ ${contract.name} is already verified.`);
      } else {
        console.error(`❌ ${contract.name} verification failed:`, e.message);
      }
    }
  }
}

main().catch(console.error);
