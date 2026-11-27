import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faBolt,
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faTriangleExclamation,
  faCircleExclamation,
  faInfoCircle,
  faCalendarCheck,
  faUsers,
  faStar,
} from '@fortawesome/free-solid-svg-icons';

// Component Categories
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/forms/PasswordInput';
import Textarea from '../../components/forms/Textarea';
import Select from '../../components/forms/Select';
import Checkbox from '../../components/forms/Checkbox';
import Radio from '../../components/forms/Radio';
import Switch from '../../components/forms/Switch';
import FileUpload from '../../components/forms/FileUpload';
import FormField from '../../components/forms/FormField';

import MatchCard from '../../components/cards/MatchCard';
import PlayerCard from '../../components/cards/PlayerCard';
import OrganizerCard from '../../components/cards/OrganizerCard';
import EventCard from '../../components/cards/EventCard';
import StatisticCard from '../../components/cards/StatisticCard';

import Breadcrumbs from '../../components/navigation/Breadcrumb';
import Alert from '../../components/feedback/Alert';
import Modal from '../../components/modals/Modal';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Skeleton from '../../components/feedback/Skeleton';
import showToast from '../../components/feedback/toastService';

import Table from '../../components/tables/Table';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

import PageContainer from '../../components/layout/PageContainer';
import SectionContainer from '../../components/layout/SectionContainer';
import ResponsiveGrid from '../../components/layout/ResponsiveGrid';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import { ROLES } from '../../constants/roles';

const SHOWCASE_MATCHES = [
  {
    id: 'showcase-match-1',
    title: 'Floodlit 7v7 Turf Match',
    sport: 'Football',
    venue: 'Turf Arena',
    area: 'Dhaka',
    timeDisplay: '8:00 PM',
    filledSlots: 10,
    totalSlots: 14,
    joinMode: 'Open Join',
    fee: 200,
    organizer: { name: 'Organizer' },
  },
];

const SHOWCASE_PLAYER = {
  id: 'showcase-player',
  name: 'Athlete Sample',
  role: ROLES.PLAYER,
  area: 'Dhaka',
  skillLevel: 'Intermediate',
  matchesPlayed: 12,
  reputation: 98,
};

const SHOWCASE_ORGANIZER = {
  id: 'showcase-org',
  name: 'Organizer Sample',
  role: ROLES.ORGANIZER,
  area: 'Dhaka',
  matchesOrganized: 20,
  rating: 4.9,
};

