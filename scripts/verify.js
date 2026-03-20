import hre from "hardhat";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const { run, network } = hre;
  const deploymentsFile = resolve(__dirname, "../src/contracts/deployments.json");
  const deployments = JSON.parse(readFileSync(deploymentsFile, "utf8"));
  const deployer = deployments.deployer;

  console.log(`🔍 Starting contract verification on network: ${network.name}`);
  console.log(`📍 Deployer (Initial Owner): ${deployer}`);

  const contracts = [
    { name: "PolUSDC", address: deployments.PolUSDC, args: [deployer] },
    { name: "PolDOT", address: deployments.PolDOT, args: [deployer] },
    { name: "RotaFiFactory", address: deployments.RotaFiFactory, args: [deployer] }
  ];

  for (const contract of contracts) {
    try {
      console.log(`\n📡 Verifying ${contract.name} at ${contract.address}...`);
      await run("verify:verify", {
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

  console.log("\n✅ Verification process finished.");
}

main().catch(console.error);
