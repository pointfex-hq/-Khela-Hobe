import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleXmark,
  faTriangleExclamation,
  faArrowRight,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { paymentService } from '../../services/endpoints/paymentService';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDateTimeDhaka } from '../../utils/formatters';

export const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const tranId = searchParams.get('tranId') || '';
  const queryStatus = (searchParams.get('status') || '').toLowerCase();

  const [loading, setLoading] = useState(Boolean(tranId));
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tranId) {
      setLoading(false);
      return;
    }

    let active = true;
    paymentService
      .getPaymentStatus(tranId)
      .then((res) => {
        if (active && res?.data) {
          setPayment(res.data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || 'Unable to load payment details.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tranId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 flex justify-center">
        <LoadingSpinner size="lg" message="Verifying SSLCommerz transaction..." />
      </div>
    );
  }

  const effectiveStatus = payment?.status
    ? payment.status.toLowerCase()
    : queryStatus || 'failed';

  const isSuccess = effectiveStatus === 'validated' || effectiveStatus === 'success';
  const isCancelled = effectiveStatus === 'cancelled';

  const matchTarget =
    payment?.purpose === 'MATCH_FEE' && payment?.referenceId
      ? ROUTES.MATCH_DETAILS.replace(':matchId', payment.referenceId)
      : ROUTES.EXPLORE_MATCHES;

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 w-full">
      <section className="rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 shadow-sm flex flex-col items-center text-center gap-5">
        <span
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isSuccess
              ? 'bg-success/15 text-success'
              : isCancelled
              ? 'bg-warning/15 text-warning'
              : 'bg-error/15 text-error'
          }`}
        >
          <FontAwesomeIcon
            icon={
              isSuccess
                ? faCircleCheck
                : isCancelled
                ? faTriangleExclamation
                : faCircleXmark
            }
            className="text-3xl"
          />
        </span>

        <div className="flex flex-col gap-1.5">
          <h1 className="font-headline text-2xl font-bold text-light-on-surface dark:text-dark-on-surface">
            {isSuccess
              ? 'Payment Successful'
              : isCancelled
              ? 'Payment Cancelled'
              : 'Payment Failed'}
          </h1>
          <p className="font-body text-sm text-light-muted dark:text-dark-muted max-w-md">
            {isSuccess
              ? 'Your SSLCommerz payment has been verified and recorded.'
              : isCancelled
              ? 'You cancelled the checkout session before completing payment.'
              : error || 'The transaction could not be completed or verified.'}
          </p>
        </div>

        {payment && (
          <div className="w-full rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border p-4 text-left flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-2 font-label font-semibold text-light-on-surface dark:text-dark-on-surface pb-2 border-b border-light-border dark:border-dark-border">
              <FontAwesomeIcon icon={faReceipt} className="text-primary" />
              <span>Transaction Summary</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-light-muted dark:text-dark-muted">Transaction ID</span>
              <span className="font-mono font-semibold">{payment.tranId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-light-muted dark:text-dark-muted">Amount</span>
              <span className="font-mono font-bold text-primary">
                {payment.currency} {Number(payment.amount || 0).toFixed(2)}
              </span>
            </div>
            {payment.cardType && (
              <div className="flex justify-between gap-4">
                <span className="text-light-muted dark:text-dark-muted">Payment Method</span>
                <span className="font-medium">{payment.cardType}</span>
              </div>
            )}
            {payment.bankTranId && (
              <div className="flex justify-between gap-4">
                <span className="text-light-muted dark:text-dark-muted">Bank Ref</span>
                <span className="font-mono">{payment.bankTranId}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-light-muted dark:text-dark-muted">Status</span>
              <span className="font-semibold uppercase">{payment.status}</span>
            </div>
            {payment.paidAt && (
              <div className="flex justify-between gap-4">
                <span className="text-light-muted dark:text-dark-muted">Paid At</span>
                <span>{formatDateTimeDhaka(payment.paidAt)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
          <Link to={matchTarget}>
            <Button variant="primary" size="md" icon={faArrowRight} iconPosition="right">
              {payment?.purpose === 'MATCH_FEE' && payment?.referenceId
                ? 'Back to Match'
                : 'Explore Matches'}
            </Button>
          </Link>
          <Link to={ROUTES.PLAYER_DASHBOARD}>
            <Button variant="outline" size="md">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PaymentStatusPage;
