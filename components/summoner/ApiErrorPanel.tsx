import Link from "next/link";

type Props = {
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
  backHref: string;
  backLabel: string;
};

export default function ApiErrorPanel({ message, retryable, onRetry, backHref, backLabel }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:max-w-4xl">
      <div
        role="alert"
        className="rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-5 text-center sm:px-6"
      >
        <p className="text-sm font-medium text-destructive sm:text-base">{message}</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {retryable && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 min-w-[7.5rem] rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/92 active:bg-primary/85"
            >
              Reintentar
            </button>
          ) : null}
          <Link
            href={backHref}
            className="min-h-11 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
