import { network } from "hardhat";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Connect to the network
const { ethers } = await network.connect();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helper ────────────────────────────────────────────────────────────────
const USDC_DECIMALS = 6n;
const toUSDC = (amount) => BigInt(amount) * 10n ** USDC_DECIMALS;

async function main() {
  // Load deployed addresses
  let deployments;
  try {
    deployments = JSON.parse(readFileSync(resolve(__dirname, "../deployments.json"), "utf8"));
  } catch {
    throw new Error("deployments.json not found. Run deploy.js first.");
  }

  const signers = await ethers.getSigners();
  const [deployer, alice, bob, carol] = signers;

  // Guard: need at least 4 accounts (Hardhat node provides 20)
  if (signers.length < 4) throw new Error("Need at least 4 signer accounts");

  console.log(`\n🌱 RotaFi Seed Script`);
  console.log(`   Network  : ${network.name}`);
  console.log(`   Deployer : ${deployer.address}`);
  console.log(`   Alice    : ${alice.address}`);
  console.log(`   Bob      : ${bob.address}`);
  console.log(`   Carol    : ${carol.address}\n`);

  const polUsdc = await ethers.getContractAt("PolUSDC", deployments.PolUSDC);
  const factory = await ethers.getContractAt("RotaFiFactory", deployments.RotaFiFactory);

  // ── 1. Fund test wallets with PolUSDC ────────────────────────────────────
  console.log("💰 Minting PolUSDC to test accounts...");
  const mintAmount = toUSDC(5000); // 5,000 USDC each
  for (const [name, signer] of [["Alice", alice], ["Bob", bob], ["Carol", carol]]) {
    await polUsdc.mint(signer.address, mintAmount);
    console.log(`   ✓ ${name} funded with 5,000 USDC`);
  }

  // ── 2. Create circle #1 — "Lagos Savers" (3 members, 50 USDC, weekly) ─
  console.log("\n⭕ Creating circle: Lagos Savers...");
  const depositAmount = toUSDC(50);
  const cycleSeconds = 604800n; // 1 week

  const tx1 = await factory.connect(deployer).createCircle(
    "Lagos Savers",
    3,                         // memberCap
    depositAmount,
    cycleSeconds,
    deployments.PolUSDC,
  );
  const receipt1 = await tx1.wait();
  const circleAddr1 = receipt1.logs
    .map(log => { try { return factory.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === "CircleDeployed")?.args?.circleAddress;

  console.log(`   ✓ Lagos Savers deployed → ${circleAddr1}`);

  const circle1 = await ethers.getContractAt("RotaFiCircle", circleAddr1);

  // Approve + join
  await polUsdc.connect(alice).approve(circleAddr1, toUSDC(500));
  await circle1.connect(alice).joinCircle();
  console.log("   ✓ Alice joined");

  await polUsdc.connect(bob).approve(circleAddr1, toUSDC(500));
  await circle1.connect(bob).joinCircle();
  console.log("   ✓ Bob joined — round 1 started!");
  await factory.connect(alice).recordJoin(circleAddr1);
  await factory.connect(bob).recordJoin(circleAddr1);

  // Deployer deposits for round 1
  await polUsdc.connect(deployer).approve(circleAddr1, toUSDC(500));
  await circle1.connect(deployer).deposit();
  console.log("   ✓ Deployer deposited round 1");

  await circle1.connect(alice).deposit();
  console.log("   ✓ Alice deposited round 1");

  await circle1.connect(bob).deposit();
  console.log("   ✓ Bob deposited round 1 — pot ready!");

  // ── 3. Create circle #2 — "Abuja Monthly" (5 members, 100 USDC, not yet full)
  console.log("\n⭕ Creating circle: Abuja Monthly...");
  const tx2 = await factory.connect(deployer).createCircle(
    "Abuja Monthly",
    5,
    toUSDC(100),
    2592000n, // 30 days
    deployments.PolUSDC,
  );
  const receipt2 = await tx2.wait();
  const circleAddr2 = receipt2.logs
    .map(log => { try { return factory.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === "CircleDeployed")?.args?.circleAddress;

  console.log(`   ✓ Abuja Monthly deployed → ${circleAddr2}`);

  const circle2 = await ethers.getContractAt("RotaFiCircle", circleAddr2);
  await polUsdc.connect(alice).approve(circleAddr2, toUSDC(1000));
  await circle2.connect(alice).joinCircle();
  await factory.connect(alice).recordJoin(circleAddr2);
  console.log("   ✓ Alice joined (3 spots still open)");

  console.log(`\n✅ Seed complete!\n`);
  console.log(`   Circle 1 "Lagos Savers"  → ${circleAddr1} (active, round 1 deposits in)`);
  console.log(`   Circle 2 "Abuja Monthly" → ${circleAddr2} (open, 3 spots left)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
