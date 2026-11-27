import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillTransfer,
  faWallet,
  faCircleCheck,
  faClock,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { settlementService } from '../../services/endpoints/settlementService';
import { toastService } from '../../components/feedback/toastService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatDateTimeDhaka } from '../../utils/formatters';

export const OrganizerEarningsPage = () => {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState('BKASH');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [requesting, setRequesting] = useState(false);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await settlementService.getMyLedger();
      setLedger(res.data || {});
    } catch (err) {
      toastService.error(err?.message || 'Unable to load organizer earnings ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleRequestSettlement = async (e) => {
    e.preventDefault();
    if (!payoutAccount.trim()) {
      toastService.error('Enter your bKash, Nagad, or Bank account details.');
      return;
    }
    setRequesting(true);
    try {
      const res = await settlementService.requestSettlement({
        payoutMethod,
        payoutAccount: payoutAccount.trim(),
        notes: notes.trim() || undefined,
      });
      toastService.success(res.message);
      setPayoutAccount('');
      setNotes('');
      await loadLedger();
    } catch (err) {
      toastService.error(err?.message || 'Failed to submit settlement request.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading organizer earnings & settlements..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 pb-10">
      <header className="border-b border-light-border dark:border-dark-border pb-4">
        <h1 className="font-headline text-headline-lg font-bold flex items-center gap-2.5">
          <FontAwesomeIcon icon={faWallet} className="text-primary" />
          <span>Organizer Earnings &amp; Payout Settlements</span>
        </h1>
        <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
          Track online match, tournament, and ticket earnings. Platform commission ({ledger?.platformFeePercent ?? 10}%) is automatically deducted upon settlement.
        </p>
      </header>

      {/* KPI Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Total Online Gross
          </span>
          <p className="font-headline text-xl font-bold tabular-nums mt-1">
            BDT {Number(ledger?.grossEarned || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Unsettled Gross ({ledger?.unsettledCount ?? 0} tx)
          </span>
          <p className="font-headline text-xl font-bold tabular-nums mt-1 text-primary">
            BDT {Number(ledger?.unsettledGross || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Platform Fee ({ledger?.platformFeePercent ?? 10}%)
          </span>
          <p className="font-headline text-xl font-bold tabular-nums mt-1 text-warning">
            - BDT {Number(ledger?.estimatedPlatformFee || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-success/50">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Available Net Payout
          </span>
          <p className="font-headline text-xl font-bold tabular-nums mt-1 text-success">
            BDT {Number(ledger?.availableNetPayout || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border col-span-2 lg:col-span-1">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Already Settled
          </span>
          <p className="font-headline text-xl font-bold tabular-nums mt-1">
            BDT {Number(ledger?.settledNetTotal || 0).toLocaleString()}
          </p>
          {Number(ledger?.pendingNetTotal || 0) > 0 && (
            <p className="text-[11px] text-warning mt-0.5 tabular-nums">
              Pending review: BDT {Number(ledger.pendingNetTotal).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Request Settlement Form */}
        <form
          onSubmit={handleRequestSettlement}
          className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3.5"
        >
          <h2 className="font-headline font-bold text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faMoneyBillTransfer} className="text-primary" />
            <span>Request Settlement Payout</span>
          </h2>
          <p className="font-body text-xs text-light-muted dark:text-dark-muted">
            Admin settles verified online earnings directly to your account after deducting the {ledger?.platformFeePercent ?? 10}% platform fee.
          </p>

          <label className="flex flex-col gap-1">
            <span className="font-label text-xs font-semibold">Payout Channel</span>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs sm:text-sm"
            >
              <option value="BKASH">bKash Personal / Merchant</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-xs font-semibold">Account Number / Details</span>
            <input
              type="text"
              required
              value={payoutAccount}
              onChange={(e) => setPayoutAccount(e.target.value)}
              placeholder="e.g. 017XXXXXXXX or Bank A/C & Routing"
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs sm:text-sm font-mono"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-xs font-semibold">Notes (Optional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any instructions for Admin payout desk..."
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs sm:text-sm"
            />
          </label>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={requesting}
            disabled={Number(ledger?.unsettledGross || 0) <= 0}
          >
            Request BDT {Number(ledger?.availableNetPayout || 0).toLocaleString()} Payout
          </Button>
        </form>

        {/* Settlement History */}
        <section className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
          <h2 className="font-headline font-bold text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faReceipt} className="text-secondary" />
            <span>Payout &amp; Settlement History</span>
          </h2>

          {!ledger?.settlements || ledger.settlements.length === 0 ? (
            <p className="text-xs text-light-muted dark:text-dark-muted py-4">
              No settlement payouts requested or processed yet.
            </p>
          ) : (
            <div className="divide-y divide-light-border dark:divide-dark-border">
              {ledger.settlements.map((s) => (
                <div key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-headline text-sm text-primary">
                        BDT {Number(s.netPayoutAmount).toLocaleString()} Net
                      </strong>
                      <Badge
                        variant={
                          s.status === 'SETTLED'
                            ? 'success'
                            : s.status === 'REJECTED'
                              ? 'error'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-light-muted dark:text-dark-muted mt-0.5 tabular-nums">
                      Gross BDT {s.grossAmount} • Fee ({s.platformFeePercent}%): -BDT {s.platformFeeAmount} •{' '}
                      {s.payoutMethod} ({s.payoutAccount})
                    </p>
                    {s.referenceNo && (
                      <p className="font-mono text-[11px] text-success mt-0.5">
                        Ref: {s.referenceNo}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-light-muted dark:text-dark-muted">
                    {formatDateTimeDhaka(s.settledAt || s.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Validated Online Transactions */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
        <h2 className="font-headline font-bold text-base">
          Validated Online Transactions ({ledger?.transactions?.length || 0})
        </h2>
        {!ledger?.transactions || ledger.transactions.length === 0 ? (
          <p className="text-xs text-light-muted dark:text-dark-muted py-3">
            No validated online SSLCommerz transactions recorded for your matches or tournaments yet.
          </p>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {ledger.transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-primary mr-2">{tx.tranId}</span>
                  <strong>{tx.customerName}</strong> ({tx.purpose})
                </div>
                <div className="flex items-center gap-3">
                  <strong className="tabular-nums">BDT {tx.amount}</strong>
                  <span
                    className={`px-2 py-0.5 rounded font-label text-[10px] font-semibold inline-flex items-center gap-1 ${
                      tx.settlementId
                        ? 'bg-success/15 text-success'
                        : 'bg-warning/15 text-warning'
                    }`}
                  >
                    <FontAwesomeIcon icon={tx.settlementId ? faCircleCheck : faClock} />
                    <span>{tx.settlementId ? 'Included in Settlement' : 'Unsettled'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizerEarningsPage;
