import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserProvider, Contract, ZeroAddress, getAddress, parseUnits, type TransactionReceipt, type TransactionResponse } from 'ethers';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import { asQuote, configured, errorMessage, escrowAddress, explorer, reader, readContract, walletContract } from './chain';
import { createdQuoteFromReceipt } from './recovery';
import { ensureBaseSepolia } from './wallet';
import { decodePending, pendingReceipt } from './pending';
import { assets, knownAsset, displayAmount as amount } from './assets';
import { decodeTerms, encodeTerms, matchesQuote, termsHash, type Quote, type Terms } from './terms';

const statuses = ['Missing', 'Awaiting deposit', 'Confirming booking', 'Confirmed', 'Refund pending', 'Refunded', 'Expired', 'Released'];
const short = (address: string) => address.slice(0, 6) + '…' + address.slice(-4);
const date = (seconds: bigint | number) => new Date(Number(seconds) * 1000).toLocaleString();
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
    const stored = localStorage.getItem(cacheKey(id));
    return fragment ? decodeTerms(fragment) : stored ? decodeTerms(stored) : null;
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
    wallet?.request({ method: 'eth_accounts' }).then(value => {
      if (active) accountChanged(value);
    }).catch(() => {});
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
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureBaseSepolia(window.ethereum);
      setAccount(await (await new BrowserProvider(window.ethereum).getSigner()).getAddress());
    } catch (failure) { setError(errorMessage(failure)); }
  }
  async function transact(send: () => Promise<TransactionResponse>, after?: (receipt: TransactionReceipt) => void) {
    if (transactionLock.current || pending) return;
    transactionLock.current = true;
    setBusy(true); setError(''); setMessage('Review this action in your wallet.'); setTransaction('');
    try {
      const tx = await send();
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
      const receipt = await pendingReceipt(reader, pending);
      if (!receipt) { setUnresolved(true); setMessage('No receipt yet. The transaction may still be pending or dropped. Check its explorer page before sending anything again.'); return; }
      setPending(''); setUnresolved(false);
      try { localStorage.removeItem(pendingKey()); } catch {}
      if (receipt.status !== 1) { setError('This transaction failed on-chain. Refresh the quote before trying again.'); return; }
      setMessage('Transaction confirmed on Base Sepolia. Booking confirmation is checked separately on the quote.');
      setRefresh(value => value + 1);
      restoreCreatedQuote(receipt);
    } catch (failure) { setError(errorMessage(failure)); }
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
    if (transactionLock.current || pending) return;
    transactionLock.current = true; setBusy(true); setError(''); setMessage('Checking the existing transaction. No wallet signature or payment is needed.');
    try {
      const receipt = await pendingReceipt(reader, recoveryHash.trim());
      if (!receipt) throw new Error('No receipt is available yet. Check this transaction in your wallet or explorer; do not create the quote again.');
      if (receipt.status !== 1) throw new Error('This transaction failed on-chain and did not create a quote.');
      if (!restoreCreatedQuote(receipt)) throw new Error('This transaction has no quote-creation event from the configured Settlio escrow. Use the creation hash, not a payment or approval hash.');
    } catch (failure) { setMessage(''); setError(errorMessage(failure)); }
    finally { transactionLock.current = false; setBusy(false); }
  }
  function stopTracking() {
    setPending(''); setUnresolved(false);
    try { localStorage.removeItem(pendingKey()); } catch {}
    setMessage('Local tracking stopped. This does not cancel the transaction. Check your wallet and quote before submitting another action.');
  }
  return <div className="app">
    {!quoteParam && <aside className="sidebar"><a className="wordmark" href={location.pathname} onClick={event => { event.preventDefault(); navigate(''); }}>Settlio</a>
      <nav aria-label="Workspace"><button className={!creating ? 'selected' : ''} onClick={() => navigate('')}>Quotes</button><button className={creating ? 'selected' : ''} onClick={() => navigate('?screen=new')}>Create quote</button></nav>
      <div className="sidebar-note">Your quotes.<br/>A clearer way to book work.</div><span className="test-badge">Base Sepolia testnet</span>
    </aside>}
    <main className={quoteParam ? 'customer-main' : ''}>
      <header className="topbar"><span>{quoteParam ? 'Settlio / Shared quote' : 'Your workspace'}</span><button className="secondary" disabled={busy} onClick={connect}>{account ? short(account) : 'Connect wallet'}</button></header>
      {!configured && <section className="setup" aria-label="Deployment setup"><strong>Deployment setup is pending</strong><p>The screens are ready to connect. A verified Base Sepolia escrow address is required to create, read, or pay quotes.</p><p>Set VITE_ESCROW_ADDRESS after deployment. Payments are disabled until then.</p></section>}
      {pauseReceiptCheck && <p className="notice" role="status"><strong>Development receipt recovery check</strong><br/>This development mode pauses receipt processing after quote creation. It does not pause the blockchain or send a deposit. Only create a quote when a new test has been arranged.</p>}
      {pauseReceiptCheck && configured && !pending && <p className="notice" role="status"><strong>No saved transaction to check</strong><br/>There is no valid saved transaction for this escrow in this browser. The Check saved transaction button appears only while one is saved. Opening a quote or viewing its contract does not create a saved transaction. To reopen a known quote, use Recover a created quote below; do not create another quote just to find a button.</p>}
      <div className="build-note">Test funds only. This build covers quote, deposit, and confirmation. Automatic refunds and expiry processing are still being integrated.</div>
      {pending && <section className="notice" role="status"><strong>Your saved transaction is ready to check</strong><p>Use the button below to read its result. No wallet signature or new transaction is needed. Creating another quote or payment is paused until this check is resolved.</p><a href={explorer + '/tx/' + pending} target="_blank" rel="noreferrer">View pending transaction</a><button className="secondary wide" disabled={busy} onClick={() => void checkPending()}>Check saved transaction</button>{unresolved && <><p>Stopping local tracking does not cancel or undo a transaction. Use this only after checking its status in your wallet and explorer.</p><button className="secondary wide" disabled={busy} onClick={stopTracking}>Stop local tracking</button></>}</section>}
      {configured && !pending && <details className="recovery"><summary>Recover a created quote</summary><p className="helper">Paste the quote-creation transaction hash to reopen the existing quote. This only reads its receipt and never creates a second quote or sends a payment.</p><form onSubmit={recoverCreatedQuote}><fieldset disabled={busy}><label>Quote-creation transaction hash<input value={recoveryHash} onChange={event => setRecoveryHash(event.target.value)} placeholder="0x…" autoComplete="off" required pattern="0x[a-fA-F0-9]{64}"/></label><button className="secondary" type="submit">Find existing quote</button></fieldset></form></details>}
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="notice">{message}</p>}
      {transaction && <a className="tx-link" href={explorer + '/tx/' + transaction} target="_blank" rel="noreferrer">View submitted transaction</a>}
      {quoteParam ? quoteId ? <QuoteView key={route} id={quoteId} account={account} busy={busy || !!pending} refresh={refresh} transact={transact} connect={connect}/> : <section><h1>Invalid quote link</h1><p>Ask the merchant to send the complete quote link.</p></section> :
      creating ? <CreateQuote account={account} busy={busy || !!pending} transact={transact} navigate={navigate} connect={connect}/> :
      <QuoteList account={account} refresh={refresh} navigate={navigate} connect={connect}/>}
      <footer>Settlio · Quotes and bookings · <a href="https://github.com/0xaje/Settlio" target="_blank" rel="noreferrer">View source</a></footer>
    </main>
  </div>;
}
type Transact = (send: () => Promise<TransactionResponse>, after?: (receipt: TransactionReceipt) => void) => Promise<void>;

