import { AlertTriangle, Clock, PackageMinus } from "lucide-react";

interface NotificationItemProps {
  type: "expiry" | "expired" | "lowStock";
  message: string;
}

const config = {
  expiry: { icon: Clock, style: "status-warning", border: "border-status-warning/30" },
  expired: { icon: AlertTriangle, style: "status-danger", border: "border-status-danger/30" },
  lowStock: { icon: PackageMinus, style: "status-danger", border: "border-status-danger/30" },
};

export default function NotificationItem({ type, message }: NotificationItemProps) {
  const { icon: Icon, style, border } = config[type];
  return (
    <div className={`flex items-start gap-3 rounded-lg border-2 ${border} bg-card p-4 animate-slide-in transition-shadow hover:shadow-sm`}>
      <div className={`rounded-lg p-2 ${style}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm text-card-foreground leading-relaxed">{message}</p>
    </div>
  );
}
