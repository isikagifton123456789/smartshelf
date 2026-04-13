import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "warning" | "danger" | "good";
}

const variantStyles = {
  default: "bg-card border-border",
  good: "bg-card border-status-good/30",
  warning: "bg-card border-status-warning/30",
  danger: "bg-card border-status-danger/30",
};

const iconVariant = {
  default: "bg-primary/10 text-primary",
  good: "bg-[hsl(var(--status-good)/0.12)] text-status-good",
  warning: "bg-[hsl(var(--status-warning)/0.12)] text-status-warning",
  danger: "bg-[hsl(var(--status-danger)/0.12)] text-status-danger",
};

export default function SummaryCard({ title, value, icon: Icon, variant = "default" }: SummaryCardProps) {
  return (
    <div className={`rounded-lg border-2 p-5 animate-fade-in transition-shadow hover:shadow-md ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold font-display text-card-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconVariant[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
