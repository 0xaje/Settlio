import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserProvider, Contract, ZeroAddress, getAddress, parseUnits, type TransactionReceipt, type TransactionResponse } from 'ethers';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import { asQuote, configured, errorMessage, escrowAddress, explorer, reader, readContract, walletContract, readPolicyDeployment, readAutomationStatus } from './chain';
import { readPolicyVersion } from './policy';
import { approvalKey as tokenApprovalKey, approvalValue, prepareDepositApproval, type ApprovalState } from './approval';
import { readAdmissionState, creationUnavailable, assertCreationAllowed, retryUnavailable, type AdmissionState } from './admission';
import { createdQuoteFromReceipt } from './recovery';
import { ensureBaseSepolia } from './wallet';
import { decodePending, pendingReceipt, recoverPendingTransaction } from './pending';
import { assets, knownAsset, displayAmount as amount } from './assets';
import { decodeTerms, encodeTerms, matchesQuote, readQuoteTerms, termsHash, type Quote, type Terms } from './terms';
import { Landing } from './Landing';

const statuses = ['Missing', 'Awaiting deposit', 'Confirming booking', 'Confirmed', 'Refund pending', 'Refunded', 'Expired', 'Released'];
const statusLabel = (quote: Quote, now: number) =>
  quote.status === 1 && BigInt(now) >= quote.expiresAt ? 'Payment deadline passed' : statuses[quote.status];
