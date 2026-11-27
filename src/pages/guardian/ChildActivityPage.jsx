import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faShieldHalved,
  faCalendarCheck,
  faClock,
  faLocationDot,
  faCheckCircle,
  faLock,
  faUser,
  faHistory,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { childService } from '../../services/endpoints/childService';
import { ROUTES } from '../../constants/routes';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const ChildActivityPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activityData, setActivityData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadChildActivity = async () => {
      try {
        setLoading(true);
        const childrenRes = await childService.getLinkedChildren();
        const authorized = (childrenRes.data || []).filter(
          (c) => c.status === 'Authorized' || c.isVerified
        );
        if (!isMounted) return;
        setChildrenList(authorized);

        const currentChild =
          authorized.find((c) => c.id === childId) ||
          authorized[0] || {
            id: 'ch_ayan_15',
            name: 'Ayan Rahman',
            age: 15,
          };
        setSelectedChild(currentChild);

        const actRes = await childService.getChildActivity(currentChild.id);
        if (isMounted && actRes.success) {
          setActivityData(actRes.data);
        }
      } catch (err) {
        console.error('Failed to load child activity:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadChildActivity();
    return () => {
      isMounted = false;
    };
  }, [childId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading authorized match activity..." />
      </div>
    );
  }

  const upcomingMatches = activityData?.upcoming || (selectedChild?.nextActivity ? [selectedChild.nextActivity] : []);
  const activityHistory = activityData?.history || selectedChild?.activityHistory || [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={faArrowLeft}
            onClick={() => navigate(ROUTES.GUARDIAN_DASHBOARD)}
            aria-label="Back to Guardian Dashboard"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl sm:text-2xl text-light-on-background dark:text-dark-on-background">
                Child Activity — {selectedChild?.name || 'Arafat Hasan'}
              </h1>
            </div>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted flex items-center gap-1.5 mt-0.5">
              <FontAwesomeIcon icon={faLock} className="text-primary text-[10px]" />
              <span>Authorized Guardian View • Exact coordinates masked unless permitted</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-success text-on-success font-label text-xs font-semibold flex items-center gap-1.5 shrink-0">
            <FontAwesomeIcon icon={faCheckCircle} className="text-[11px]" />
            <span>Safety Status: Clear</span>
          </span>
        </div>
      </div>

      {/* Child Switcher if multiple authorized */}
      {childrenList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted shrink-0 mr-1">
            Linked Child:
          </span>
          {childrenList.map((ch) => (
            <button
              key={ch.id}
              onClick={() => navigate(`/guardian/children/${ch.id}/activity`)}
              className={`px-3 py-1.5 rounded-full text-xs font-label transition-colors shrink-0 flex items-center gap-1.5 ${
                ch.id === selectedChild?.id
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <FontAwesomeIcon icon={faUser} className="text-[10px]" />
              <span>{ch.name} (Age {ch.age})</span>
            </button>
          ))}
        </div>
      )}

      {/* Upcoming Authorized Matches Section */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarCheck} className="text-primary text-sm" />
            <h2 className="font-headline font-bold text-lg sm:text-xl text-light-on-surface dark:text-dark-on-surface">
              Upcoming Authorized Matches
            </h2>
          </div>
          <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
            {upcomingMatches.length} Scheduled
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {upcomingMatches.map((match, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <p className="font-title font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                  {match.title}
                </p>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-light-muted dark:text-dark-muted font-body">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-[10px] text-primary" />
                    <span>{match.date} • {match.time}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[10px] text-primary" />
                    <span>{match.venue}</span>
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-success text-on-success font-label text-xs font-semibold shrink-0 self-start sm:self-center">
                {match.status || 'Approved'}
              </span>
            </div>
          ))}

          {upcomingMatches.length === 0 && (
            <div className="p-6 text-center text-xs font-body text-light-muted dark:text-dark-muted border border-dashed border-light-border dark:border-dark-border rounded-md">
              No upcoming authorized matches found for this period.
            </div>
          )}
        </div>
      </section>

      {/* Authorized Activity History Section */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faHistory} className="text-primary text-sm" />
            <h2 className="font-headline font-bold text-lg sm:text-xl text-light-on-surface dark:text-dark-on-surface">
              Authorized Activity History
            </h2>
          </div>
          <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
            {activityHistory.length} Recorded
          </span>
        </div>

        <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
          {activityHistory.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <div>
                  <span className="font-body text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
                    {item.title}
                  </span>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                    {item.venue} • {item.status}
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs text-light-muted dark:text-dark-muted tabular-nums shrink-0 self-start sm:self-center">
                {item.date}
              </span>
            </div>
          ))}

          {activityHistory.length === 0 && (
            <div className="py-6 text-center text-xs font-body text-light-muted dark:text-dark-muted">
              No previous match activities recorded.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ChildActivityPage;
