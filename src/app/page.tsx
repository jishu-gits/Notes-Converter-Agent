import Image from "next/image";
import { UploadCard } from "@/components/upload/upload-card";
import { AppShell } from "@/shared/layouts/app-shell";
import { Badge } from "@/shared/ui/badge";

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 py-6 lg:py-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-lg border border-border/70 bg-card/88 p-6 shadow-elevation-2 backdrop-blur-xl sm:p-8">
            <Badge variant="secondary">Provider-flexible study notes</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
              Convert dense PDFs into clean markdown notes.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Remarker AI turns lecture slides, readings, and handouts into
              structured notes with consistent formatting across Gemini and
              NVIDIA NIM.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-elevation-1 transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href="#upload"
              >
                Upload PDF
              </a>
              <a
                className="inline-flex h-11 items-center justify-center rounded-md border border-border/80 bg-background/80 px-5 text-sm font-medium transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href="#settings"
              >
                Configure provider
              </a>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden rounded-lg border border-border/70 bg-surface-raised/88 p-6 shadow-elevation-2 backdrop-blur-xl">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/95 to-transparent" />
            <Image
              src="/illustrations/ai-generated-document.svg"
              alt=""
              width={420}
              height={300}
              className="mx-auto h-56 w-full object-contain"
              priority
            />
            <div className="relative mt-4 grid grid-cols-3 gap-3">
              <HeroMetric label="Stages" value="5" />
              <HeroMetric label="Exports" value="MD" />
              <HeroMetric label="Providers" value="2" />
            </div>
          </div>
        </section>

        <section
          aria-label="Dashboard summary"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <DashboardStat label="Status" value="Production-ready" />
          <DashboardStat label="Input" value="PDF up to 25 MB" />
          <DashboardStat label="Output" value="Markdown notes" />
          <DashboardStat label="Fallback" value="Automatic" />
        </section>

        <section id="upload" className="scroll-mt-24">
          <UploadCard />
        </section>
      </div>
    </AppShell>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/85 p-3 text-center backdrop-blur">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/82 p-4 shadow-elevation-1 backdrop-blur-xl transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevation-2">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
