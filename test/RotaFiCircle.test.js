import { expect } from "chai";
import { network } from "hardhat";

// Connect to the local network to get ethers and networkHelpers
const { ethers, networkHelpers } = await network.connect();

// ── Helpers ───────────────────────────────────────────────────────────────
const USDC = (n) => BigInt(n) * 1_000_000n;
const WEEK = 7 * 24 * 60 * 60;

// ── Test Suite ────────────────────────────────────────────────────────────
describe("RotaFiCircle", () => {
  async function deployFixture() {
    const [owner, alice, bob, carol, dave, eve] = await ethers.getSigners();

    const PolUSDC = await ethers.getContractFactory("PolUSDC");
    const usdc = await PolUSDC.deploy(owner.address);

    for (const signer of [owner, alice, bob, carol, dave, eve]) {
      await usdc.mint(signer.address, USDC(10_000));
    }

    const RotaFiCircle = await ethers.getContractFactory("RotaFiCircle");

    // Helper to deploy a circle
    const deployCircle = async (memberCap = 3, depositAmount = USDC(50), cycleSeconds = WEEK) => {
      const circle = await RotaFiCircle.deploy(
        "Test Circle",
        memberCap,
        depositAmount,
        cycleSeconds,
        await usdc.getAddress(),
        owner.address
      );
      await usdc.connect(owner).approve(await circle.getAddress(), USDC(100_000));
      return circle;
    };

    return { usdc, owner, alice, bob, carol, dave, eve, deployCircle };
  }

  // ── Constructor & Initial State ─────────────────────────────────────────
  describe("constructor", () => {
    it("sets correct initial state", async () => {
      const { owner, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      const info = await circle.getInfo();

      expect(info.name).to.equal("Test Circle");
      expect(info.admin).to.equal(owner.address);
      expect(info.memberCap).to.equal(3n);
      expect(info.memberCount).to.equal(1n);
      expect(info.depositAmount).to.equal(USDC(50));
      expect(info.currentRound).to.equal(0n);
      expect(info.isActive).to.be.true;
    });

    it("registers owner as member #1 at position 1", async () => {
      const { owner, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      const members = await circle.getMembers();
      expect(members[0]).to.equal(owner.address);
      expect(await circle.getMemberPosition(owner.address)).to.equal(1n);
    });

    it("reverts with InvalidParams on bad memberCap", async () => {
      const { usdc, owner } = await networkHelpers.loadFixture(deployFixture);
      const RotaFiCircle = await ethers.getContractFactory("RotaFiCircle");
      await expect(
        RotaFiCircle.deploy("Bad", 2, USDC(50), WEEK, await usdc.getAddress(), owner.address)
      ).to.be.revertedWithCustomError(RotaFiCircle, "InvalidParams");
    });
  });

  // ── joinCircle ──────────────────────────────────────────────────────────
  describe("joinCircle", () => {
    it("allows members to join and updates memberCount", async () => {
      const { alice, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      await circle.connect(alice).joinCircle();
      expect((await circle.getInfo()).memberCount).to.equal(2n);
    });

    it("starts round 1 when last seat is filled", async () => {
      const { alice, bob, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      await circle.connect(alice).joinCircle();
      expect((await circle.getInfo()).currentRound).to.equal(0n);

      await circle.connect(bob).joinCircle();
      const info = await circle.getInfo();
      expect(info.currentRound).to.equal(1n);
      expect(info.roundStartedAt).to.be.greaterThan(0n);
    });

    it("reverts AlreadyMember on duplicate join", async () => {
      const { alice, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      await circle.connect(alice).joinCircle();
      await expect(circle.connect(alice).joinCircle())
        .to.be.revertedWithCustomError(circle, "AlreadyMember");
    });

    it("reverts CircleFull when at capacity", async () => {
      const { alice, bob, carol, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      await circle.connect(alice).joinCircle();
      await circle.connect(bob).joinCircle();
      await expect(circle.connect(carol).joinCircle())
        .to.be.revertedWithCustomError(circle, "CircleFull");
    });
  });

  // ── deposit ─────────────────────────────────────────────────────────────
  describe("deposit", () => {
    async function setupActiveCircle() {
      const fixture = await deployFixture();
      const { usdc, alice, bob, deployCircle } = fixture;
      const circle = await deployCircle();
      const addr = await circle.getAddress();
      await usdc.connect(alice).approve(addr, USDC(100_000));
      await usdc.connect(bob).approve(addr, USDC(100_000));
      await circle.connect(alice).joinCircle();
      await circle.connect(bob).joinCircle();
      return { ...fixture, circle };
    }

    it("accepts deposit and marks hasDeposited true", async () => {
      const { owner, circle, alice } = await networkHelpers.loadFixture(setupActiveCircle);
      await circle.connect(owner).deposit();
      expect(await circle.hasDeposited(owner.address)).to.be.true;
      expect(await circle.hasDeposited(alice.address)).to.be.false;
    });

    it("pulls exact depositAmount from sender", async () => {
      const { usdc, owner, circle } = await networkHelpers.loadFixture(setupActiveCircle);
      const addr = await circle.getAddress();
      const before = await usdc.balanceOf(owner.address);
      await circle.connect(owner).deposit();
      expect(before - (await usdc.balanceOf(owner.address))).to.equal(USDC(50));
      expect(await usdc.balanceOf(addr)).to.equal(USDC(50));
    });

    it("clears penalty flag when member deposits late", async () => {
      const { usdc, owner, circle } = await networkHelpers.loadFixture(setupActiveCircle);

      await networkHelpers.time.increase(WEEK + 1);
      await circle.flagLateMembers();
      expect(await circle.isPenalized(owner.address)).to.be.true;

      await usdc.connect(owner).approve(await circle.getAddress(), USDC(100_000));
      await circle.connect(owner).deposit();
      expect(await circle.isPenalized(owner.address)).to.be.false;
    });
  });

  // ── triggerPayout ────────────────────────────────────────────────────────
  describe("triggerPayout", () => {
    async function setupFullDeposits() {
      const fixture = await deployFixture();
      const { usdc, owner, alice, bob, deployCircle } = fixture;
      const circle = await deployCircle();
      const addr = await circle.getAddress();
      await usdc.connect(alice).approve(addr, USDC(100_000));
      await usdc.connect(bob).approve(addr, USDC(100_000));
      await circle.connect(alice).joinCircle();
      await circle.connect(bob).joinCircle();
      await circle.connect(owner).deposit();
      await circle.connect(alice).deposit();
      await circle.connect(bob).deposit();
      return { ...fixture, circle };
    }

    it("pays full pot (3 × 50 USDC) to round 1 recipient (owner)", async () => {
      const { usdc, owner, circle } = await networkHelpers.loadFixture(setupFullDeposits);
      const before = await usdc.balanceOf(owner.address);
      await circle.connect(owner).triggerPayout();
      expect((await usdc.balanceOf(owner.address)) - before).to.equal(USDC(150));
    });

    it("advances currentRound after payout", async () => {
      const { circle, owner } = await networkHelpers.loadFixture(setupFullDeposits);
      await circle.connect(owner).triggerPayout();
      expect((await circle.getInfo()).currentRound).to.equal(2n);
    });

    it("marks circle inactive after final round", async () => {
      const { usdc, owner, alice, bob } = await networkHelpers.loadFixture(deployFixture);
      const RotaFiCircle = await ethers.getContractFactory("RotaFiCircle");
      const circle = await RotaFiCircle.deploy(
        "Mini", 3, USDC(50), WEEK, await usdc.getAddress(), owner.address
      );
      const addr = await circle.getAddress();
      await usdc.connect(owner).approve(addr, USDC(100_000));
      await usdc.connect(alice).approve(addr, USDC(100_000));
      await usdc.connect(bob).approve(addr, USDC(100_000));
      await circle.connect(alice).joinCircle();
      await circle.connect(bob).joinCircle();

      // Round 1
      await circle.connect(owner).deposit();
      await circle.connect(alice).deposit();
      await circle.connect(bob).deposit();
      await circle.connect(owner).triggerPayout();

      // Round 2
      await circle.connect(owner).deposit();
      await circle.connect(alice).deposit();
      await circle.connect(bob).deposit();
      await circle.connect(owner).triggerPayout();

      // Round 3
      await circle.connect(owner).deposit();
      await circle.connect(alice).deposit();
      await circle.connect(bob).deposit();
      await circle.connect(owner).triggerPayout();

      expect((await circle.getInfo()).isActive).to.be.false;
    });
  });

  // ── Pausable ──────────────────────────────────────────────────────────────
  describe("Pausable", () => {
    it("admin can pause — blocks joinCircle", async () => {
      const { owner, alice, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      await circle.connect(owner).pause();
      await expect(circle.connect(alice).joinCircle())
        .to.be.revertedWithCustomError(circle, "EnforcedPause");
    });

    it("non-admin cannot pause", async () => {
      const { alice, deployCircle } = await networkHelpers.loadFixture(deployFixture);
      const circle = await deployCircle();
      await expect(circle.connect(alice).pause())
        .to.be.revertedWithCustomError(circle, "AccessControlUnauthorizedAccount");
    });
  });
});
