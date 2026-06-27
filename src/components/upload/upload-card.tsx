"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { FileText, UploadCloud } from "lucide-react";

export function UploadCard() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.currentTarget.files?.[0] ?? null);
  };

  return (
    <Card className="w-full overflow-hidden border-border/70 bg-card/90 shadow-elevation-2 backdrop-blur-xl">
      <CardContent className="p-6 sm:p-8">
        <div className="group cursor-pointer rounded-lg border border-dashed border-primary/35 bg-surface/70 p-6 text-center transition-[background-color,border-color,box-shadow,transform] duration-[260ms] ease-[var(--ease-standard)] hover:border-primary/70 hover:bg-primary/5 hover:shadow-elevation-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevation-1 transition-transform duration-[260ms] ease-[var(--ease-standard)] group-hover:-translate-y-0.5">
                <FileText aria-hidden="true" className="size-7" />
              </div>
              <p className="mx-auto max-w-md truncate text-lg font-semibold tracking-normal">
                {selectedFile.name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              <Badge variant="success" className="mt-4">
                ✓ Ready
              </Badge>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevation-1 transition-transform duration-[260ms] ease-[var(--ease-standard)] group-hover:-translate-y-0.5">
                <UploadCloud aria-hidden="true" className="size-7" />
              </div>
              <h2 className="text-xl font-semibold tracking-normal">
                Drag & Drop your PDF
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                or click to browse files
              </p>
              <Badge variant="secondary" className="mt-4">
                Maximum size: 25 MB
              </Badge>
            </>
          )}

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleChooseFile}
            >
              <UploadCloud aria-hidden="true" />
              {selectedFile ? "Change PDF" : "Choose file"}
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
              <p className="text-sm text-muted-foreground">Visual placeholder</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
