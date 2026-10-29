import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

export type IconComponent = (props: IconProps) => React.ReactElement;

function Svg({
  size = 20,
  className,
  children,
  viewBox = "0 0 24 24",
  fill = "none",
}: IconProps & { children: React.ReactNode; viewBox?: string; fill?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={fill}
      height={size}
      stroke={fill === "none" ? "currentColor" : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox={viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 6L9 17l-5-5" /></Svg>
);
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></Svg>
);
export const MapPinIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0z" /><circle cx="12" cy="10" r="2.5" /></Svg>
);
export const RouteIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h6a4 4 0 004-4V7" /><path d="M10 5H8a4 4 0 00-4 4v6" /></Svg>
);
export const BookIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></Svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></Svg>
);
export const ClipboardIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect height="4" rx="1" width="8" x="8" y="3" /><path d="M9 12h6M9 16h4" /></Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></Svg>
);
export const CameraIcon = (p: IconProps) => (
  <Svg {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></Svg>
);
export const ImageIcon = (p: IconProps) => (
  <Svg {...p}><rect height="18" rx="2" width="18" x="3" y="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></Svg>
);
export const BarChartIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 20V10M18 20V4M6 20v-4" /></Svg>
);
export const BoltIcon = (p: IconProps) => (
  <Svg {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></Svg>
);
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M16 3v4M8 3v4M3 11h18" /></Svg>
);
export const MegaphoneIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" /><path d="M15 8a4 4 0 010 8M18 5a8 8 0 010 14" /></Svg>
);
export const InboxIcon = (p: IconProps) => (
  <Svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13l3.5 7v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6l3.5-7z" /></Svg>
);
export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></Svg>
);
export const ArrowUpIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
);
export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></Svg>
);
export const LogOutIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></Svg>
);
export const EyeIcon = (p: IconProps) => (
  <Svg {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p}><path d="M17.9 17.9A11 11 0 0112 19c-7 0-11-7-11-7a21 21 0 015.1-5.9M9.9 4.2A11 11 0 0112 4c7 0 11 7 11 7a21 21 0 01-2.7 3.9M1 1l22 22" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></Svg>
);
export const LockIcon = (p: IconProps) => (
  <Svg {...p}><rect height="11" rx="2" width="18" x="3" y="11" /><path d="M7 11V7a5 5 0 0110 0v4" /></Svg>
);
export const MailIcon = (p: IconProps) => (
  <Svg {...p}><rect height="14" rx="2" width="20" x="2" y="5" /><path d="M2 7l10 6 10-6" /></Svg>
);
export const UserIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></Svg>
);
export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}><path d="M21 12a9 9 0 01-9 9 9 9 0 01-6.4-2.6L3 16" /><path d="M3 12a9 9 0 019-9 9 9 0 016.4 2.6L21 8" /><path d="M21 3v5h-5M3 21v-5h5" /></Svg>
);
export const CrosshairIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="7" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></Svg>
);
export const CopyIcon = (p: IconProps) => (
  <Svg {...p}><rect height="13" rx="2" width="13" x="9" y="9" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></Svg>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);

export const GoogleIcon = ({ size = 20 }: IconProps) => (
  <svg aria-hidden="true" height={size} viewBox="0 0 48 48" width={size} xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.6.27-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 000 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export function Spinner({ size = 16 }: IconProps) {
  return <span aria-hidden="true" className="spinner" style={{ height: size, width: size }} />;
}
