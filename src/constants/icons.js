import {
  faFutbol,
  faTableTennisPaddleBall,
  faBaseballBatBall,
  faBasketball,
  faBolt,
  faShieldHalved,
  faShieldHeart,
  faUsers,
  faUser,
  faUserGroup,
  faUserPlus,
  faLocationDot,
  faCalendarCheck,
  faCalendarDays,
  faClock,
  faCheck,
  faCheckCircle,
  faXmark,
  faTriangleExclamation,
  faCircleExclamation,
  faInfoCircle,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faChevronRight,
  faChevronLeft,
  faChevronUp,
  faBars,
  faRightFromBracket,
  faHome,
  faSearch,
  faFilter,
  faPlus,
  faStar,
  faStarHalfStroke,
  faTicket,
  faFileLines,
  faChartPie,
  faChartSimple,
  faUsersGear,
  faGears,
  faSpinner,
  faSun,
  faMoon,
  faEye,
  faEyeSlash,
  faLock,
  faEnvelope,
  faPhone,
  faUpload,
  faCloudArrowUp,
  faTrash,
  faEdit,
  faTrophy,
  faMedal,
  faHandshakeAngle,
  faCircle,
  faQrcode,
} from '@fortawesome/free-solid-svg-icons';

import {
  faFacebookF,
  faInstagram,
  faYoutube,
  faLinkedinIn,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';

/**
 * Centralized Icon Dictionary
 * Strictly maps Font Awesome React icons. No emojis or decorative text symbols permitted.
 */
export const ICONS = {
  // Sports
  football: faFutbol,
  badminton: faTableTennisPaddleBall,
  cricket: faBaseballBatBall,
  basketball: faBasketball,
  trophy: faTrophy,
  medal: faMedal,

  // Actions & States
  bolt: faBolt,
  check: faCheck,
  checkCircle: faCheckCircle,
  close: faXmark,
  spinner: faSpinner,
  plus: faPlus,
  search: faSearch,
  filter: faFilter,
  upload: faUpload,
  cloudUpload: faCloudArrowUp,
  trash: faTrash,
  edit: faEdit,
  qrcode: faQrcode,

  // Status & Feedback
  success: faCheckCircle,
  warning: faTriangleExclamation,
  error: faCircleExclamation,
  info: faInfoCircle,
  star: faStar,
  starHalf: faStarHalfStroke,

  // Navigation & Direction
  arrowRight: faArrowRight,
  arrowLeft: faArrowLeft,
  chevronDown: faChevronDown,
  chevronRight: faChevronRight,
  chevronLeft: faChevronLeft,
  chevronUp: faChevronUp,
  bars: faBars,
  logout: faRightFromBracket,
  home: faHome,

  // Security & Trust
  shield: faShieldHalved,
  shieldHeart: faShieldHeart,
  lock: faLock,

  // Community & Users
  user: faUser,
  users: faUsers,
  userGroup: faUserGroup,
  userPlus: faUserPlus,
  handshake: faHandshakeAngle,

  // Time & Location
  location: faLocationDot,
  calendar: faCalendarCheck,
  calendarDays: faCalendarDays,
  clock: faClock,
  ticket: faTicket,
  file: faFileLines,

  // Theme
  sun: faSun,
  moon: faMoon,
  eye: faEye,
  eyeSlash: faEyeSlash,
  mail: faEnvelope,
  phone: faPhone,
  dot: faCircle,

  // Dashboards
  chartPie: faChartPie,
  chartBar: faChartSimple,
  usersGear: faUsersGear,
  gears: faGears,

  // Social
  facebook: faFacebookF,
  instagram: faInstagram,
  youtube: faYoutube,
  linkedin: faLinkedinIn,
  twitter: faTwitter,
};