const short = (address: string) => address.slice(0, 6) + '…' + address.slice(-4);
const date = (seconds: bigint | number) => new Date(Number(seconds) * 1000).toLocaleString();
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pendingKey = () => 'settlio:pending:84532:' + escrowAddress;
const draftKey = (hash: string) => 'settlio:terms:84532:' + escrowAddress + ':' + hash;
function pendingHash(): string {
  try { return decodePending(localStorage.getItem(pendingKey()), escrowAddress)?.hash || ''; }
  catch { return ''; }
}
const cacheKey = (id: bigint) => 'settlio:84532:' + escrowAddress + ':' + id;
function loadTerms(id: bigint): Terms | null {
  try {
    const fragment = new URLSearchParams(location.hash.slice(1)).get('terms');
    return readQuoteTerms(fragment, () => localStorage.getItem(cacheKey(id)));
  } catch { return null; }
}
function shareLink(id: bigint, terms: Terms): string {
  return location.origin + location.pathname + '?quote=' + id + '#terms=' + encodeTerms(terms);
}
function App() {
  const [route, setRoute] = useState(location.search + location.hash);
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const transactionLock = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(pendingHash);
  const [pending, setPending] = useState(pendingHash);
  const [unresolved, setUnresolved] = useState(false);
  const [recoveryHash, setRecoveryHash] = useState('');
  const [refresh, setRefresh] = useState(0);
  const params = new URLSearchParams(route.split('#')[0]);
  const quoteParam = params.get('quote');
  const quoteId = quoteParam && /^[1-9]\d{0,17}$/.test(quoteParam) ? BigInt(quoteParam) : null;
  const creating = params.get('screen') === 'new';
  const viewingQuotes = params.get('screen') === 'quotes';
  const isLanding = !quoteParam && !creating && !viewingQuotes;
  const pauseReceiptCheck = import.meta.env.DEV && creating && !quoteParam && params.get('receipt-check') === 'pause';
  function navigate(search: string) {
    // Keep the explicitly selected development check when opening the editor.
    if (import.meta.env.DEV && params.get('receipt-check') === 'pause' && search === '?screen=new') {
      search += '&receipt-check=pause';
    }
    history.pushState({}, '', location.pathname + search);
    setRoute(location.search + location.hash);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setError(''); setMessage(''); setTransaction('');
  }
  useEffect(() => {
    const updateRoute = () => setRoute(location.search + location.hash);
    const wallet = window.ethereum;
    let active = true;
    const accountChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (active) setAccount(accounts?.[0] ? getAddress(accounts[0]) : '');
      setRefresh(value => value + 1);
    };
    const chainChanged = () => { setAccount(''); setMessage('Wallet network changed. Connect again to continue.'); };
    let disconnected = false;
    try { disconnected = sessionStorage.getItem('settlio:disconnected') === '1'; } catch {}
    if (!disconnected) {
      wallet?.request({ method: 'eth_accounts' }).then(value => {
        if (active) accountChanged(value);
      }).catch(() => {});
    }
    wallet?.on?.('accountsChanged', accountChanged);
    wallet?.on?.('chainChanged', chainChanged);
    addEventListener('popstate', updateRoute);
    addEventListener('hashchange', updateRoute);
    return () => {
      active = false;
      wallet?.removeListener?.('accountsChanged', accountChanged);
      wallet?.removeListener?.('chainChanged', chainChanged);
      removeEventListener('popstate', updateRoute);
      removeEventListener('hashchange', updateRoute);
    };
  }, []);
  async function connect() {
    setError('');
    if (!window.ethereum) { setError('Install a browser wallet to connect, or open this page in your wallet browser.'); return; }
    try {
      try { sessionStorage.removeItem('settlio:disconnected'); } catch {}
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureBaseSepolia(window.ethereum);
      setAccount(await (await new BrowserProvider(window.ethereum).getSigner()).getAddress());
    } catch (failure) { setError(errorMessage(failure)); }
  }
  function disconnect() {
    try { sessionStorage.setItem('settlio:disconnected', '1'); } catch {}
    setAccount('');
    setError('');
    setMessage('Wallet disconnected.');
    setRefresh(value => value + 1);
    window.ethereum?.request?.({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }).catch(() => {});
  }
  async function transact(send: () => Promise<TransactionResponse | null>, after?: (receipt: TransactionReceipt) => void) {
    if (transactionLock.current || pending) return;
    transactionLock.current = true;
    setBusy(true); setError(''); setMessage('Review this action in your wallet.'); setTransaction('');
    try {
      const tx = await send();
      if (!tx) { setMessage('Approval is already sufficient. You can now pay the deposit.'); return; }
      setTransaction(tx.hash);
      setPending(tx.hash); setUnresolved(false);
      let saved = false;
      try { localStorage.setItem(pendingKey(), JSON.stringify({ hash: tx.hash, escrow: escrowAddress })); saved = true; } catch { /* In-memory recovery still works for this session. */ }
      // Controlled development-only interruption AFTER a real broadcast and saved hash.
      // The chain is unaffected; no transaction success or failure is fabricated.
      if (pauseReceiptCheck) {
        if (!saved) throw new Error('The transaction was sent, but this browser could not save its hash. Keep this page open and use Check saved transaction.');
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        setMessage('Step 1 complete: your quote transaction was sent and saved. Now refresh this page (Ctrl+R). Then use the Check saved transaction button above. Do not create another quote or pay a deposit.');
        return;
      }
      setMessage('Transaction sent. Waiting for the Base Sepolia receipt.');
      const receipt = await tx.wait(1, 120000);
      if (!receipt || receipt.status !== 1) throw new Error('No successful receipt was found. Check the transaction before trying again.');
      setPending(''); setUnresolved(false);
      try { localStorage.removeItem(pendingKey()); } catch { /* Receipt remains authoritative. */ }
      setMessage('Transaction confirmed on Base Sepolia.');
      after?.(receipt);
      setRefresh(value => value + 1);
    } catch (failure) {
      const failedReceipt = (failure as { receipt?: TransactionReceipt }).receipt;
      if (failedReceipt?.status === 0) { setPending(''); try { localStorage.removeItem(pendingKey()); } catch {} }
      setError(errorMessage(failure));
      setMessage('');
    } finally { transactionLock.current = false; setBusy(false); }
  }
  async function checkPending() {
    if (transactionLock.current || !pending) return;
    transactionLock.current = true; setBusy(true); setError('');
    try {
      const receipt = await recoverPendingTransaction(reader, pending, restored => {
        setMessage('Transaction confirmed on Base Sepolia. Booking confirmation is checked separately on the quote.');
        restoreCreatedQuote(restored);
      }, () => {
        setPending(''); setUnresolved(false);
        try { localStorage.removeItem(pendingKey()); } catch {}
      });
      if (!receipt) { setUnresolved(true); setMessage('No receipt yet. The transaction may still be pending or dropped. Check its explorer page before sending anything again.'); return; }
      if (receipt.status !== 1) { setError('This transaction failed on-chain. Refresh the quote before trying again.'); return; }
      setRefresh(value => value + 1);
    } catch (failure) { setUnresolved(true); setMessage(''); setError(errorMessage(failure)); }
    finally { transactionLock.current = false; setBusy(false); }
  }
  function restoreCreatedQuote(receipt: TransactionReceipt): boolean {
    const created = createdQuoteFromReceipt(receipt, escrowAddress);
    if (!created) return false;
    let encoded: string | null = null;
    try { encoded = localStorage.getItem(draftKey(created.termsHash)) || localStorage.getItem(cacheKey(created.id)); } catch {}
    if (encoded) {
      const terms = decodeTerms(encoded);
      if (termsHash(terms).toLowerCase() !== created.termsHash.toLowerCase()) throw new Error('Saved quote terms do not match the creation receipt.');
      try { localStorage.setItem(cacheKey(created.id), encoded); } catch {}
      navigate('?quote=' + created.id + '#terms=' + encoded);
      setMessage('Recovered existing quote #' + created.id + ' from its successful creation receipt. Its saved service terms match. No new transaction was sent.');
    } else {
      navigate('?quote=' + created.id);
      setMessage('Quote found, but its original service terms are not saved in this browser. Open the original complete share link to restore them.');
    }
    return true;
  }
  async function recoverCreatedQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const saveForReload = pauseReceiptCheck && submitter instanceof HTMLButtonElement && submitter.value === 'save-for-reload';
    if (transactionLock.current || pending) return;
    transactionLock.current = true; setBusy(true); setError(''); setMessage('Checking the existing transaction. No wallet signature or payment is needed.');
    try {
      const receipt = await pendingReceipt(reader, recoveryHash.trim());
      if (!receipt) throw new Error('No receipt is available yet. Check this transaction in your wallet or explorer; do not create the quote again.');
      if (receipt.status !== 1) throw new Error('This transaction failed on-chain and did not create a quote.');
      if (saveForReload) {
        const created = createdQuoteFromReceipt(receipt, escrowAddress);
        if (!created) throw new Error('Use a successful quote-creation transaction from this escrow.');
        // Stage a verified EXISTING receipt for storage/reload coverage. No broadcast.
        // This is not evidence that the original transaction was interrupted.
        const encoded = localStorage.getItem(draftKey(created.termsHash)) || localStorage.getItem(cacheKey(created.id));
        if (!encoded || termsHash(decodeTerms(encoded)).toLowerCase() !== created.termsHash.toLowerCase()) {
          throw new Error('Matching original service terms are needed in this browser for the reload check.');
        }
        localStorage.setItem(pendingKey(), JSON.stringify({ hash: receipt.hash, escrow: escrowAddress }));
        if (pendingHash().toLowerCase() !== receipt.hash.toLowerCase()) throw new Error('This browser could not retain the transaction record. Do not create another quote.');
        setPending(receipt.hash); setTransaction(receipt.hash); setUnresolved(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        setMessage('Existing successful transaction saved for a development reload check. Now refresh (Ctrl+R), then click Check saved transaction. No new transaction was sent. This does not reproduce the original interruption.');
        return;
      }
      if (!restoreCreatedQuote(receipt)) throw new Error('This transaction has no quote-creation event from the configured Settlio escrow. Use the creation hash, not a payment or approval hash.');
    } catch (failure) { setMessage(''); setError(errorMessage(failure)); }
    finally { transactionLock.current = false; setBusy(false); }
  }
  function stopTracking() {
    setPending(''); setUnresolved(false);
    try { localStorage.removeItem(pendingKey()); } catch {}
    setMessage('Local tracking stopped. This does not cancel the transaction. Check your wallet and quote before submitting another action.');
  }
  if (isLanding) {
    return <Landing account={account} busy={busy} short={short} connect={connect} disconnect={disconnect} navigate={navigate} />;
  }
  return <div className="app">
    {!quoteParam && <aside className="sidebar"><a className="wordmark" href={location.pathname} onClick={event => { event.preventDefault(); navigate(''); }}>Settlio</a>
      <nav aria-label="Workspace">
        <button type="button" onClick={() => navigate('')}>Home</button>
        <button type="button" className={viewingQuotes ? 'selected' : ''} onClick={() => navigate('?screen=quotes')}>Quotes</button>
        <button type="button" className={creating ? 'selected' : ''} onClick={() => navigate('?screen=new')}>Create quote</button>
      </nav>
      <div className="sidebar-note">Your quotes.<br/>A clearer way to book work.</div>
      <span className="test-badge">{account ? short(account) + ' · ' : ''}Base Sepolia testnet</span>
    </aside>}
    <main className={quoteParam ? 'customer-main' : ''}>
      <header className="topbar"><span>{quoteParam ? 'Settlio / Shared quote' : creating ? 'Workspace / Create quote' : 'Workspace / Quotes'}</span><button className="secondary" disabled={busy} title={account ? 'Click to disconnect wallet' : 'Connect wallet'} aria-label={account ? 'Disconnect wallet' : 'Connect wallet'} onClick={account ? disconnect : connect}>{account ? short(account) : 'Connect wallet'}</button></header>
      {!configured && <section className="setup" aria-label="Deployment setup"><strong>Deployment setup is pending</strong><p>The screens are ready to connect. A verified Base Sepolia escrow address is required to create, read, or pay quotes.</p><p>Set VITE_ESCROW_ADDRESS after deployment. Payments are disabled until then.</p></section>}
      {pauseReceiptCheck && <p className="notice" role="status"><strong>Development receipt recovery check</strong><br/>This development mode pauses receipt processing after quote creation. It does not pause the blockchain or send a deposit. Only create a quote when a new test has been arranged.</p>}
      {pauseReceiptCheck && configured && !pending && <p className="notice" role="status"><strong>No saved transaction to check</strong><br/>There is no valid saved transaction for this escrow in this browser. The Check saved transaction button appears only while one is saved. Opening a quote or viewing its contract does not create a saved transaction. To reopen a known quote, use Recover a created quote below; do not create another quote just to find a button.</p>}
      <div className="build-note">Test funds only · Base Sepolia &amp; Reactive Lasna. Automatic checks require compatible, funded contracts and network delivery.</div>
      {pending && <section className="notice" role="status"><strong>Your saved transaction is ready to check</strong><p>Use the button below to read its result. No wallet signature or new transaction is needed. Creating another quote or payment is paused until this check is resolved.</p><a href={explorer + '/tx/' + pending} target="_blank" rel="noreferrer">View pending transaction</a><button className="secondary wide" disabled={busy} onClick={() => void checkPending()}>Check saved transaction</button>{unresolved && <><p>Stopping local tracking does not cancel or undo a transaction. Use this only after checking its status in your wallet and explorer.</p><button className="secondary wide" disabled={busy} onClick={stopTracking}>Stop local tracking</button></>}</section>}
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="notice">{message}</p>}
      {transaction && <a className="tx-link" href={explorer + '/tx/' + transaction} target="_blank" rel="noreferrer">View submitted transaction</a>}
      {quoteParam ? quoteId ? <QuoteView key={route} id={quoteId} account={account} busy={busy || !!pending} refresh={refresh} transact={transact} connect={connect}/> : <section><h1>Invalid quote link</h1><p>Ask the merchant to send the complete quote link.</p></section> :
      creating ? <CreateQuote account={account} busy={busy || !!pending} transact={transact} navigate={navigate} connect={connect}/> :
      <QuoteList account={account} refresh={refresh} navigate={navigate} connect={connect}/>}
      {configured && !pending && <details className="recovery"><summary>Recover a created quote</summary><p className="helper">Paste the quote-creation transaction hash to reopen the existing quote. This only reads its receipt and never creates a second quote or sends a payment.</p><form onSubmit={recoverCreatedQuote}><fieldset disabled={busy}><label>Quote-creation transaction hash<input value={recoveryHash} onChange={event => setRecoveryHash(event.target.value)} placeholder="0x…" autoComplete="off" required pattern="0x[a-fA-F0-9]{64}"/></label><button className="secondary" type="submit">Find existing quote</button>{pauseReceiptCheck && <><p className="helper">Development reload check: verify this existing successful receipt, save its hash, refresh, then check the saved transaction. This sends nothing and does not prove the original interruption.</p><button className="secondary" type="submit" name="recovery-mode" value="save-for-reload">Save existing transaction for reload check</button></>}</fieldset></form></details>}
      <footer>Settlio · Quotes and bookings · <a href="https://github.com/0xaje/Settlio" target="_blank" rel="noreferrer">View source</a></footer>
    </main>
  </div>;
}
type Transact = (send: () => Promise<TransactionResponse | null>, after?: (receipt: TransactionReceipt) => void) => Promise<void>;

