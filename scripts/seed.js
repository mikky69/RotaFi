import { network } from "hardhat";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Connect to the network
const { ethers } = await network.connect();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helper ────────────────────────────────────────────────────────────────
const USDC_DECIMALS = 6n;
const DOT_DECIMALS  = 10n;
const toUSDC = (amount) => BigInt(amount) * 10n ** USDC_DECIMALS;
const toDOT  = (amount) => BigInt(amount) * 10n ** DOT_DECIMALS;

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
  const polDot  = await ethers.getContractAt("PolDOT", deployments.PolDOT);
  const factory = await ethers.getContractAt("RotaFiFactory", deployments.RotaFiFactory);

  // ── 1. Fund test wallets with PolUSDC ────────────────────────────────────
  const mintAmountUSDC = toUSDC(5000); // 5,000 USDC each
  const mintAmountDOT  = toDOT(100);   // 100 DOT each
  for (const [name, signer] of [["Alice", alice], ["Bob", bob], ["Carol", carol], ["Deployer", deployer]]) {
    await polUsdc.connect(deployer).mint(signer.address, mintAmountUSDC);
    await polDot.connect(deployer).mint(signer.address, mintAmountDOT);
    console.log(`   ✓ ${name} funded with 5,000 USDC and 100 DOT`);
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
  console.log("   ✓ Bob deposited round 1 — AUTOMATIC PAYOUT TRIGGERED! 🚀");

  // ── 4. Create circle #3 — "Paseo DOT" (3 members, 10 DOT, weekly) ────────
  console.log("\n⭕ Creating circle: Paseo DOT...");
  const tx3 = await factory.connect(deployer).createCircle(
    "Paseo DOT",
    3,
    toDOT(10),
    604800n,
    deployments.PolDOT,
  );
  const receipt3 = await tx3.wait();
  const circleAddr3 = receipt3.logs
    .map(log => { try { return factory.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === "CircleDeployed")?.args?.circleAddress;

  console.log(`   ✓ Paseo DOT deployed → ${circleAddr3}`);

  console.log(`\n✅ Seed complete!\n`);
  console.log(`   Circle 1 "Lagos Savers"  → ${circleAddr1} (active, round 2 started)`);
  console.log(`   Circle 3 "Paseo DOT"     → ${circleAddr3} (open, 2 spots left)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
