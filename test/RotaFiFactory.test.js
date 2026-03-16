import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

const USDC = (n) => BigInt(n) * 1_000_000n;
const WEEK = 7 * 24 * 60 * 60;

describe("RotaFiFactory", () => {
  async function deployAll() {
    const [owner, alice, bob, carol] = await ethers.getSigners();

    const PolUSDC = await ethers.getContractFactory("PolUSDC");
    const usdc = await PolUSDC.deploy(owner.address);
    for (const s of [owner, alice, bob, carol]) {
      await usdc.mint(s.address, USDC(10_000));
    }

    const RotaFiFactory = await ethers.getContractFactory("RotaFiFactory");
    const factory = await RotaFiFactory.deploy(owner.address);

    return { usdc, factory, owner, alice, bob, carol };
  }

  async function createAndGetCircle(factory, usdc, signer) {
    const tx = await factory.connect(signer).createCircle(
      "Factory Test Circle", 3, USDC(50), WEEK, await usdc.getAddress(),
    );
    const receipt = await tx.wait();
    const event = receipt.logs
      .map(log => { try { return factory.interface.parseLog(log); } catch { return null; } })
      .find(e => e?.name === "CircleDeployed");
    return event.args.circleAddress;
  }

  describe("createCircle", () => {
    it("deploys a new RotaFiCircle and emits CircleDeployed", async () => {
      const { usdc, factory, owner } = await networkHelpers.loadFixture(deployAll);
      await expect(
        factory.connect(owner).createCircle("My Circle", 3, USDC(50), WEEK, await usdc.getAddress())
      ).to.emit(factory, "CircleDeployed");
    });

    it("registers circle in allCircles", async () => {
      const { usdc, factory, owner } = await networkHelpers.loadFixture(deployAll);
      expect(await factory.totalCircles()).to.equal(0n);
      const addr = await createAndGetCircle(factory, usdc, owner);
      expect(await factory.totalCircles()).to.equal(1n);
      expect((await factory.getAllCircles())[0]).to.equal(addr);
    });
  });

  describe("getOpenCircles", () => {
    it("returns circles with open spots", async () => {
      const { usdc, factory, owner, alice } = await networkHelpers.loadFixture(deployAll);
      const addr1 = await createAndGetCircle(factory, usdc, owner);
      const addr2 = await createAndGetCircle(factory, usdc, alice);
      const open = await factory.getOpenCircles();
      expect(open.length).to.equal(2);
      expect(open.map(c => c.circleAddress)).to.include(addr1);
      expect(open.map(c => c.circleAddress)).to.include(addr2);
    });

    it("excludes circles that are full", async () => {
      const { usdc, factory, owner, alice, bob } = await networkHelpers.loadFixture(deployAll);
      const addr = await createAndGetCircle(factory, usdc, owner);
      const circle = await ethers.getContractAt("RotaFiCircle", addr);
      await circle.connect(alice).joinCircle();
      await circle.connect(bob).joinCircle();
      const open = await factory.getOpenCircles();
      expect(open.map(c => c.circleAddress)).to.not.include(addr);
    });
  });

  describe("recordJoin", () => {
    it("adds circle to member registry", async () => {
      const { usdc, factory, owner, alice } = await networkHelpers.loadFixture(deployAll);
      const addr = await createAndGetCircle(factory, usdc, owner);
      const circle = await ethers.getContractAt("RotaFiCircle", addr);
      await circle.connect(alice).joinCircle();
      await factory.connect(alice).recordJoin(addr);
      expect(await factory.getCirclesByMember(alice.address)).to.include(addr);
    });

    it("reverts NotACircle for unknown address", async () => {
      const { factory, alice } = await networkHelpers.loadFixture(deployAll);
      await expect(factory.connect(alice).recordJoin(alice.address))
        .to.be.revertedWithCustomError(factory, "NotACircle");
    });
  });
});
