import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const deployments = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../src/contracts/deployments.json"), "utf8"));
  const factory = await hre.ethers.getContractAt("RotaFiFactory", deployments.RotaFiFactory);
  
  const circle0 = await factory.allCircles(0);
  const circle1 = await factory.allCircles(1);
  
  console.log("Circle 0:", circle0);
  console.log("Circle 1:", circle1);
}

main().catch(console.error);