function QuoteList({ account, refresh, navigate, connect }: { account: string; refresh: number; navigate: (route: string) => void; connect: () => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0n);
  const [filter, setFilter] = useState<'all' | 'awaiting' | 'confirmed' | 'expired' | 'settled'>('all');
  useEffect(() => { setPage(0); }, [account, refresh]);
  useEffect(() => {
    let active = true;
    setQuotes([]); setError('');
    if (!configured || !account) return;
    setLoading(true);
    async function load() {
      try {
        const contract = await readContract();
        const total: bigint = await contract.quoteCount();
        const last = total - BigInt(page * 20);
        const first = last > 19n ? last - 19n : 1n;
        const ids: bigint[] = [];
        for (let id = last; id >= first && id > 0n; id--) ids.push(id);
        const values = await Promise.all(ids.map(async id => asQuote(id, await contract.getQuote(id))));
        if (active) { setQuotes(values.filter(quote => getAddress(quote.merchant) === getAddress(account))); setCount(total); }
      } catch (failure) { if (active) setError(errorMessage(failure)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [account, refresh, page]);
  function openQuote(quote: Quote) {
    const terms = loadTerms(quote.id);
    navigate(terms ? '?quote=' + quote.id + '#terms=' + encodeTerms(terms) : '?quote=' + quote.id);
  }
  const filteredQuotes = quotes.filter(quote => {
    if (filter === 'awaiting') return quote.status === 1 && BigInt(now) < quote.expiresAt;
    if (filter === 'confirmed') return quote.status === 2 || quote.status === 3;
    if (filter === 'expired') return quote.status === 6 || (quote.status === 1 && BigInt(now) >= quote.expiresAt);
    if (filter === 'settled') return quote.status === 4 || quote.status === 5 || quote.status === 7;
    return true;
  });
  return <section>
    <div className="page-heading"><div><p className="eyebrow">A place for every quote</p><h1>Quotes</h1><p>Create and manage quotes for your clients.</p></div><button className="primary" onClick={() => navigate('?screen=new')}>New quote</button></div>
    <div className="filter-tabs" role="tablist" aria-label="Filter quotes">
      {([['all', 'All'], ['awaiting', 'Awaiting deposit'], ['confirmed', 'Confirmed'], ['expired', 'Expired'], ['settled', 'Refunded / Released']] as const).map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={filter === key} className={`filter-tab${filter === key ? ' is-active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
      ))}
    </div>
    <div className="list-panel">
      <div className="list-header"><h2>Your recent quotes</h2><span>Newest first</span></div>
      {!account ? <div className="empty"><h2>Start with your first quote</h2><p>Connect your wallet to see the quotes you have created.</p><button className="primary" onClick={connect}>Connect wallet</button></div> :
      !configured ? <div className="empty"><h2>Waiting for deployment</h2><p>Your quote history will appear here once the escrow is configured.</p></div> :
      loading ? <p role="status" className="empty">Reading your quote history…</p> :
      error ? <p role="alert" className="error">{error}</p> :
      <><div className="mobile-quotes" aria-label="Your quotes">{filteredQuotes.map(quote => <article className="mobile-quote" key={quote.id.toString()}><div className="mobile-quote-heading"><h3>Quote #{quote.id.toString()}</h3><span className={'status status-' + quote.status}>{statusLabel(quote, now)}</span></div><dl><dt>Customer</dt><dd className="address">{quote.customer}</dd><dt>Deposit</dt><dd>{quote.status === 1 ? 'Customer chooses' : amount(quote.deposit, quote.asset)}</dd><dt>Payment deadline</dt><dd>{date(quote.expiresAt)}</dd></dl><button className="secondary wide" onClick={() => openQuote(quote)}>Open quote #{quote.id.toString()}</button></article>)}</div><div className="table-scroll quote-table"><table><thead><tr><th>Quote / Customer</th><th>Deposit</th><th>Status</th><th>Payment deadline</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>
      {filteredQuotes.map(quote => <tr key={quote.id.toString()}><td><strong>Quote #{quote.id.toString()}</strong><small>{short(quote.customer)}</small></td><td>{quote.status === 1 ? 'Customer chooses' : amount(quote.deposit, quote.asset)}</td><td><span className={'status status-' + quote.status}>{statusLabel(quote, now)}</span></td><td>{date(quote.expiresAt)}</td><td><button className="text-button" onClick={() => openQuote(quote)}>Open quote</button></td></tr>)}
      </tbody></table></div>{!filteredQuotes.length && <div className="empty">No matching quotes in this range for the connected wallet.</div>}
      <div className="pagination"><span>Scanning up to 20 recent on-chain quotes per page.</span><button className="secondary" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Newer</button><button className="secondary" disabled={count <= BigInt((page + 1) * 20)} onClick={() => setPage(value => value + 1)}>Older</button></div></>}
    </div>
  </section>;
}

function CreateQuote({ account, busy, transact, navigate, connect }: { account: string; busy: boolean; transact: Transact; navigate: (route: string) => void; connect: () => void }) {
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState('');
  const [deposit, setDeposit] = useState('');
  const [validation, setValidation] = useState('');
  const [usdc, setUsdc] = useState(false);
  const [usdcTotal, setUsdcTotal] = useState('');
  const [usdcDeposit, setUsdcDeposit] = useState('');
  const [automaticRelease, setAutomaticRelease] = useState(false);
  const [policyVersion, setPolicyVersion] = useState<0 | 3 | 4 | null>(null);
  const [capabilityError, setCapabilityError] = useState('');
  const [capabilityRetry, setCapabilityRetry] = useState(0);
  const [admission, setAdmission] = useState<AdmissionState | null>(null);
  const [admissionError, setAdmissionError] = useState('');
  const [capacityRetry, setCapacityRetry] = useState(0);
  useEffect(() => {
    let active = true, reading = false;
    setAdmission(null); setAdmissionError('');
    if (policyVersion !== 4 || !account) return;
    async function load() {
      if (reading) return;
      reading = true;
      try { const value = await readAdmissionState(reader, await readContract(), account); if (active) { setAdmission(value); setAdmissionError(''); } }
      catch (failure) { if (active) { setAdmission(null); setAdmissionError(errorMessage(failure)); } }
      finally { reading = false; }
    }
    void load(); const timer = setInterval(() => void load(), 10000);
    return () => { active = false; clearInterval(timer); };
  }, [policyVersion, account, capacityRetry]);

  useEffect(() => {
    let active = true;
    setPolicyVersion(null); setCapabilityError('');
    if (!configured) return;
    void readContract().then(readPolicyDeployment)
      .then(value => { if (active) setPolicyVersion(value.version); })
      .catch(failure => { if (active) setCapabilityError(errorMessage(failure)); });
    return () => { active = false; };
  }, [capabilityRetry]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setValidation('');
    const form = new FormData(event.currentTarget);
    try {
      if (policyVersion === null) throw new Error('Wait for the deployment check, or retry it before creating a quote.');
      const totalWei = parseUnits(total, 18);
      const depositWei = parseUnits(deposit, 18);
      const expiresAt = Math.floor(new Date(String(form.get('expiry'))).getTime() / 1000);
      const refundCutoff = Math.floor(new Date(String(form.get('cutoff'))).getTime() / 1000);
      const customer = getAddress(String(form.get('customer')).trim());
      if (!service.trim() || totalWei < depositWei || depositWei <= 0n) throw new Error('Enter a service and a positive deposit no greater than the total.');
      if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000 || !Number.isSafeInteger(refundCutoff) || refundCutoff < expiresAt) throw new Error('Choose a future payment deadline and a refund cutoff at or after that deadline.');
      if (getAddress(account) === customer) throw new Error('Use a different wallet for your customer.');
      const options = [{ asset: ZeroAddress, total: totalWei.toString(), deposit: depositWei.toString() }];
      if (usdc) {
        const stableTotal = parseUnits(usdcTotal, 6), stableDeposit = parseUnits(usdcDeposit, 6);
        if (stableDeposit <= 0n || stableTotal < stableDeposit) throw new Error('Enter a positive USDC deposit no greater than its total.');
        options.push({ asset: assets[1].address, total: stableTotal.toString(), deposit: stableDeposit.toString() });
      }
      if (policyVersion === 4) { if (!admission) throw new Error('Refresh booking capacity before creating a quote.'); assertCreationAllowed(admission, expiresAt, refundCutoff); }
      const terms: Terms = { version: policyVersion === 4 ? 4 : policyVersion === 3 ? 3 : 2, ...((policyVersion === 3 || policyVersion === 4) ? { automaticRelease } : {}), options, service: service.trim(), description: description.trim(), merchant: getAddress(account), customer, total: totalWei.toString(), deposit: depositWei.toString(), expiresAt, refundCutoff };
      try { localStorage.setItem(draftKey(termsHash(terms)), encodeTerms(terms)); } catch { /* Existing share-link flow still works without local storage. */ }
      await transact(async () => {
        const current = await readContract();
        const checked = await readPolicyDeployment(current);
        if (checked.version !== policyVersion) throw new Error('The deployment check changed. Reload and review your quote.');
        if (checked.version === 4) assertCreationAllowed(await readAdmissionState(reader, current, account), expiresAt, refundCutoff);
        const contract = await walletContract(account);
        return (policyVersion === 3 || policyVersion === 4)
          ? contract.createQuoteWithPolicy(customer, options, expiresAt, refundCutoff, termsHash(terms), terms.automaticRelease)
          : contract.createQuoteWithOptions(customer, options, expiresAt, refundCutoff, termsHash(terms));
      }, receipt => {
        // The creation receipt is the authority for the ID, not the current counter.
        const id = createdQuoteId(receipt);
        try { localStorage.setItem(cacheKey(id), encodeTerms(terms)); } catch { /* The share URL carries the terms when local storage is unavailable. */ }
        navigate('?quote=' + id + '#terms=' + encodeTerms(terms));
      });
    } catch (failure) { setValidation(errorMessage(failure)); }
  }
  const previewRemaining = (() => {
    try {
      const t = parseUnits(total || '0', 18), d = parseUnits(deposit || '0', 18);
      if (t >= d && (total || deposit)) return amount(t - d, ZeroAddress);
    } catch {}
    return '—';
  })();
  return <section><div className="page-heading"><div><p className="eyebrow">Make the details clear</p><h1>Create quote</h1><p>Set the price and terms, then share one link with your customer.</p></div>{!account && <button className="primary" onClick={connect}>Connect wallet to create</button>}</div>
    <div className="editor-layout"><form className="form-panel" onSubmit={submit}><fieldset disabled={busy}>
      <label>Customer wallet<input name="customer" required placeholder="0x…" autoComplete="off"/></label>
      <label>Service<input name="service" required maxLength={120} value={service} onChange={event => setService(event.target.value)} placeholder="What are you booking?"/></label>
      <label>Description<textarea maxLength={2000} rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe the work included."/></label>
      <div className="field-row"><label>Total · test ETH<input required inputMode="decimal" value={total} onChange={event => setTotal(event.target.value)}/></label><label>Deposit · test ETH<input required inputMode="decimal" value={deposit} onChange={event => setDeposit(event.target.value)}/></label></div>
      <label><span><input type="checkbox" checked={usdc} onChange={event => setUsdc(event.target.checked)}/> Also accept test USDC</span></label>
      {usdc && <div className="field-row"><label>Total · test USDC<input required inputMode="decimal" value={usdcTotal} onChange={event => setUsdcTotal(event.target.value)}/></label><label>Deposit · test USDC<input required inputMode="decimal" value={usdcDeposit} onChange={event => setUsdcDeposit(event.target.value)}/></label></div>}
      <p className="helper">Set a separate price for each currency. There is no automatic conversion. USDT · Coming soon. It is not available for quotes or payments yet.</p>
      <div className="field-row"><label>Payment deadline<input name="expiry" type="datetime-local" required/></label><label>Full-refund cutoff<input name="cutoff" type="datetime-local" required/></label></div>
      {(policyVersion === 3 || policyVersion === 4) && <><label><span><input type="checkbox" checked={automaticRelease} onChange={event => setAutomaticRelease(event.target.checked)}/> Automatically release the deposit after the full-refund cutoff</span></label><p className="helper">{automaticRelease ? 'The deposit may be paid to you after the cutoff if no eligible cancellation has reserved a refund. This does not verify that the service was delivered.' : 'After the cutoff, you must claim an eligible confirmed deposit yourself. Eligible cancellations are still reserved for refund.'} This choice is fixed in the quote and shown to the customer before payment.</p></>}
      <p className="helper">Dates use your device’s time zone ({timeZone}). The customer must cancel before the cutoff for a full deposit refund. These terms are fixed when you create the quote.</p>
      <p className="helper">The share link contains your service description. Anyone with that link can read it. Avoid personal or confidential information.</p>
      {validation && <p role="alert" className="error">{validation}</p>}
      <button className="primary wide" type="submit" disabled={!account || !configured || policyVersion === null || (policyVersion === 4 && !!creationUnavailable(admission))}>{busy ? 'Waiting for transaction…' : 'Create share link'}</button>
    </fieldset></form>
    <div className="preview-column">
      <aside className="preview">
        <div className="preview-merchant"><span>Customer preview</span><small>{account ? short(account) : 'Connect merchant wallet'}</small></div>
        <h2>{service || 'Your service'}</h2>
        <p>{description || 'Your service details will appear here.'}</p>
        <div className="preview-amount"><span>Deposit due today</span><strong>{deposit || '—'} <small>test ETH</small></strong></div>
        <dl className="preview-totals"><dt>Total</dt><dd>{total ? total + ' test ETH' : '—'}</dd><dt>Remaining balance</dt><dd>{previewRemaining}</dd></dl>
        {usdc && <p className="helper">Or deposit {usdcDeposit || '—'} of {usdcTotal || '—'} test USDC</p>}
        {(policyVersion === 3 || policyVersion === 4) && <p className="helper">Deposit release: {automaticRelease ? 'Automatic after the agreed refund cutoff, unless a refund is reserved.' : 'Merchant must claim after the refund cutoff.'}</p>}
        <p className="helper">Payment confirms the deposit first. The booking is confirmed after Reactive delivers its callback.</p>
      </aside>
      {capabilityError ? <div className="error" role="alert"><p>{capabilityError}</p><button className="secondary" disabled={busy} onClick={() => setCapabilityRetry(value => value + 1)}>Retry deployment check</button></div> :
        configured && policyVersion === null ? <p className="notice" role="status">Checking which booking policies this deployment supports…</p> :
        policyVersion === 0 ? <p className="notice">This deployment supports deposit confirmation. Automatic expiry, refund routing and release are not available here.</p> : null}
      {policyVersion === 4 && <div className="notice capacity-card" aria-label="Booking capacity"><h3>Booking capacity</h3>
        {!account ? <p>Connect your merchant wallet to check its quote allowance.</p> : admissionError ? <p role="alert">Capacity unavailable: {admissionError}</p> : !admission ? <p role="status">Reading booking capacity…</p> : <>
          <p>{creationUnavailable(admission) || 'Your wallet can create a quote.'}</p>
          <p>Sponsored quotes remaining: {admission.credits.toString()}. {admission.validUntil > 0n ? <>Expires: {date(admission.validUntil)}.</> : 'No current allowance.'}</p>
          <p>Active: {admission.active.toString()} / {admission.maxActive.toString()} · Lifetime: {admission.admitted.toString()} / {admission.maxLifetime.toString()}.</p>
          <p className="helper">Max deadline horizon: {admission.maxHorizon.toString()}s. Finite testnet allowance.</p>
        </>}
        <button className="secondary" disabled={busy} onClick={() => setCapacityRetry(value => value + 1)}>Refresh booking capacity</button>
      </div>}
    </div></div>
  </section>;
}

import { Interface } from 'ethers';
import abi from './escrow-abi.json';
const quoteInterface = new Interface(abi);
function createdQuoteId(receipt: TransactionReceipt): bigint {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
    const parsed = quoteInterface.parseLog(log);
    if (parsed?.name === 'QuoteCreated') return parsed.args.quoteId as bigint;
  }
  throw new Error('The transaction receipt has no quote creation event. Check the transaction before creating another quote.');
}

function QuoteView({ id, account, busy, refresh, transact, connect }: { id: bigint; account: string; busy: boolean; refresh: number; transact: Transact; connect: () => void }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [terms] = useState(() => loadTerms(id));
  const [selected, setSelected] = useState(0);
  const [approval, setApproval] = useState<ApprovalState | null>(null);
  const [approvalError, setApprovalError] = useState('');
  const [approvalRefresh, setApprovalRefresh] = useState(0);
  const approvalAsset = quote?.options?.[selected]?.asset ?? ZeroAddress;
  const currentApprovalKey = tokenApprovalKey(approvalAsset, account, escrowAddress);
  const allowance = approvalValue(approval, currentApprovalKey);
  const knownAllowance = allowance ?? 0n;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const sequence = useRef(0);
  const [admission, setAdmission] = useState<AdmissionState | null>(null);
  const [admissionError, setAdmissionError] = useState('');
  useEffect(() => {
    let active = true, reading = false;
    setAdmission(null); setAdmissionError('');
    if (quote?.policyVersion !== 4) return;
    const merchant = quote.merchant;
    async function load() {
      if (reading) return;
      reading = true;
      try { const value = await readAdmissionState(reader, await readContract(), merchant, id); if (active) { setAdmission(value); setAdmissionError(''); } }
      catch (failure) { if (active) { setAdmission(null); setAdmissionError(errorMessage(failure)); } }
      finally { reading = false; }
    }
    void load(); const timer = setInterval(() => void load(), 10000);
    return () => { active = false; clearInterval(timer); };
  }, [id, quote?.policyVersion, quote?.merchant, refresh]);

  useEffect(() => {
    let active = true;
    async function load() {
      const current = ++sequence.current;
      if (!configured) return;
      try {
        const contract = await readContract();
        const value = asQuote(id, await contract.getQuote(id));
        const choices = await contract.getQuoteOptions(id);
        value.options = choices.map((choice: { asset: string; total: bigint; deposit: bigint }) => ({ asset: choice.asset, total: choice.total.toString(), deposit: choice.deposit.toString() }));
        if (value.status === 0) throw new Error('This quote was not found.');
        value.policyVersion = await readPolicyVersion(() => contract.POLICY_VERSION());
        value.automaticRelease = (value.policyVersion === 3 || value.policyVersion === 4) ? Boolean(await contract.automaticRelease(id)) : false;
        if (active && current === sequence.current) { setQuote(value); setError(''); }
      } catch (failure) { if (active && current === sequence.current) { setQuote(null); setError(errorMessage(failure)); } }
    }
    void load();
    const timer = setInterval(() => { setNow(Math.floor(Date.now() / 1000)); void load(); }, 10000);
    return () => { active = false; sequence.current++; clearInterval(timer); };
  }, [id, refresh]);
  useEffect(() => {
    let active = true;
    setApproval(null); setApprovalError('');
    if (account && approvalAsset !== ZeroAddress && knownAsset(approvalAsset)) {
      void readContract().then(contract => new Contract(approvalAsset, ['function allowance(address,address) view returns(uint256)'], contract.runner).allowance(account, escrowAddress))
        .then(value => { if (active) setApproval({ key: currentApprovalKey, value: BigInt(value) }); })
        .catch(() => { if (active) { setApproval(null); setApprovalError('Could not read token approval. Retry the approval check before continuing.'); } });
    }
    return () => { active = false; };
  }, [currentApprovalKey, approvalRefresh, refresh]);
  if (error) return <section><h1>Quote unavailable</h1><p role="alert" className="error">{error}</p><p>Refresh this page to retry the connection.</p></section>;
  if (!quote) return <section><h1>Quote #{id.toString()}</h1><p role="status">{configured ? 'Reading quote…' : 'Waiting for deployment setup.'}</p></section>;
  const choice = quote.options?.[quote.status === 1 ? selected : quote.selectedOption ?? 0];
  const asset = choice?.asset ?? quote.asset ?? ZeroAddress;
  const deposit = choice ? BigInt(choice.deposit) : quote.deposit;
  const total = choice ? BigInt(choice.total) : quote.total;
  const supported = !!knownAsset(asset);
  const needsApproval = asset !== ZeroAddress && knownAllowance < deposit;
  const verified = terms !== null && matchesQuote(terms, quote);
  const customer = account && getAddress(account) === getAddress(quote.customer);
  const merchant = account && getAddress(account) === getAddress(quote.merchant);
  const participant = account && (customer || merchant);
  const expired = BigInt(now) >= quote.expiresAt;
  const checkoutStep = quote.status === 1 && !expired && checkoutOpen;
  const isReceiptScreen = quote.status === 3 || quote.status === 5 || quote.status === 7;
  async function copy() {
    try { await navigator.clipboard.writeText(shareLink(id, terms!)); setCopied(true); }
    catch { setCopyError('Copy failed. Select and copy the full link from your browser address bar.'); }
  }
  if (checkoutStep) {
    return <article className="quote-document checkout-document">
      <div className="document-header"><a className="wordmark" href={location.pathname}>Settlio</a><span className={'status status-' + quote.status}>{statusLabel(quote, now)}</span></div>
      <div className="checkout-stepper" aria-label="Checkout progress">
        <span className="step-pill is-active">1. Pay deposit</span>
        <span className="step-line" aria-hidden="true"></span>
        <span className="step-pill">2. Confirming booking</span>
      </div>
      <p className="eyebrow">Quote #{id.toString()} · {verified ? terms.service : 'Service quote'}</p>
      <h1>Pay your deposit</h1>
      <p className="helper">Pay the deposit to secure your booking with {short(quote.merchant)}.</p>
      {!verified && <p role="alert" className="error">The service terms are missing or do not match this quote. Payment is disabled.</p>}
      <div className="checkout-grid">
        <div className="checkout-summary-box">
          <dl>
            <dt>Total</dt><dd>{amount(total, asset)}</dd>
            <dt>Deposit due today</dt><dd><strong>{amount(deposit, asset)}</strong></dd>
            <dt>Remaining balance</dt><dd>{amount(total - deposit, asset)}</dd>
          </dl>
        </div>
        <div className="checkout-method-box">
          <span className="method-label">Payment method</span>
          <div className="method-card is-selected">
            <span className="method-radio" aria-hidden="true"></span>
            <div><strong>Wallet</strong><small>Base Sepolia wallet transfer</small></div>
          </div>
          <label>Network<input readOnly value="Base Sepolia - Testnet"/></label>
          <label>Payment currency<select value={selected} disabled={busy} onChange={event => setSelected(Number(event.target.value))}>{quote.options?.map((option, index) => <option key={option.asset} value={index}>{knownAsset(option.asset)?.symbol ?? 'Unverified token'}</option>)}<option value="usdt-coming-soon" disabled>USDT (Coming soon)</option></select></label>
        </div>
      </div>
      {!supported && <p role="alert" className="error">This token is not verified for this interface. Payment is disabled.</p>}
      {!account ? <button className="primary wide" onClick={connect}>Connect wallet</button> :
      <>{asset !== ZeroAddress && allowance === null ? <><p role={approvalError ? 'alert' : 'status'} className="helper">{approvalError || 'Reading token approval…'}</p><button className="primary wide" disabled>Checking token approval…</button>{approvalError && <button className="secondary wide" disabled={busy} onClick={() => setApprovalRefresh(value => value + 1)}>Retry approval check</button>}</> : needsApproval ? <><p className="helper">First approve only this deposit amount. Then return here to pay. Approval alone does not pay your deposit. Test ETH is still needed for gas.</p><button className="primary wide" disabled={busy || !customer || !verified || !supported} onClick={() => void transact(async () => {
        const contract = await walletContract(account);
        const token = new Contract(asset, ['function allowance(address,address) view returns(uint256)', 'function approve(address,uint256) returns(bool)'], contract.runner);
        const prepared = await prepareDepositApproval<TransactionResponse>({
          allowance: async (owner, spender) => BigInt(await token.allowance(owner, spender)),
          approve: (spender, value) => token.approve(spender, value)
        }, account, escrowAddress, deposit);
        setApproval({ key: currentApprovalKey, value: prepared.allowance });
        return prepared.transaction;
      })}>{knownAllowance > 0n ? 'Reset previous approval' : 'Approve deposit amount'}</button></> :
      <button className="primary wide" disabled={busy || !customer || !verified || !supported} onClick={() => void transact(async () => {
        const contract = await walletContract(account);
        const payment = { value: asset === ZeroAddress ? deposit : 0n };
        return (terms?.version === 3 || terms?.version === 4) ? contract.payDepositWithPolicy(id, selected, quote.termsHash, terms.automaticRelease, payment) : contract.payDepositOption(id, selected, quote.termsHash, payment);
      }, () => setCheckoutOpen(false))}>Accept terms & pay deposit</button>}{!customer && <p className="helper">Connect the customer wallet shown on this quote to pay.</p>}</>}
      <p className="helper checkout-footnote">After payment, Reactive Network verifies your deposit and confirms your booking on-chain.</p>
      <button type="button" className="text-button" onClick={() => setCheckoutOpen(false)}>← Back to quote details</button>
    </article>;
  }
  return <article className="quote-document">
    <div className="document-header"><a className="wordmark" href={location.pathname}>Settlio</a><span className={'status status-' + quote.status}>{statusLabel(quote, now)}</span></div>
    {isReceiptScreen && <div className="receipt-hero">
      <div className="receipt-check" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <p className="eyebrow">Quote #{id.toString()}</p>
      <h1>{quote.status === 3 ? 'Booking confirmed' : quote.status === 5 ? 'Deposit refunded' : 'Deposit released'}</h1>
      <p className="helper">{quote.status === 3 ? `Your booking with ${short(quote.merchant)} is confirmed on Base Sepolia.` : quote.status === 5 ? 'Your deposit was returned on-chain in the original asset.' : 'The deposited amount was released to the merchant on-chain. This is not proof of service delivery.'}</p>
    </div>}
    {!isReceiptScreen && <>
      <div className="quote-title-row"><div><p className="eyebrow">Quote #{id.toString()}</p><h1>{verified ? terms.service : 'Service quote'}</h1></div><div className="quote-expiry-meta"><span>Quote expires</span><strong>{date(quote.expiresAt)}</strong></div></div>
      <p className="address">From {quote.merchant}</p><p className="address">For {quote.customer}</p>
    </>}
    {!verified && <p role="alert" className="error">The service terms are missing or do not match this quote. Ask the merchant for the complete original share link. Payment is disabled.</p>}
    {quote.status === 4 && <div className="notice"><h2>Refund pending</h2><p>Your cancellation is recorded and the deposit is reserved for refund. It has not yet been returned.</p></div>}
    {quote.status === 6 && <div className="notice"><h2>Quote expired</h2><p>Expiry is recorded on-chain. This quote cannot accept payment.</p></div>}
    {quote.status === 2 && <div className="notice">
      <div className="checkout-stepper" aria-label="Confirmation progress">
        <span className="step-pill is-done">Deposit received</span>
        <span className="step-line" aria-hidden="true"></span>
        <span className="step-pill is-active">Confirming booking</span>
      </div>
      <strong>Deposit received · confirming booking</strong><p>This page checks for confirmation every ten seconds. If delivery stalls, a participant can request it again below.</p>
    </div>}
    <div className="quote-columns"><div><h2>Service details</h2><p className="description">{verified ? terms.description || terms.service : 'Waiting for verified service terms.'}</p>
      <h2>Payment and cancellation</h2><p className="helper">Times use your device’s time zone: {timeZone}.</p><dl><dt>Pay before</dt><dd>{date(quote.expiresAt)}</dd><dt>Cancel before for a full deposit refund</dt><dd>{date(quote.refundCutoff)}</dd></dl>
      {(quote.policyVersion === 3 || quote.policyVersion === 4) ? <><p className="helper"><strong>Deposit release:</strong> {quote.automaticRelease ? 'Automatic after the refund cutoff if the booking is confirmed and no eligible cancellation reserved a refund.' : 'The merchant must claim an eligible confirmed deposit after the refund cutoff.'} These rules do not verify service delivery. Remaining-balance collection is not enabled.</p><AutomationStatus id={id} refresh={refresh}/></> : <p className="helper">Refund routing is not enabled on this deployment. The deposit is held in escrow through the refund period. Remaining-balance collection is not enabled in this build.</p>}
      <details><summary>Contract details</summary><p className="address">Terms fingerprint {quote.termsHash}</p><a href={explorer + '/address/' + escrowAddress} target="_blank" rel="noreferrer">View escrow on Base Sepolia</a></details>
    </div><aside className="payment-summary"><span>{quote.status === 1 && !expired ? 'Deposit due today' : quote.status === 3 ? 'Deposit (paid)' : 'Deposit amount'}</span>{quote.status === 1 && <label>Payment currency<select value={selected} disabled={busy} onChange={event => setSelected(Number(event.target.value))}>{quote.options?.map((option, index) => <option key={option.asset} value={index}>{knownAsset(option.asset)?.symbol ?? 'Unverified token'}</option>)}<option value="usdt-coming-soon" disabled>USDT (Coming soon)</option></select></label>}
      {!supported && <p role="alert" className="error">This token is not verified for this interface. Payment is disabled.</p>}
      <strong>{amount(deposit, asset)}</strong><dl><dt>Total</dt><dd>{amount(total, asset)}</dd><dt>Remaining balance</dt><dd>{amount(total - deposit, asset)}</dd></dl>
      {quote.status === 1 && !expired && (!account ? <button className="primary wide" onClick={connect}>Connect wallet</button> :
      <button className="primary wide" disabled={busy || !verified || !supported} onClick={() => setCheckoutOpen(true)}>Continue to wallet checkout</button>)}
      {quote.status === 2 && quote.policyVersion === 0 && participant && <button className="secondary wide" disabled={busy} onClick={() => void transact(async () => (await walletContract(account)).requestConfirmation(id))}>Request confirmation again</button>}
      {(quote.policyVersion === 3 || quote.policyVersion === 4) && customer && (quote.status === 2 || quote.status === 3) && BigInt(now) < quote.refundCutoff && <>
        <p className="helper">Cancellation reserves a full deposit refund now. The money returns when the refund transaction executes.</p>
        <button className="secondary wide" disabled={busy} onClick={() => void transact(async () => (await walletContract(account)).requestCancellation(id))}>Cancel booking and request full refund</button>
      </>}
      {(quote.policyVersion === 3 || quote.policyVersion === 4) && merchant && quote.status === 3 && BigInt(now) >= quote.refundCutoff &&
        <button className="secondary wide" disabled={busy} onClick={() => void transact(async () => (await walletContract(account)).release(id))}>Claim eligible deposit</button>}
      {(quote.policyVersion === 3 || quote.policyVersion === 4) && participant && (quote.status === 2 || quote.status === 4 || (quote.status === 1 && expired) || (quote.status === 3 && quote.automaticRelease && BigInt(now) >= quote.refundCutoff)) &&
        <div>{quote.policyVersion === 4 && <p className="helper">{admissionError ? 'Retry status unavailable: ' + admissionError : retryUnavailable(admission, BigInt(now)) || 'A participant retry is available.'} {admission && <>Retries used: {admission.retries?.toString() ?? 'unknown'} of {admission.maxRetries.toString()}. {admission.retryAfter !== undefined && admission.retryAfter > 0n && <>Next retry time: {date(admission.retryAfter)}.</>}</>}</p>}
        <button className="secondary wide" disabled={busy || (quote.policyVersion === 4 && !!retryUnavailable(admission, BigInt(now)))} onClick={() => void transact(async () => {
          if (quote.policyVersion === 4) {
            const current = await readContract();
            const blocked = retryUnavailable(await readAdmissionState(reader, current, quote.merchant, id));
            if (blocked) throw new Error(blocked);
          }
          return (await walletContract(account)).requestPolicy(id);
        })}>Retry automatic check</button></div>}
      {quote.policyVersion === 4 && customer && quote.status === 4 && <>
        <p className="helper">If automatic delivery is delayed, you can claim this reserved refund yourself. It returns the original deposit asset and amount to your customer wallet. No retry allowance or sponsor approval is needed.</p>
        <button className="secondary wide" disabled={busy} onClick={() => void transact(async () => {
          const current = await readContract(), fresh = asQuote(id, await current.getQuote(id));
          if (await readPolicyVersion(() => current.POLICY_VERSION()) !== 4 || fresh.status !== 4 || getAddress(fresh.customer) !== getAddress(account)) throw new Error('Refresh the quote and connect its customer wallet before claiming the reserved refund.');
          return (await walletContract(account)).claimRefund(id);
        })}>Claim reserved refund</button>
      </>}
      {verified && <button className="secondary wide" onClick={() => void copy()}>{copied ? 'Link copied' : 'Copy quote link'}</button>}{copyError && <p role="alert" className="error">{copyError}</p>}
    </aside></div>
  </article>;
}


function AutomationStatus({ id, refresh }: { id: bigint; refresh: number }) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof readAutomationStatus>> | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true, reading = false;
    setStatus(null); setError('');
    async function load() {
      if (reading) return;
      reading = true;
      try {
        const value = await readAutomationStatus(id);
        if (active) { setStatus(value); setError(''); }
      } catch (failure) { if (active) { setStatus(null); setError(errorMessage(failure)); } }
      finally { reading = false; }
    }
    void load();
    const timer = setInterval(() => void load(), 20000);
    return () => { active = false; clearInterval(timer); };
  }, [id, refresh, retry]);
  return <section className="notice" aria-label="Automatic booking checks"><h3>Automatic booking checks</h3>
    {error ? <><p role="alert">Status unavailable: {error}</p><p>The booking status above is read separately from Base Sepolia. An unavailable check is not proof of success or failure.</p><button className="secondary" onClick={() => setRetry(value => value + 1)}>Refresh automation status</button></> :
    !status ? <p role="status">Reading scheduler and fee status…</p> :
    <><p>{status.needsAttention ? 'This booking needs attention after repeated attempts. Check the available recovery actions below.' :
      status.closed ? 'The scheduler has observed this booking’s completion.' :
      status.paused ? 'The operator has paused automatic checks.' :
      !status.registered ? 'Waiting for the scheduler to observe this quote.' :
      status.nextAt > 0n && status.cron ? 'Automatic checks are scheduled. A scheduled check is not proof that a payment or refund has executed.' :
      'No automatic check is currently scheduled for this booking.'}</p>
      {status.nextAt > 0n && <p>Next eligible check: {date(status.nextAt)}. Delivery may be later.</p>}
      <p>Attempts in this retry cycle: {status.attempts} of 6.</p>
      <p>{status.feeAttention ? 'Automation funding needs attention. The operator must check fee balances and debt.' : 'No fee debt or empty fee balance detected. This does not guarantee enough funds for the next check.'}</p>
      <p className="helper">Automation fees are separate from customer deposits. This status refreshes every twenty seconds.</p></>}
  </section>;
}

createRoot(document.getElementById('root')!).render(<App/>);
