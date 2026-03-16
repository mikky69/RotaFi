import { network } from "hardhat";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Connect to the network
const { ethers } = await network.connect();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`\n🚀 RotaFi Deployment`);
  console.log(`   Network  : ${networkName}`);
  console.log(`   Deployer : ${deployer.address}`);
  console.log(`   Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} native\n`);

  // ── 1. Deploy PolUSDC ────────────────────────────────────────────────────
  console.log("📦 Deploying PolUSDC...");
  const PolUSDC = await ethers.getContractFactory("PolUSDC");
  const polUsdc = await PolUSDC.deploy(deployer.address);
  await polUsdc.waitForDeployment();
  const usdcAddress = await polUsdc.getAddress();
  console.log(`   PolUSDC deployed → ${usdcAddress}`);

  // ── 2. Deploy RotaFiFactory ──────────────────────────────────────────────
  console.log("📦 Deploying RotaFiFactory...");
  const RotaFiFactory = await ethers.getContractFactory("RotaFiFactory");
  const factory = await RotaFiFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`   RotaFiFactory deployed → ${factoryAddress}`);

  // ── 3. Save deployment addresses ─────────────────────────────────────────
  const deployments = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    PolUSDC: usdcAddress,
    RotaFiFactory: factoryAddress,
  };

  const outPath = resolve(__dirname, "../deployments.json");
  writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log(`\n✅ Deployment complete. Addresses saved to deployments.json`);
  console.log(`\n📋 Add these to your .env file:`);
  console.log(`   VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`   VITE_CIRCLE_FACTORY_ADDRESS=${factoryAddress}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
