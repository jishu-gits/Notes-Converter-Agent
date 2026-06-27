import { UploadCard } from "@/components/upload/upload-card";
import { AppShell } from "@/shared/layouts/app-shell";
import { Card, CardContent } from "@/shared/ui/card";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid flex-1 place-items-center py-8">
        <Card className="w-full max-w-4xl overflow-hidden border-border/70 bg-card/86 shadow-elevation-3 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <div className="bg-accent text-accent-foreground mb-6 flex size-12 items-center justify-center rounded-lg shadow-elevation-1">
                  <Sparkles aria-hidden="true" className="size-5" />
                </div>
                <p className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-normal">
                  AI Notes Converter
                </p>
                <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
                  Convert your notes into beautiful study material
                </h1>
                <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7">
                  Your workspace is ready. Upload functionality will arrive in
                  the next phase, followed by AI-powered conversion tools for
                  structured study guides.
                </p>
              </div>

              <div className="border-border/70 bg-surface/70 grid min-h-72 place-items-center border-t p-6 sm:p-8 lg:border-l lg:border-t-0">
                <UploadCard />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
