/**
 * contract/api.js
 *
 * Named wrappers around the raw query/execute hook calls.
 * Each function maps 1-to-1 with an ink! message in lib.rs.
 *
 * Import and call these from your components rather than calling
 * query/execute directly — keeps contract logic out of UI code.
 */

// ── Read queries ───────────────────────────────────────────────────────────

/** Fetch all circles a given account is a member of */
export async function getMyCircles(query, account) {
  return query('getCirclesByMember', [account]);
}

/** Fetch full state of a single circle */
export async function getCircle(query, circleId) {
  return query('getCircle', [circleId]);
}

/** Fetch open (joinable) circles */
export async function getOpenCircles(query) {
  return query('getOpenCircles', []);
}

/** Get the current round info for a circle */
export async function getCurrentRound(query, circleId) {
  return query('getCurrentRound', [circleId]);
}

// ── Mutating transactions ──────────────────────────────────────────────────

/**
 * Create a new savings circle.
 * @param {Function}  execute
 * @param {object}    params
 * @param {string}    params.name         - Circle display name
 * @param {number}    params.memberCap    - Max number of members
 * @param {string}    params.depositAmount - Amount in USDC base units (6 decimals)
 * @param {number}    params.cycleSeconds  - Cycle duration in seconds
 * @param {string}    params.usdcAddress   - PSP22 USDC contract address
 * @param {Function}  onStatus
 */
export async function createCircle(execute, params, onStatus) {
  const { name, memberCap, depositAmount, cycleSeconds, usdcAddress } = params;
  return execute(
    'createCircle',
    [name, memberCap, depositAmount, cycleSeconds, usdcAddress],
    '0',
    onStatus
  );
}

/**
 * Join an existing circle.
 * Must have approved the USDC contract to spend depositAmount first.
 */
export async function joinCircle(execute, circleId, onStatus) {
  return execute('joinCircle', [circleId], '0', onStatus);
}

/**
 * Make a deposit for the current round.
 * Requires prior PSP22 approval of depositAmount to the RotaFi contract.
 */
export async function makeDeposit(execute, circleId, onStatus) {
  return execute('deposit', [circleId], '0', onStatus);
}

/**
 * Trigger payout to the current round's recipient.
 * Can be called by any member after all deposits are in
 * and the cycle window has passed.
 */
export async function triggerPayout(execute, circleId, onStatus) {
  return execute('triggerPayout', [circleId], '0', onStatus);
}

/**
 * Approve the PSP22 USDC contract to let RotaFi spend tokens.
 * Must be called before joinCircle or deposit.
 * @param {ContractPromise} usdcContract - PSP22 contract instance
 * @param {string}          spender      - RotaFi contract address
 * @param {string}          amount       - Amount in base units
 * @param {Function}        execute      - From usePolkadot (bound to usdcContract)
 */
export async function approveUsdc(execute, spender, amount, onStatus) {
  return execute('psp22::approve', [spender, amount], '0', onStatus);
}
