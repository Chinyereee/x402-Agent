import { STATUS_LABEL, type Status } from "@/lib/sample.ts";

export function Pill({ status }: { status: Status }) {
  return <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>;
}
