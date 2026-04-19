import { NavLink } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";

const NAV_ITEMS = [
  {
    id: "liveQueue",
    label: "Live Queue",
    icon: "●",
    route: APP_ROUTES.PORTAL_TRIAGE,
    visibleTo: ["staff", "admin"],
  },
  {
    id: "intakePairing",
    label: "Patient History",
    icon: "▣",
    route: APP_ROUTES.PORTAL_INTAKE,
    visibleTo: ["staff", "admin"],
  },
  {
    id: "deviceHealth",
    label: "Device Health",
    icon: "◉",
    route: APP_ROUTES.PORTAL_DEVICES,
    visibleTo: ["staff", "admin"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "◌",
    route: APP_ROUTES.PORTAL_ANALYTICS,
    visibleTo: ["admin"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "◍",
    route: APP_ROUTES.PORTAL_SETTINGS,
    visibleTo: ["staff", "admin", "patient"],
  },
  {
    id: "patientHome",
    label: "Patient Home",
    icon: "◎",
    route: APP_ROUTES.PORTAL_PATIENT_HOME,
    visibleTo: ["patient"],
  },
];

function PortalSidebar({ identity }) {
  const normalizedRole =
    identity.role === "admin" || identity.role === "patient"
      ? identity.role
      : "staff";

  const navItems = NAV_ITEMS.filter((item) =>
    item.visibleTo.includes(normalizedRole),
  );

  return (
    <aside className="portal-sidebar" aria-label="Portal navigation">
      <div className="portal-sidebar__header">
        <p className="portal-sidebar__brand">Kinovo Portal</p>
        <p className="portal-sidebar__identity-name">{identity.displayName}</p>
        <p className="portal-sidebar__identity-role">Role: {normalizedRole}</p>
        {identity.facilityName ? (
          <p className="portal-sidebar__identity-facility">
            {identity.facilityName}
          </p>
        ) : null}
      </div>

      <nav className="portal-sidebar__nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.route}
            className={({ isActive }) =>
              `portal-sidebar__link ${isActive ? "is-active" : ""}`.trim()
            }
          >
            <span className="portal-sidebar__link-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default PortalSidebar;
