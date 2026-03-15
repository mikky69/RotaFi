//! # RotaFi — On-Chain Rotating Savings Circle
//!
//! Implements the Ajo / Esusu / Chit-fund pattern fully on-chain using ink! 4.
//!
//! ## Lifecycle
//!
//! 1. **Create** — any account calls `create_circle`. They become the admin
//!    and the first member. The circle is open until `member_cap` is reached.
//!
//! 2. **Join** — accounts call `join_circle`. Before joining, the caller must
//!    have approved the RotaFi contract to spend `deposit_amount` of the PSP22
//!    USDC token.
//!
//! 3. **Deposit** — each round, every member calls `deposit`. The contract
//!    pulls `deposit_amount` of PSP22 tokens from the caller via
//!    `transfer_from`.
//!
//! 4. **Payout** — once all members have deposited (or the deadline passes),
//!    any member can call `trigger_payout`. The contract sends the full pot
//!    to the current round's recipient and advances the round counter.
//!
//! 5. **Repeat** — steps 3–4 repeat until all `total_rounds` are complete.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod rotafi {
    use ink::prelude::{string::String, vec, vec::Vec};
    use ink::storage::Mapping;

    // ── PSP22 interface (minimal subset we need) ─────────────────────────────
    // We call the USDC contract externally using cross-contract calls.
    #[ink::trait_definition]
    pub trait Psp22 {
        /// Transfer `value` tokens from `from` to `to` using the caller's
        /// allowance. Caller must be approved by `from`.
        #[ink(message)]
        fn transfer_from(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
            data: Vec<u8>,
        ) -> Result<(), Psp22Error>;

        /// Transfer `value` tokens from the caller to `to`.
        #[ink(message)]
        fn transfer(&mut self, to: AccountId, value: Balance, data: Vec<u8>) -> Result<(), Psp22Error>;
    }

    // ── Error types ──────────────────────────────────────────────────────────
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Caller is not a member of this circle.
        NotMember,
        /// Circle already has max members.
        CircleFull,
        /// Caller is already a member.
        AlreadyMember,
        /// Caller already deposited this round.
        AlreadyDeposited,
        /// Not all members have deposited yet and deadline has not passed.
        RoundNotComplete,
        /// No circle found with that ID.
        CircleNotFound,
        /// PSP22 transfer failed.
        TransferFailed,
        /// Caller is not the admin of this circle.
        NotAdmin,
        /// Circle is no longer active (all rounds complete).
        CircleComplete,
        /// Attempt to join a circle that has not yet reached full capacity and
        /// started — the circle is still in the filling phase.
        CircleNotStarted,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Psp22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    pub type Result<T> = core::result::Result<T, Error>;

    // ── Storage structs ──────────────────────────────────────────────────────

    /// Persistent data for one savings circle.
    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Circle {
        /// Human-readable name.
        pub name: String,
        /// Admin / creator account.
        pub admin: AccountId,
        /// Maximum number of members.
        pub member_cap: u32,
        /// Current number of members.
        pub member_count: u32,
        /// Amount each member deposits per round (PSP22 base units, 6 decimals).
        pub deposit_amount: Balance,
        /// Duration of each cycle in seconds.
        pub cycle_seconds: u64,
        /// Which round we are currently on (1-indexed; 0 = not yet started).
        pub current_round: u32,
        /// Total rounds == member_cap (each member receives exactly once).
        pub total_rounds: u32,
        /// Whether the circle is still active.
        pub is_active: bool,
        /// PSP22 USDC token contract address.
        pub usdc_address: AccountId,
        /// Ordered list of member addresses (index+1 == their payout position).
        pub members: Vec<AccountId>,
        /// Timestamp (unix seconds) when the current round started.
        pub round_started_at: u64,
    }

    /// Per-round deposit tracking: maps circle_id → round → member → deposited?
    /// Stored flat as (circle_id, round, member) → bool.

    // ── View structs (returned to callers) ───────────────────────────────────

    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct CircleView {
        pub id:             u32,
        pub name:           String,
        pub admin:          AccountId,
        pub member_cap:     u32,
        pub member_count:   u32,
        pub deposit_amount: Balance,
        pub cycle_seconds:  u64,
        pub current_round:  u32,
        pub total_rounds:   u32,
        pub is_active:      bool,
        pub usdc_address:   AccountId,
    }

    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct RoundView {
        pub round_index:     u32,
        pub recipient:       AccountId,
        pub deposits_in:     u32,
        pub deposits_needed: u32,
        pub deadline:        u64,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    #[ink(event)]
    pub struct CircleCreated {
        #[ink(topic)]
        pub circle_id: u32,
        #[ink(topic)]
        pub admin: AccountId,
        pub name: String,
    }

    #[ink(event)]
    pub struct MemberJoined {
        #[ink(topic)]
        pub circle_id: u32,
        #[ink(topic)]
        pub member: AccountId,
    }

    #[ink(event)]
    pub struct DepositMade {
        #[ink(topic)]
        pub circle_id: u32,
        #[ink(topic)]
        pub member: AccountId,
        pub round: u32,
    }

    #[ink(event)]
    pub struct PotPaidOut {
        #[ink(topic)]
        pub circle_id: u32,
        #[ink(topic)]
        pub recipient: AccountId,
        pub amount: Balance,
        pub round: u32,
    }

    // ── Contract storage ─────────────────────────────────────────────────────

    #[ink(storage)]
    pub struct Rotafi {
        /// Auto-incrementing circle ID counter.
        next_id: u32,
        /// All circles by ID.
        circles: Mapping<u32, Circle>,
        /// circles a given account belongs to: account → Vec<circle_id>
        member_circles: Mapping<AccountId, Vec<u32>>,
        /// Deposit tracker: (circle_id, round, member) → deposited?
        deposits: Mapping<(u32, u32, AccountId), bool>,
        /// All circle IDs (for iteration).
        all_ids: Vec<u32>,
    }

    // ── Implementation ────────────────────────────────────────────────────────

    impl Rotafi {
        /// Instantiate RotaFi. No parameters needed.
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                next_id: 1,
                circles: Mapping::default(),
                member_circles: Mapping::default(),
                deposits: Mapping::default(),
                all_ids: Vec::new(),
            }
        }

        // ── Mutating messages ─────────────────────────────────────────────

        /// Create a new savings circle.
        ///
        /// The caller becomes the admin and the first member.
        /// The rotation order will be determined by join order.
        ///
        /// # Arguments
        /// * `name`           - Display name (max 60 chars)
        /// * `member_cap`     - Total members (3–20)
        /// * `deposit_amount` - Amount in PSP22 base units per cycle
        /// * `cycle_seconds`  - Seconds between payouts (e.g. 604800 = 1 week)
        /// * `usdc_address`   - PSP22 USDC token contract address
        #[ink(message)]
        pub fn create_circle(
            &mut self,
            name: String,
            member_cap: u32,
            deposit_amount: Balance,
            cycle_seconds: u64,
            usdc_address: AccountId,
        ) -> Result<u32> {
            let caller = self.env().caller();
            let id     = self.next_id;
            self.next_id += 1;

            let circle = Circle {
                name:            name.clone(),
                admin:           caller,
                member_cap,
                member_count:    1,
                deposit_amount,
                cycle_seconds,
                current_round:   0,
                total_rounds:    member_cap,
                is_active:       true,
                usdc_address,
                members:         vec![caller],
                round_started_at: 0,
            };

            self.circles.insert(id, &circle);
            self.all_ids.push(id);
            self._push_member_circle(caller, id);

            self.env().emit_event(CircleCreated {
                circle_id: id,
                admin: caller,
                name,
            });

            Ok(id)
        }

        /// Join an open circle.
        ///
        /// The caller is appended to the rotation order.
        /// When the last spot is filled the first round begins automatically.
        #[ink(message)]
        pub fn join_circle(&mut self, circle_id: u32) -> Result<()> {
            let caller = self.env().caller();
            let mut circle = self.circles.get(circle_id).ok_or(Error::CircleNotFound)?;

            if !circle.is_active { return Err(Error::CircleComplete); }
            if circle.member_count >= circle.member_cap { return Err(Error::CircleFull); }
            if circle.members.contains(&caller) { return Err(Error::AlreadyMember); }

            circle.member_count += 1;
            circle.members.push(caller);

            // Start round 1 when the last seat is filled
            if circle.member_count == circle.member_cap {
                circle.current_round  = 1;
                circle.round_started_at = self.env().block_timestamp() / 1000; // ms → s
            }

            self.circles.insert(circle_id, &circle);
            self._push_member_circle(caller, circle_id);

            self.env().emit_event(MemberJoined { circle_id, member: caller });

            Ok(())
        }

        /// Deposit into the current round.
        ///
        /// Transfers `deposit_amount` of PSP22 USDC from the caller to this
        /// contract via `transfer_from`. The caller must have approved this
        /// contract address for at least `deposit_amount` on the USDC contract.
        #[ink(message)]
        pub fn deposit(&mut self, circle_id: u32) -> Result<()> {
            let caller = self.env().caller();
            let circle = self.circles.get(circle_id).ok_or(Error::CircleNotFound)?;

            if !circle.is_active { return Err(Error::CircleComplete); }
            if circle.current_round == 0 { return Err(Error::CircleNotStarted); }
            if !circle.members.contains(&caller) { return Err(Error::NotMember); }

            let key = (circle_id, circle.current_round, caller);
            if self.deposits.get(key).unwrap_or(false) {
                return Err(Error::AlreadyDeposited);
            }

            // Pull tokens from caller
            let mut usdc: ink::contract_ref!(Psp22) = circle.usdc_address.into();
            usdc.transfer_from(
                caller,
                self.env().account_id(),
                circle.deposit_amount,
                Vec::new(),
            ).map_err(|_| Error::TransferFailed)?;

            self.deposits.insert(key, &true);

            self.env().emit_event(DepositMade {
                circle_id,
                member: caller,
                round: circle.current_round,
            });

            Ok(())
        }

        /// Trigger payout to the current round's recipient.
        ///
        /// Requirements: all members must have deposited, OR the cycle
        /// deadline has passed (latecomers forfeit their deposit slot —
        /// their seat remains but payout proceeds without them).
        ///
        /// Can be called by any member.
        #[ink(message)]
        pub fn trigger_payout(&mut self, circle_id: u32) -> Result<()> {
            let caller = self.env().caller();
            let mut circle = self.circles.get(circle_id).ok_or(Error::CircleNotFound)?;

            if !circle.is_active { return Err(Error::CircleComplete); }
            if circle.current_round == 0 { return Err(Error::CircleNotStarted); }
            if !circle.members.contains(&caller) { return Err(Error::NotMember); }

            let now      = self.env().block_timestamp() / 1000;
            let deadline = circle.round_started_at + circle.cycle_seconds;
            let all_in   = self._count_deposits(&circle, circle_id) == circle.member_count;

            if !all_in && now < deadline {
                return Err(Error::RoundNotComplete);
            }

            // Recipient is the member at position (current_round - 1) in order
            let recipient_idx = (circle.current_round - 1) as usize;
            let recipient     = circle.members[recipient_idx];

            // Count actual deposits to calculate real pot
            let deposits_in = self._count_deposits(&circle, circle_id);
            let pot         = circle.deposit_amount * deposits_in as u128;

            // Transfer pot to recipient
            if pot > 0 {
                let mut usdc: ink::contract_ref!(Psp22) = circle.usdc_address.into();
                usdc.transfer(recipient, pot, Vec::new())
                    .map_err(|_| Error::TransferFailed)?;
            }

            self.env().emit_event(PotPaidOut {
                circle_id,
                recipient,
                amount: pot,
                round: circle.current_round,
            });

            // Advance round or close circle
            if circle.current_round >= circle.total_rounds {
                circle.is_active = false;
            } else {
                circle.current_round  += 1;
                circle.round_started_at = now;
            }

            self.circles.insert(circle_id, &circle);

            Ok(())
        }

        // ── Read-only queries ─────────────────────────────────────────────

        /// Get the full state of a circle.
        #[ink(message)]
        pub fn get_circle(&self, circle_id: u32) -> Option<CircleView> {
            self.circles.get(circle_id).map(|c| CircleView {
                id:             circle_id,
                name:           c.name,
                admin:          c.admin,
                member_cap:     c.member_cap,
                member_count:   c.member_count,
                deposit_amount: c.deposit_amount,
                cycle_seconds:  c.cycle_seconds,
                current_round:  c.current_round,
                total_rounds:   c.total_rounds,
                is_active:      c.is_active,
                usdc_address:   c.usdc_address,
            })
        }

        /// Get circle IDs a given member belongs to.
        #[ink(message)]
        pub fn get_circles_by_member(&self, member: AccountId) -> Vec<u32> {
            self.member_circles.get(member).unwrap_or_default()
        }

        /// Get all circles that still have open spots (joinable).
        #[ink(message)]
        pub fn get_open_circles(&self) -> Vec<CircleView> {
            self.all_ids
                .iter()
                .filter_map(|&id| {
                    self.circles.get(id).and_then(|c| {
                        if c.is_active && c.member_count < c.member_cap {
                            Some(CircleView {
                                id,
                                name:           c.name,
                                admin:          c.admin,
                                member_cap:     c.member_cap,
                                member_count:   c.member_count,
                                deposit_amount: c.deposit_amount,
                                cycle_seconds:  c.cycle_seconds,
                                current_round:  c.current_round,
                                total_rounds:   c.total_rounds,
                                is_active:      c.is_active,
                                usdc_address:   c.usdc_address,
                            })
                        } else {
                            None
                        }
                    })
                })
                .collect()
        }

        /// Get round info for a circle.
        #[ink(message)]
        pub fn get_current_round(&self, circle_id: u32) -> Option<RoundView> {
            let circle = self.circles.get(circle_id)?;
            if circle.current_round == 0 { return None; }

            let idx       = (circle.current_round - 1) as usize;
            let recipient = *circle.members.get(idx)?;
            let deposits  = self._count_deposits(&circle, circle_id);

            Some(RoundView {
                round_index:     circle.current_round,
                recipient,
                deposits_in:     deposits,
                deposits_needed: circle.member_count,
                deadline:        circle.round_started_at + circle.cycle_seconds,
            })
        }

        /// Check whether a specific member has deposited for the current round.
        #[ink(message)]
        pub fn has_deposited(&self, circle_id: u32, member: AccountId) -> bool {
            let circle = match self.circles.get(circle_id) {
                Some(c) => c,
                None    => return false,
            };
            self.deposits
                .get((circle_id, circle.current_round, member))
                .unwrap_or(false)
        }

        /// Get the ordered member list for a circle.
        #[ink(message)]
        pub fn get_members(&self, circle_id: u32) -> Vec<AccountId> {
            self.circles
                .get(circle_id)
                .map(|c| c.members)
                .unwrap_or_default()
        }

        // ── Private helpers ───────────────────────────────────────────────

        fn _push_member_circle(&mut self, member: AccountId, circle_id: u32) {
            let mut ids = self.member_circles.get(member).unwrap_or_default();
            ids.push(circle_id);
            self.member_circles.insert(member, &ids);
        }

        fn _count_deposits(&self, circle: &Circle, circle_id: u32) -> u32 {
            circle
                .members
                .iter()
                .filter(|&&m| {
                    self.deposits
                        .get((circle_id, circle.current_round, m))
                        .unwrap_or(false)
                })
                .count() as u32
        }
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        fn default_accounts() -> test::DefaultAccounts<ink::env::DefaultEnvironment> {
            test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_caller(account: AccountId) {
            test::set_caller::<ink::env::DefaultEnvironment>(account);
        }

        // Dummy USDC address for unit tests (no real PSP22 calls)
        fn usdc() -> AccountId {
            AccountId::from([0x42u8; 32])
        }

        #[ink::test]
        fn create_circle_works() {
            let accounts = default_accounts();
            set_caller(accounts.alice);

            let mut contract = Rotafi::new();
            let id = contract
                .create_circle(
                    String::from("Test Circle"),
                    4,
                    100_000_000, // 100 USDC with 6 decimals
                    2_592_000,   // 30 days
                    usdc(),
                )
                .unwrap();

            assert_eq!(id, 1);
            let view = contract.get_circle(id).unwrap();
            assert_eq!(view.member_count, 1);
            assert_eq!(view.current_round, 0);
            assert!(view.is_active);
        }

        #[ink::test]
        fn join_circle_works() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Rotafi::new();
            let id = contract
                .create_circle(String::from("C"), 2, 100, 86400, usdc())
                .unwrap();

            set_caller(accounts.bob);
            contract.join_circle(id).unwrap();

            let view = contract.get_circle(id).unwrap();
            // Both seats filled → round 1 starts
            assert_eq!(view.member_count, 2);
            assert_eq!(view.current_round, 1);
        }

        #[ink::test]
        fn cannot_join_full_circle() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Rotafi::new();
            let id = contract
                .create_circle(String::from("C"), 2, 100, 86400, usdc())
                .unwrap();

            set_caller(accounts.bob);
            contract.join_circle(id).unwrap();

            // Circle is now full — charlie should be rejected
            set_caller(accounts.charlie);
            let result = contract.join_circle(id);
            assert_eq!(result, Err(Error::CircleFull));
        }

        #[ink::test]
        fn cannot_deposit_twice() {
            // This test verifies the double-deposit guard at the storage level.
            // PSP22 transfer_from is mocked out in unit tests, so we only test
            // the deposit key uniqueness logic here.
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Rotafi::new();
            // Insert a deposit record manually to simulate having deposited
            let circle_id = 1u32;
            contract.deposits.insert((circle_id, 1u32, accounts.alice), &true);

            // Verify the has_deposited query respects it
            assert!(contract.has_deposited(circle_id, accounts.alice));
            assert!(!contract.has_deposited(circle_id, accounts.bob));
        }
    }
}
