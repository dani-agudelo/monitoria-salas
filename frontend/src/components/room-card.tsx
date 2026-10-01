import { Clock3 } from "lucide-react";

export function RoomCard({
  name,
  features,
  locationName,
  monitors,
  since,
}: {
  name: string;
  features: string[];
  locationName: string;
  monitors: { id: string; name: string }[];
  since: string;
}) {
  return (
    <article className="flex h-full min-h-72 flex-col rounded-3xl border border-slate-100/50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_12px_36px_rgb(234,88,12,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-primary">Abierta</span>
        <small className="text-muted-foreground">{locationName}</small>
      </div>
      <h3 className="mt-6 text-secondary">{name}</h3>
      <small className="mt-2 block text-muted-foreground">
        {features.join(" · ")}
      </small>
      <hr className="my-6 border-0 border-t border-slate-100" />
      <div className="flex flex-col gap-4">
        {monitors.map((monitor) => {
          const initials = monitor.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("");
          return (
            <div key={monitor.id} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                {initials}
              </span>
              <div>
                <small className="text-muted-foreground">
                  {monitors.length > 1
                    ? "Monitores a cargo"
                    : "Monitor a cargo"}
                </small>
                <p className="font-bold text-secondary">{monitor.name}</p>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-3">
          <Clock3
            size={20}
            strokeWidth={1.5}
            className="shrink-0 text-primary"
          />
          <small className="font-bold text-secondary">Desde {since}</small>
        </div>
      </div>
    </article>
  );
}