function QuoteList({ account, refresh, navigate, connect }: { account: string; refresh: number; navigate: (route: string) => void; connect: () => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0n);
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
  return <section>
    <div className="page-heading"><div><p className="eyebrow">A place for every quote</p><h1>Quotes</h1><p>See who has paid and which bookings need your attention.</p></div><button className="primary" onClick={() => navigate('?screen=new')}>New quote</button></div>
    <div className="list-panel">
      <div className="list-header"><h2>Your recent quotes</h2><span>Newest first</span></div>
      {!account ? <div className="empty"><h2>Start with your first quote</h2><p>Connect your wallet to see the quotes you have created.</p><button className="primary" onClick={connect}>Connect wallet</button></div> :
      !configured ? <div className="empty"><h2>Waiting for deployment</h2><p>Your quote history will appear here once the escrow is configured.</p></div> :
      loading ? <p role="status" className="empty">Reading your quote history…</p> :
      error ? <p role="alert" className="error">{error}</p> :
      <><div className="mobile-quotes" aria-label="Your quotes">{quotes.map(quote => <article className="mobile-quote" key={quote.id.toString()}><div className="mobile-quote-heading"><h3>Quote #{quote.id.toString()}</h3><span className={'status status-' + quote.status}>{statuses[quote.status]}</span></div><dl><dt>Customer</dt><dd className="address">{quote.customer}</dd><dt>Deposit</dt><dd>{quote.status === 1 ? 'Customer chooses' : amount(quote.deposit, quote.asset)}</dd><dt>Payment deadline</dt><dd>{date(quote.expiresAt)}</dd></dl><button className="secondary wide" onClick={() => openQuote(quote)}>Open quote #{quote.id.toString()}</button></article>)}</div><div className="table-scroll quote-table"><table><thead><tr><th>Quote / Customer</th><th>Deposit</th><th>Status</th><th>Payment deadline</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>
      {quotes.map(quote => <tr key={quote.id.toString()}><td><strong>Quote #{quote.id.toString()}</strong><small>{short(quote.customer)}</small></td><td>{quote.status === 1 ? 'Customer chooses' : amount(quote.deposit, quote.asset)}</td><td><span className={'status status-' + quote.status}>{statuses[quote.status]}</span></td><td>{date(quote.expiresAt)}</td><td><button className="text-button" onClick={() => openQuote(quote)}>Open quote</button></td></tr>)}
      </tbody></table></div>{!quotes.length && <div className="empty">No quotes created by this wallet in this range. Connect the merchant wallet to see its quotes.</div>}
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
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setValidation('');
    const form = new FormData(event.currentTarget);
    try {
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
      const terms: Terms = { version: 2, options, service: service.trim(), description: description.trim(), merchant: getAddress(account), customer, total: totalWei.toString(), deposit: depositWei.toString(), expiresAt, refundCutoff };
      try { localStorage.setItem(draftKey(termsHash(terms)), encodeTerms(terms)); } catch { /* Existing share-link flow still works without local storage. */ }
      await transact(async () => {
        const contract = await walletContract(account);
        return contract.createQuoteWithOptions(customer, options, expiresAt, refundCutoff, termsHash(terms));
      }, receipt => {
        // The creation receipt is the authority for the ID, not the current counter.
        const id = createdQuoteId(receipt);
        try { localStorage.setItem(cacheKey(id), encodeTerms(terms)); } catch { /* The share URL carries the terms when local storage is unavailable. */ }
        navigate('?quote=' + id + '#terms=' + encodeTerms(terms));
      });
    } catch (failure) { setValidation(errorMessage(failure)); }
  }
  return <section><div className="page-heading"><div><p className="eyebrow">Make the details clear</p><h1>Create quote</h1><p>Set the price and terms, then share one link with your customer.</p></div></div>
    {!account && <button className="primary" onClick={connect}>Connect wallet to create</button>}
    <div className="editor-layout"><form className="form-panel" onSubmit={submit}><fieldset disabled={busy}>
      <label>Customer wallet<input name="customer" required placeholder="0x…" autoComplete="off"/></label>
      <label>Service<input name="service" required maxLength={120} value={service} onChange={event => setService(event.target.value)} placeholder="What are you booking?"/></label>
      <label>Description<textarea maxLength={2000} rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe the work included."/></label>
      <div className="field-row"><label>Total · test ETH<input required inputMode="decimal" value={total} onChange={event => setTotal(event.target.value)}/></label><label>Deposit · test ETH<input required inputMode="decimal" value={deposit} onChange={event => setDeposit(event.target.value)}/></label></div>
      <label><span><input type="checkbox" checked={usdc} onChange={event => setUsdc(event.target.checked)}/> Also accept test USDC</span></label>
      {usdc && <div className="field-row"><label>Total · test USDC<input required inputMode="decimal" value={usdcTotal} onChange={event => setUsdcTotal(event.target.value)}/></label><label>Deposit · test USDC<input required inputMode="decimal" value={usdcDeposit} onChange={event => setUsdcDeposit(event.target.value)}/></label></div>}
      <p className="helper">Set a separate price for each currency. There is no automatic conversion. USDT · Coming soon. It is not available for quotes or payments yet.</p>
      <label>Payment deadline<input name="expiry" type="datetime-local" required/></label>
      <label>Full-refund cutoff<input name="cutoff" type="datetime-local" required/></label>
      <p className="helper">Dates use your local time zone. The customer must cancel before the cutoff for a full deposit refund. These terms are fixed when you create the quote.</p>
      <p className="helper">The share link contains your service description. Anyone with that link can read it. Avoid personal or confidential information.</p>
      {validation && <p role="alert" className="error">{validation}</p>}
      <button className="primary wide" type="submit" disabled={!account || !configured}>{busy ? 'Waiting for transaction…' : 'Create share link'}</button>
    </fieldset></form><aside className="preview"><span className="eyebrow">Customer preview</span><h2>{service || 'Your service'}</h2><p>{description || 'Your service details will appear here.'}</p><div className="preview-amount"><span>Deposit due today</span><strong>{deposit || '—'} <small>test ETH</small></strong></div><p>Total {total || '—'} test ETH</p>{usdc && <p>Or deposit {usdcDeposit || '—'} of {usdcTotal || '—'} test USDC</p>}<p className="helper">Payment confirms the deposit first. The booking is confirmed after Reactive delivers its callback.</p></aside></div>
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
  const [allowance, setAllowance] = useState(0n);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const sequence = useRef(0);
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
        if (active && current === sequence.current) { setQuote(value); setError(''); }
      } catch (failure) { if (active && current === sequence.current) { setQuote(null); setError(errorMessage(failure)); } }
    }
    void load();
    const timer = setInterval(() => { setNow(Math.floor(Date.now() / 1000)); void load(); }, 10000);
    return () => { active = false; sequence.current++; clearInterval(timer); };
  }, [id, refresh]);
  useEffect(() => {
    let active = true;
    setAllowance(0n);
    const option = quote?.options?.[selected];
    if (account && option && option.asset !== ZeroAddress && knownAsset(option.asset)) {
      void readContract().then(contract => new Contract(option.asset, ['function allowance(address,address) view returns(uint256)'], contract.runner).allowance(account, escrowAddress))
        .then(value => { if (active) setAllowance(BigInt(value)); }).catch(() => {});
    }
    return () => { active = false; };
  }, [quote, selected, account, refresh]);
  if (error) return <section><h1>Quote unavailable</h1><p role="alert" className="error">{error}</p><p>Refresh this page to retry the connection.</p></section>;
  if (!quote) return <section><h1>Quote #{id.toString()}</h1><p role="status">{configured ? 'Reading quote…' : 'Waiting for deployment setup.'}</p></section>;
  const choice = quote.options?.[quote.status === 1 ? selected : quote.selectedOption ?? 0];
  const asset = choice?.asset ?? quote.asset ?? ZeroAddress;
  const deposit = choice ? BigInt(choice.deposit) : quote.deposit;
  const total = choice ? BigInt(choice.total) : quote.total;
  const supported = !!knownAsset(asset);
  const needsApproval = asset !== ZeroAddress && allowance < deposit;
  const verified = terms !== null && matchesQuote(terms, quote);
  const customer = account && getAddress(account) === getAddress(quote.customer);
  const participant = account && (customer || getAddress(account) === getAddress(quote.merchant));
  const expired = BigInt(now) >= quote.expiresAt;
  async function copy() {
    try { await navigator.clipboard.writeText(shareLink(id, terms!)); setCopied(true); }
    catch { setCopyError('Copy failed. Select and copy the full link from your browser address bar.'); }
  }
  return <article className="quote-document">
    <div className="document-header"><a className="wordmark" href={location.pathname}>Settlio</a><span className={'status status-' + quote.status}>{quote.status === 1 && expired ? 'Payment deadline passed' : statuses[quote.status]}</span></div>
    <p className="eyebrow">Quote #{id.toString()}</p><h1>{verified ? terms.service : 'Service quote'}</h1>
    <p className="address">From {quote.merchant}</p><p className="address">For {quote.customer}</p>
    {!verified && <p role="alert" className="error">The service terms are missing or do not match this quote. Ask the merchant for the complete original share link. Payment is disabled.</p>}
    {quote.status === 3 && <div className="confirmation"><h2>Booking confirmed</h2><p>Your deposit was received and the booking confirmation is recorded on-chain.</p></div>}
    {quote.status === 2 && <div className="notice"><strong>Deposit received · confirming booking</strong><p>This page checks for confirmation every ten seconds. If delivery stalls, a participant can request it again below.</p></div>}
    <div className="quote-columns"><div><h2>Service details</h2><p className="description">{verified ? terms.description || terms.service : 'Waiting for verified service terms.'}</p>
      <h2>Payment and cancellation</h2><dl><dt>Pay before</dt><dd>{date(quote.expiresAt)}</dd><dt>Cancel before for a full deposit refund</dt><dd>{date(quote.refundCutoff)}</dd></dl>
      <p className="helper">Refund routing is still being integrated. The deposit is held in escrow through the refund period. Remaining-balance collection is not enabled in this build.</p>
      <details><summary>Contract details</summary><p className="address">Terms fingerprint {quote.termsHash}</p><a href={explorer + '/address/' + escrowAddress} target="_blank" rel="noreferrer">View escrow on Base Sepolia</a></details>
    </div><aside className="payment-summary"><span>{quote.status >= 2 && quote.status !== 6 ? 'Deposit amount' : 'Deposit due today'}</span>{quote.status === 1 && <label>Payment currency<select value={selected} disabled={busy} onChange={event => setSelected(Number(event.target.value))}>{quote.options?.map((option, index) => <option key={option.asset} value={index}>{knownAsset(option.asset)?.symbol ?? 'Unverified token'}</option>)}<option value="usdt-coming-soon" disabled>USDT — Coming soon</option></select></label>}
      {!supported && <p role="alert" className="error">This token is not verified for this interface. Payment is disabled.</p>}
      <strong>{amount(deposit, asset)}</strong><dl><dt>Total</dt><dd>{amount(total, asset)}</dd><dt>Remaining balance</dt><dd>{amount(total - deposit, asset)}</dd></dl>
      {quote.status === 1 && !expired && (!account ? <button className="primary wide" onClick={connect}>Connect wallet</button> :
      <><p className="helper">Paying accepts the service terms and refund cutoff above.</p>{needsApproval ? <><p className="helper">First approve only this deposit amount. Then return here to pay. Approval alone does not pay your deposit. Test ETH is still needed for gas.</p><button className="primary wide" disabled={busy || !customer || !verified || !supported} onClick={() => void transact(async () => {
        const contract = await walletContract(account);
        const token = new Contract(asset, ['function approve(address,uint256) returns(bool)'], contract.runner);
        return token.approve(escrowAddress, allowance > 0n ? 0n : deposit);
      })}>{allowance > 0n ? 'Reset previous approval' : 'Approve deposit amount'}</button></> :
      <button className="primary wide" disabled={busy || !customer || !verified || !supported} onClick={() => void transact(async () => (await walletContract(account)).payDepositOption(id, selected, quote.termsHash, { value: asset === ZeroAddress ? deposit : 0n }))}>Accept terms & pay deposit</button>}{!customer && <p className="helper">Connect the customer wallet shown on this quote to pay.</p>}</>)}
      {quote.status === 2 && participant && <button className="secondary wide" disabled={busy} onClick={() => void transact(async () => (await walletContract(account)).requestConfirmation(id))}>Request confirmation again</button>}
      {verified && <button className="secondary wide" onClick={() => void copy()}>{copied ? 'Link copied' : 'Copy quote link'}</button>}{copyError && <p role="alert" className="error">{copyError}</p>}
    </aside></div>
  </article>;
}

createRoot(document.getElementById('root')!).render(<App/>);
