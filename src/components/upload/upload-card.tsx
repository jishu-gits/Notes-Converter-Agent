import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { FileText, Lock, UploadCloud } from "lucide-react";

export function UploadCard() {
  return (
    <Card className="w-full overflow-hidden border-border/70 bg-card/90 shadow-elevation-2 backdrop-blur-xl">
      <CardContent className="p-6 sm:p-8">
        <div className="rounded-lg border border-dashed border-primary/35 bg-surface/70 p-6 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevation-1">
            <UploadCloud aria-hidden="true" className="size-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-normal">
            Upload your notes
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            PDF upload will be enabled in the next phase. This card is ready as
            the visual entry point for the notes conversion workflow.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button disabled type="button" className="w-full sm:w-auto">
              <UploadCloud aria-hidden="true" />
              Choose file
            </Button>
            <Button
              disabled
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Lock aria-hidden="true" />
              Coming next
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border bg-card/80 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <FileText aria-hidden="true" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">PDF notes</p>
              <p className="text-sm text-muted-foreground">Planned format</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card/80 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Lock aria-hidden="true" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">No files stored</p>
              <p className="text-sm text-muted-foreground">UI placeholder only</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