export const ComponentShowcasePage = () => {
  const { isDark, toggleTheme } = useTheme();

  // Interactive States
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [radioSelected, setRadioSelected] = useState('option1');
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [currentPage, setCurrentPage] = useState(2);

  const sampleColumns = [
    { header: 'Match Title', accessor: 'title', render: (row) => <span className="font-semibold text-light-on-surface dark:text-dark-on-surface">{row.title}</span> },
    { header: 'Sport', accessor: 'sport' },
    { header: 'Venue', accessor: 'area' },
    { header: 'Slots', accessor: 'filledSlots', render: (row) => <Badge variant="primary" size="sm">{row.filledSlots} / {row.totalSlots}</Badge> },
    { header: 'Status', accessor: 'status', render: () => <Badge variant="success" size="sm" hasDot>Confirmed</Badge> },
  ];

  return (
    <PageContainer>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-light-border dark:border-dark-border">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-2">
            <span>Khela Hobe Design System</span>
          </div>
          <h1 className="heading-4 sm:heading-3 font-headline font-bold text-light-on-background dark:text-dark-on-background">
            Shared Component Library
          </h1>
          <p className="body-4 text-light-muted dark:text-dark-muted mt-1 max-w-2xl">
            Live interactive documentation for all 7 component categories across dark and light themes, responsive breakpoints, and interaction states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBtnLoading((prev) => !prev)}
          >
            Toggle Loading States: {btnLoading ? 'ON' : 'OFF'}
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col gap-16 py-8">
        {/* ========================================================================= */}
        {/* 1. BUTTONS */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-light-border dark:border-dark-border pb-3">
            <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              1. Buttons
            </h2>
            <p className="body-6 text-light-muted dark:text-dark-muted">
              Primary, secondary, outline, danger, icon-only, and loading states with 120ms transitions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="md" isLoading={btnLoading}>
              Primary Button
            </Button>
            <Button variant="secondary" size="md" isLoading={btnLoading}>
              Secondary Button
            </Button>
            <Button variant="outline" size="md" isLoading={btnLoading}>
              Outline Button
            </Button>
            <Button variant="danger" size="md" isLoading={btnLoading}>
              Danger Button
            </Button>
            <Button variant="tertiary" size="md" isLoading={btnLoading}>
              Tertiary Button
            </Button>
            <Button variant="primary" size="md" disabled>
              Disabled State
            </Button>
          </div>

          {/* Icon Buttons & Sizes */}
          <div className="flex flex-col gap-3">
            <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
              Sizes and Icon Buttons
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" size="sm" icon={faPlus}>
                Small Button
              </Button>
              <Button variant="primary" size="md" icon={faBolt}>
                Medium Button
              </Button>
              <Button variant="primary" size="lg" icon={faCalendarCheck}>
                Large Button
              </Button>

              {/* Standalone Icon Buttons */}
              <Button variant="outline" size="sm" icon={faEdit} ariaLabel="Edit entry" />
              <Button variant="outline" size="md" icon={faTrash} ariaLabel="Delete entry" />
              <Button variant="primary" size="md" icon={faFutbol} ariaLabel="Football action" />
              <Button variant="tertiary" size="lg" icon={faBolt} ariaLabel="Quick action" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. FORMS */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-light-border dark:border-dark-border pb-3">
            <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              2. Form Controls
            </h2>
            <p className="body-6 text-light-muted dark:text-dark-muted">
              Input, password, textarea, select, checkbox, radio, switch, and file upload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <Input
              label="Standard Text Input"
              placeholder="e.g. Banani Futsal Arena"
              helperText="Helper message explaining the input requirements."
            />

            <PasswordInput
              label="Password Input"
              placeholder="Enter secure password"
              helperText="Includes visibility toggle button."
            />

            <Select
              label="Select Dropdown"
              options={[
                { value: 'football', label: 'Football & Futsal' },
                { value: 'badminton', label: 'Badminton' },
                { value: 'cricket', label: 'Cricket' },
              ]}
              helperText="Styled native select with theme tokens."
            />

            <Input
              label="Error State Input"
              value="invalid-format@"
              readOnly
              error="Please enter a valid email address."
            />

            <div className="flex flex-col gap-3">
              <span className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background">
                Checkboxes & Switches
              </span>
              <div className="p-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-3">
                <Checkbox
                  label="Receive match updates via SMS"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                />
                <Checkbox
                  label="Pledge to bring match equipment"
                  defaultChecked={false}
                />
                <div className="border-t border-light-border dark:border-dark-border pt-2">
                  <Switch
                    label="Guardian Supervision"
                    sublabel="Require consent for minor matches"
                    checked={switchChecked}
                    onChange={setSwitchChecked}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background">
                Radio Buttons
              </span>
              <div className="flex flex-col gap-2">
                <Radio
                  name="demoRadio"
                  value="option1"
                  label="Open Join Mode"
                  sublabel="Any player can reserve an available slot instantly."
                  checked={radioSelected === 'option1'}
                  onChange={() => setRadioSelected('option1')}
                />
                <Radio
                  name="demoRadio"
                  value="option2"
                  label="Approval Required"
                  sublabel="Organizer reviews each applicant before confirmation."
                  checked={radioSelected === 'option2'}
                  onChange={() => setRadioSelected('option2')}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Match Description Textarea"
                placeholder="Share pitch conditions, equipment notes, or rules..."
                maxLength={200}
                rows={3}
                helperText="Characters counted automatically."
              />
            </div>

            <div>
              <FileUpload
                label="File Upload Component"
                helperText="PNG, JPG, or PDF up to 10MB"
                onFileSelect={(file) => console.log('File selected:', file)}
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CARDS */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-light-border dark:border-dark-border pb-3">
            <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              3. Cards
            </h2>
            <p className="body-6 text-light-muted dark:text-dark-muted">
              Match card, player card, organizer card, event card, and statistic card.
            </p>
          </div>

          {/* Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatisticCard
              icon={faFutbol}
              value="842"
              label="Matches Completed"
              subtext="Across 4 cities"
              trend="+14% this month"
            />
            <StatisticCard
              icon={faUsers}
              value="1,240"
              label="Active Players"
              subtext="Verified community"
              trend="+28 this week"
            />
            <StatisticCard
              icon={faStar}
              value="98.5%"
              label="Attendance Rate"
              subtext="Punctual turf check-ins"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* Match Card */}
            <div>
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold block mb-2">
                Match Card
              </span>
              <MatchCard match={SHOWCASE_MATCHES[0]} />
            </div>

            {/* Player Card */}
            <div>
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold block mb-2">
                Player Card
              </span>
              <PlayerCard player={SHOWCASE_PLAYER} />
            </div>

            {/* Organizer Card */}
            <div>
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold block mb-2">
                Organizer Card
              </span>
              <OrganizerCard organizer={SHOWCASE_ORGANIZER} />
            </div>

            {/* Event Card */}
            <div className="md:col-span-2 lg:col-span-1">
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold block mb-2">
                Event / Tournament Card
              </span>
              <EventCard />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. NAVIGATION */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-light-border dark:border-dark-border pb-3">
            <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              4. Navigation Components
            </h2>
            <p className="body-6 text-light-muted dark:text-dark-muted">
              Breadcrumbs, navigation items, and responsive layout integration.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-4">
            <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
              Breadcrumbs Component
            </span>
            <Breadcrumbs
              items={[
                { label: 'Explore Matches', to: '/explore' },
                { label: 'Football & Futsal', to: '/explore?sport=football' },
                { label: 'Banani Floodlit 7v7' },
              ]}
            />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. FEEDBACK */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-light-border dark:border-dark-border pb-3">
            <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              5. Feedback & Overlays
            </h2>
            <p className="body-6 text-light-muted dark:text-dark-muted">
              Toasts, inline alerts, modal dialogs, confirmation dialogs, loading spinners, and skeletons.
            </p>
          </div>

          {/* Toast Triggers */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
              Interactive Toast Triggers
            </span>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => showToast.success('Slot confirmed for Banani Floodlit 7v7')}
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => showToast.error('Match roster is full')}
              >
                Trigger Error Toast
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => showToast.warning('2 slots remaining in this match')}
              >
                Trigger Warning Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast.info('Equipment pledge updated')}
              >
                Trigger Info Toast
              </Button>
            </div>
          </div>

          {/* Modals & Dialogs Triggers */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
              Dialog Overlays
            </span>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
                Open Standard Modal
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                Open Confirmation Dialog
              </Button>
            </div>
          </div>

          {/* Inline Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert variant="info" title="Turf Maintenance Notice" dismissible>
              Dhanmondi Club wooden court will undergo surface polishing this Friday between 2 PM and 5 PM.
            </Alert>
            <Alert variant="success" title="Application Approved" dismissible>
              Organizer Rafiqul Islam accepted your squad application for tonight's game.
            </Alert>
            <Alert variant="warning" title="Heavy Rain Forecast" dismissible>
              Outdoor pitches in Uttara may experience waterlogging. Check with the organizer before departure.
            </Alert>
            <Alert variant="error" title="Payment Verification Needed" dismissible>
              Unable to verify the transaction reference for your court booking.
            </Alert>
          </div>

          {/* Loading Spinners & Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <div className="flex flex-col gap-3">
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
                Loading Spinners (sm, md, lg, xl)
              </span>
              <div className="flex items-center gap-6">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
                Text Skeleton Loader
              </span>
              <Skeleton variant="text" count={3} />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. DATA DISPLAY */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-light-border dark:border-dark-border pb-3">
            <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
              6. Data Display
            </h2>
            <p className="body-6 text-light-muted dark:text-dark-muted">
              Tables, badges, avatars, pagination, and empty states.
            </p>
          </div>

          {/* Badges and Avatars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-3">
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
                Badge Variants & Sizes
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">Primary</Badge>
                <Badge variant="secondary" size="md">Secondary</Badge>
                <Badge variant="success" size="md" hasDot>Confirmed</Badge>
                <Badge variant="warning" size="md" hasDot>2 Slots Left</Badge>
                <Badge variant="error" size="sm">Roster Full</Badge>
                <Badge variant="neutral" size="sm">Archived</Badge>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-3">
              <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
                Avatars with Online Status Indicators
              </span>
              <div className="flex items-center gap-4">
                <Avatar name="Tanvir Ahmed" size="sm" status="online" />
                <Avatar name="Rafiqul Islam" size="md" status="online" />
                <Avatar name="Zayan Ahmed" size="lg" status="busy" />
                <Avatar name="Nusrat Jahan" size="xl" status="offline" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex flex-col gap-3">
            <span className="font-label text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
              Responsive Data Table
            </span>
            <Table columns={sampleColumns} data={SHOWCASE_MATCHES} />
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-body text-xs text-light-muted dark:text-dark-muted">
              Showing page {currentPage} of 5
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={5}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Empty State */}
          <div className="pt-4">
            <EmptyState
              icon={faFutbol}
              title="No archived matches found"
              description="Your previous match history is clear. Join upcoming games to build your match attendance record."
              actionLabel="Explore Live Matches"
              onAction={() => showToast.info('Navigating to Explore')}
            />
          </div>
        </section>
      </div>

      {/* Modal Dialog Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reserve Match Slot"
      >
        <div className="flex flex-col gap-4">
          <p className="font-body text-sm text-light-muted dark:text-dark-muted">
            You are reserving 1 slot for <strong className="text-light-on-surface dark:text-dark-on-surface">Banani Floodlit 7v7 Tonight</strong> at 8:30 PM.
          </p>
          <div className="p-3 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs flex justify-between">
            <span>Ground fee:</span>
            <strong className="text-primary tabular-nums">৳250</strong>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="tertiary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                showToast.success('Slot reserved successfully');
              }}
            >
              Confirm Reservation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog Demo */}
      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          showToast.error('Match registration cancelled');
        }}
        title="Withdraw from Match?"
        description="Are you sure you want to withdraw? Your slot will be released to other waiting players on the roster."
        confirmLabel="Yes, Withdraw"
        variant="danger"
      />
    </PageContainer>
  );
};

export default ComponentShowcasePage;
