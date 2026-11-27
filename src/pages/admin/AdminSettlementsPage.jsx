import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillTransfer,
  faCircleCheck,
  faXmark,
  faBuildingColumns,
} from '@fortawesome/free-solid-svg-icons';
import { settlementService } from '../../services/endpoints/settlementService';
import { toastService } from '../../components/feedback/toastService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Modal from '../../components/modals/Modal';
import Button from '../../components/common/Button';
import { formatDateTimeDhaka } from '../../utils/formatters';

export const AdminSettlementsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Settle modal (both existing requests or direct settle)
  const [modalState, setModalState] = useState(null); // { mode: 'existing' | 'direct', item }
  const [feePercent, setFeePercent] = useState(10);
  const [payoutMethod, setPayoutMethod] = useState('BKASH');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await settlementService.adminGetSettlements();
      setData(res.data || {});
    } catch (err) {
      toastService.error(err?.message || 'Failed to load settlements console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSettleModal = (mode, item) => {
    setModalState({ mode, item });
    setFeePercent(item.platformFeePercent ?? data?.defaultPlatformFeePercent ?? 10);
    setPayoutMethod(item.payoutMethod || 'BKASH');
    setPayoutAccount(item.payoutAccount || item.phoneNumber || '');
    setReferenceNo(item.referenceNo || '');
    setNotes(item.notes || '');
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!modalState) return;
    const rate = Math.max(0, Math.min(0.5, Number(feePercent) / 100));
    setBusyId(modalState.item.id || modalState.item.organizerId);

    try {
      if (modalState.mode === 'existing') {
        const res = await settlementService.adminUpdateSettlement(modalState.item.id, {
          status: 'SETTLED',
          platformFeeRate: rate,
          referenceNo: referenceNo.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toastService.success(res.message);
      } else {
        const res = await settlementService.adminSettleDirect({
          organizerId: modalState.item.organizerId,
          platformFeeRate: rate,
          payoutMethod,
          payoutAccount: payoutAccount.trim() || 'Manual Settlement Desk',
          referenceNo: referenceNo.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toastService.success(res.message);
      }
      setModalState(null);
      await loadData();
    } catch (err) {
      toastService.error(err?.message || 'Settlement failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (settlement) => {
    setBusyId(settlement.id);
    try {
      const res = await settlementService.adminUpdateSettlement(settlement.id, {
        status: 'REJECTED',
        notes: 'Rejected by Admin payout desk; funds returned to unsettled ledger.',
      });
      toastService.success(res.message);
      await loadData();
    } catch (err) {
      toastService.error(err?.message || 'Could not reject settlement.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading platform settlements & commissions..." />
      </div>
    );
  }

  const totals = data?.totals || {};
  const balances = data?.organizerBalances || [];
  const settlements = data?.settlements || [];

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 pb-12">
      <header className="border-b border-light-border dark:border-dark-border pb-4">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <FontAwesomeIcon icon={faMoneyBillTransfer} className="text-primary" />
          <span>Organizer Settlements &amp; Platform Fees</span>
        </h1>
        <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
          Audit organizer online earnings, deduct platform commission ({data?.defaultPlatformFeePercent ?? 10}% default), and settle organizer payouts.
        </p>
      </header>

      {/* Summary KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-primary/40">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Platform Fees Collected
          </span>
          <p className="font-headline text-xl font-bold tabular-nums text-primary mt-1">
            BDT {Number(totals.totalPlatformFeesCollected || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-success/40">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Net Settled to Organizers
          </span>
          <p className="font-headline text-xl font-bold tabular-nums text-success mt-1">
            BDT {Number(totals.totalNetSettledToOrganizers || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Unsettled Organizer Gross
          </span>
          <p className="font-headline text-xl font-bold tabular-nums mt-1">
            BDT {Number(totals.totalUnsettledGross || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-warning/40">
          <span className="font-label text-[11px] uppercase text-light-muted dark:text-dark-muted block">
            Pending Payout Requests
          </span>
          <p className="font-headline text-xl font-bold tabular-nums text-warning mt-1">
            {totals.pendingRequestsCount || 0}
          </p>
        </div>
      </section>

      {/* Organizers With Online Balances */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faBuildingColumns} className="text-secondary" />
          <span>Organizer Online Earnings Ledgers</span>
        </h2>

        {balances.length === 0 ? (
          <p className="text-xs text-light-muted dark:text-dark-muted">No verified organizers found.</p>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {balances.map((b) => (
              <div key={b.organizerId} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-sm">{b.name}</strong>{' '}
                  <span className="font-mono text-light-muted dark:text-dark-muted">({b.email})</span>
                  <p className="text-light-muted dark:text-dark-muted mt-0.5 tabular-nums">
                    Lifetime Gross: BDT {b.grossEarned} • Unsettled: <strong className="text-primary">BDT {b.unsettledGross}</strong> •
                    Est. Net Payout: <strong className="text-success">BDT {b.availableNetPayout}</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={b.unsettledGross <= 0 || busyId === b.organizerId}
                  onClick={() => openSettleModal('direct', b)}
                >
                  Settle Balance
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settlement Requests & Ledger */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-3">
        <h2 className="font-headline font-bold text-base">
          Settlement Requests &amp; Payout Ledger ({settlements.length})
        </h2>

        {settlements.length === 0 ? (
          <p className="text-xs text-light-muted dark:text-dark-muted py-3">
            No settlement records yet.
          </p>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {settlements.map((s) => (
              <div key={s.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{s.organizerName}</strong>
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
                    Gross: BDT {s.grossAmount} • Fee ({s.platformFeePercent}%): -BDT {s.platformFeeAmount} •{' '}
                    <strong className="text-success">Net Payout: BDT {s.netPayoutAmount}</strong>
                  </p>
                  <p className="font-mono text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
                    {s.payoutMethod}: {s.payoutAccount}
                    {s.referenceNo ? ` • Ref: ${s.referenceNo}` : ''} • {formatDateTimeDhaka(s.createdAt)}
                  </p>
                </div>

                {(s.status === 'PENDING' || s.status === 'PROCESSING') && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={faCircleCheck}
                      disabled={busyId === s.id}
                      onClick={() => openSettleModal('existing', s)}
                    >
                      Approve &amp; Settle
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={faXmark}
                      disabled={busyId === s.id}
                      onClick={() => handleReject(s)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settle Payout Modal */}
      {modalState && (
        <Modal
          isOpen
          onClose={() => setModalState(null)}
          title={`Settle Payout — ${modalState.item.organizerName || modalState.item.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmSettle} className="flex flex-col gap-3.5 py-1 text-xs">
            <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border tabular-nums">
              {(() => {
                const gross =
                  modalState.mode === 'existing'
                    ? modalState.item.grossAmount
                    : modalState.item.unsettledGross;
                const feeAmt = Number(((gross * Number(feePercent || 0)) / 100).toFixed(2));
                const netAmt = Number((gross - feeAmt).toFixed(2));
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>Gross Online Earnings</span>
                      <strong>BDT {gross}</strong>
                    </div>
                    <div className="flex justify-between text-warning">
                      <span>Platform Fee ({feePercent}%)</span>
                      <strong>- BDT {feeAmt}</strong>
                    </div>
                    <div className="flex justify-between text-success text-sm pt-1 border-t border-light-border dark:border-dark-border">
                      <strong>Net Organizer Payout</strong>
                      <strong>BDT {netAmt}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <label className="flex flex-col gap-1">
              <span className="font-label font-semibold">Platform Commission Rate (%)</span>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                className="px-3 py-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border"
              />
            </label>

            {modalState.mode === 'direct' && (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="font-label font-semibold">Method</span>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="px-3 py-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border"
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-label font-semibold">Account</span>
                  <input
                    type="text"
                    required
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    placeholder="017..."
                    className="px-3 py-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono"
                  />
                </label>
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="font-label font-semibold">Transfer Reference / TrxID</span>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. BKASH-9X21K8"
                className="px-3 py-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-label font-semibold">Notes (Optional)</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalState(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={Boolean(busyId)}>
                Confirm Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminSettlementsPage;
