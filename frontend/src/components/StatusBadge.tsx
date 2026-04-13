interface StatusBadgeProps {
  status: "good" | "warning" | "expired";
}

const labels = { good: "Good", warning: "Near Expiry", expired: "Expired" };

export default function StatusBadge({ status }: StatusBadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const styles = {
    good: "status-good",
    warning: "status-warning",
    expired: "status-danger",
  };
  return <span className={`${base} ${styles[status]}`}>{labels[status]}</span>;
}
