"use client";

import * as React from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Check,
  Clipboard,
  Download,
  FileDown,
  FileText,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getJobStatus, uploadPDF } from "./upload-api";

const maxFileSize = 25 * 1024 * 1024;

const processingSteps = [
  "Uploading",
  "Extracting text",
  "Generating Markdown",
  "Formatting",
  "Complete",
] as const;

const placeholderMarkdown = `# Cognitive Psychology Lecture Notes

## Core Theme

Attention and memory work together. New information becomes useful when it is encoded, connected to prior knowledge, and retrieved repeatedly over time.

## Key Concepts

- Working memory has limited capacity.
- Retrieval practice strengthens long-term recall.
- Spaced review is more effective than cramming.
- Feedback helps correct inaccurate mental models.

## Study Sequence

1. Preview the lecture outline.
2. Convert each section into one question.
3. Answer from memory before checking notes.
4. Revisit missed items after 24 hours.

| Concept | Practical Strategy | Why It Helps |
| --- | --- | --- |
| Encoding | Create examples | Builds meaning |
| Retrieval | Self-test | Strengthens recall |
| Spacing | Review later | Reduces forgetting |

\`\`\`ts
const reviewPlan = ["preview", "recall", "check", "revise"];
\`\`\`

> Important note: Recognition feels fluent, but recall proves whether the material is actually usable.

- [x] Identify the lecture objective
- [x] Extract important definitions
- [ ] Create practice questions
- [ ] Schedule the next review`;

type UploadStatus = "idle" | "ready" | "processing" | "complete";

export function UploadCard() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [status, setStatus] = React.useState<UploadStatus>("idle");
  const [processingStepIndex, setProcessingStepIndex] = React.useState(0);

  React.useEffect(() => {
    if (status !== "processing") {
      return;
    }

    let isCancelled = false;
    const timer = window.setTimeout(() => {
      void getJobStatus("mock-upload-job").then(() => {
        if (isCancelled) {
          return;
        }

        if (processingStepIndex >= processingSteps.length - 1) {
          setStatus("complete");
          return;
        }

        setProcessingStepIndex((currentStep) => currentStep + 1);
      });
    }, 400);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [processingStepIndex, status]);

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    handleFileSelection(file);
    event.currentTarget.value = "";
  };

  const handleFileSelection = (file: File) => {
    if (!isPdfFile(file)) {
      setSelectedFile(null);
      setStatus("idle");
      setErrorMessage("Please choose a PDF file.");
      return;
    }

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setStatus("idle");
      setErrorMessage("PDF must be 25 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setStatus("ready");
    setProcessingStepIndex(0);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemove = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    resetUpload();
  };

  const handleConvert = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!selectedFile) {
      return;
    }

    setErrorMessage(null);
    setProcessingStepIndex(0);
    setStatus("processing");
    void uploadPDF(selectedFile);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setIsDragging(false);
    setStatus("idle");
    setProcessingStepIndex(0);
  };

  if (status === "complete" && selectedFile) {
    return (
      <Card className="w-full border-border/70 bg-card/90 shadow-elevation-2 backdrop-blur-xl">
        <CardContent className="p-4 sm:p-5">
          <FilePickerInput inputRef={inputRef} onChange={handleFileChange} />
          <motion.div
            className="grid w-full gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <UploadedPdfPanel
              file={selectedFile}
              onChangePDF={handleChooseFile}
              onRemovePDF={() => handleRemove()}
            />
            <MarkdownPreview />
            <ActionsPanel file={selectedFile} onStartOver={resetUpload} />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (status === "processing" && selectedFile) {
    return (
      <Card className="w-full border-border/70 bg-card/90 shadow-elevation-2 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8">
          <ProcessingView
            file={selectedFile}
            progress={((processingStepIndex + 1) / processingSteps.length) * 100}
            step={processingSteps[processingStepIndex]}
            stepIndex={processingStepIndex}
          />
        </CardContent>
      </Card>
    );
  }

  const isReady = status === "ready" && selectedFile !== null;

  return (
    <Card className="w-full overflow-hidden border-border/70 bg-card/90 shadow-elevation-2 backdrop-blur-xl">
      <CardContent className="p-6 sm:p-8">
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-elevation-1">
            <Sparkles aria-hidden="true" className="size-5" />
          </div>
          <p className="text-sm font-medium uppercase tracking-normal text-muted-foreground">
            AI document workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
            Turn lecture PDFs into structured study notes
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Add a PDF to preview the complete conversion flow. Everything here
            stays in the browser until backend integration is connected.
          </p>
        </div>

        <DropZone
          errorMessage={errorMessage}
          isDragging={isDragging}
          isReady={isReady}
          selectedFile={selectedFile}
          inputRef={inputRef}
          onChange={handleFileChange}
          onChooseFile={handleChooseFile}
          onConvert={handleConvert}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onRemove={handleRemove}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border bg-card/80 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              {isReady ? (
                <FileText aria-hidden="true" className="size-4" />
              ) : (
                <UploadCloud aria-hidden="true" className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {isReady ? "Ready to convert" : "PDF notes"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isReady
                  ? "Validated for frontend conversion"
                  : "PDF only, up to 25 MB"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DropZone({
  errorMessage,
  isDragging,
  isReady,
  selectedFile,
  inputRef,
  onChange,
  onChooseFile,
  onConvert,
  onDragLeave,
  onDragOver,
  onDrop,
  onRemove,
}: {
  errorMessage: string | null;
  isDragging: boolean;
  isReady: boolean;
  selectedFile: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChooseFile: () => void;
  onConvert: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onRemove: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const dropZoneClassName = [
    "group cursor-pointer rounded-lg border border-dashed p-6 text-center",
    "transition-[background-color,border-color,box-shadow,transform] duration-[260ms] ease-[var(--ease-standard)]",
    isDragging
      ? "border-primary bg-primary/10 shadow-elevation-2"
      : "border-primary/35 bg-surface/70 hover:border-primary/70 hover:bg-primary/5 hover:shadow-elevation-2",
  ].join(" ");
  const iconClassName = [
    "mx-auto mb-5 flex size-16 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevation-1",
    "transition-transform duration-[260ms] ease-[var(--ease-standard)]",
    isDragging ? "scale-105" : "group-hover:scale-105",
  ].join(" ");

  return (
    <div
      className={dropZoneClassName}
      onClick={onChooseFile}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <FilePickerInput inputRef={inputRef} onChange={onChange} />

      <AnimatePresence mode="wait">
        {isReady && selectedFile ? (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={iconClassName}>
              <FileText aria-hidden="true" className="size-7" />
            </div>
            <p className="mx-auto max-w-md truncate text-lg font-semibold tracking-normal">
              {selectedFile.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
            <Badge variant="success" className="mt-4">
              <Check aria-hidden="true" className="size-3.5" />
              Ready
            </Badge>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={iconClassName}>
              <UploadCloud aria-hidden="true" className="size-7" />
            </div>
            <h3 className="text-xl font-semibold tracking-normal">
              Drag & Drop your PDF
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              or click to browse files
            </p>
            <Badge variant="secondary" className="mt-4">
              Maximum size: 25 MB
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMessage ? (
        <motion.div
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-left text-sm text-destructive"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {errorMessage}
        </motion.div>
      ) : null}

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={(event) => {
            event.stopPropagation();
            onChooseFile();
          }}
        >
          <UploadCloud aria-hidden="true" />
          {isReady ? "Change PDF" : "Choose file"}
        </Button>
        {isReady ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={onConvert}
            >
              Convert Notes
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ProcessingView({
  file,
  progress,
  step,
  stepIndex,
}: {
  file: File;
  progress: number;
  step: (typeof processingSteps)[number];
  stepIndex: number;
}) {
  return (
    <motion.div
      className="mx-auto max-w-3xl rounded-lg border bg-surface/70 p-6 text-center sm:p-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevation-1">
        <FileText aria-hidden="true" className="size-7" />
      </div>
      <p className="truncate text-lg font-semibold">{file.name}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="mt-2 text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {step}
        </motion.p>
      </AnimatePresence>

      <div className="mt-7 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-5">
        {processingSteps.map((processingStep, index) => (
          <div
            key={processingStep}
            className="flex items-center gap-2 rounded-md border bg-card/70 px-3 py-2 text-left text-xs sm:flex-col sm:text-center"
          >
            <span
              className={[
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                index <= stepIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              ].join(" ")}
            >
              {index < stepIndex ? <Check aria-hidden="true" className="size-3" /> : index + 1}
            </span>
            <span className="text-muted-foreground">{processingStep}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function UploadedPdfPanel({
  file,
  onChangePDF,
  onRemovePDF,
}: {
  file: File;
  onChangePDF: () => void;
  onRemovePDF: () => void;
}) {
  return (
    <Card className="h-full border-border/70 bg-surface/70 shadow-none">
      <CardContent className="p-5">
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevation-1">
          <FileText aria-hidden="true" className="size-5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Uploaded PDF</p>
        <p className="mt-2 break-words text-lg font-semibold">{file.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
        <Badge variant="success" className="mt-4">
          <Check aria-hidden="true" className="size-3.5" />
          Converted
        </Badge>

        <div className="mt-6 grid gap-3">
          <Button type="button" variant="outline" onClick={onChangePDF}>
            <UploadCloud aria-hidden="true" />
            Change PDF
          </Button>
          <Button type="button" variant="outline" onClick={onRemovePDF}>
            <Trash2 aria-hidden="true" />
            Remove PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MarkdownPreview() {
  return (
    <Card className="h-full border-border/70 bg-card/95 shadow-none">
      <CardContent className="p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Markdown Preview
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">
              Cognitive Psychology Lecture Notes
            </h2>
          </div>
          <Badge variant="secondary">Generated</Badge>
        </div>

        <article className="space-y-7 text-sm leading-7 text-foreground">
          <section>
            <h3 className="text-lg font-semibold">Core Theme</h3>
            <p className="mt-2 text-muted-foreground">
              Attention and memory work together. New information becomes useful
              when it is encoded, connected to prior knowledge, and retrieved
              repeatedly over time.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Key Concepts</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Working memory has limited capacity.</li>
              <li>Retrieval practice strengthens long-term recall.</li>
              <li>Spaced review is more effective than cramming.</li>
              <li>Feedback helps correct inaccurate mental models.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Study Sequence</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>Preview the lecture outline.</li>
              <li>Convert each section into one question.</li>
              <li>Answer from memory before checking notes.</li>
              <li>Revisit missed items after 24 hours.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Strategy Table</h3>
            <div className="mt-3 rounded-lg border">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface">
                  <tr>
                    <th className="border-b px-4 py-3 font-medium">Concept</th>
                    <th className="border-b px-4 py-3 font-medium">
                      Practical Strategy
                    </th>
                    <th className="border-b px-4 py-3 font-medium">
                      Why It Helps
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border-b px-4 py-3">Encoding</td>
                    <td className="border-b px-4 py-3">Create examples</td>
                    <td className="border-b px-4 py-3">Builds meaning</td>
                  </tr>
                  <tr>
                    <td className="border-b px-4 py-3">Retrieval</td>
                    <td className="border-b px-4 py-3">Self-test</td>
                    <td className="border-b px-4 py-3">Strengthens recall</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Spacing</td>
                    <td className="px-4 py-3">Review later</td>
                    <td className="px-4 py-3">Reduces forgetting</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Code Example</h3>
            <pre className="mt-3 rounded-lg bg-surface-sunken p-4 text-xs leading-6 text-foreground whitespace-pre-wrap">
              <code>{'const reviewPlan = ["preview", "recall", "check", "revise"];'}</code>
            </pre>
          </section>

          <blockquote className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-muted-foreground">
            <span className="font-medium text-foreground">Important note:</span>{" "}
            Recognition feels fluent, but recall proves whether the material is
            actually usable.
          </blockquote>

          <section>
            <h3 className="text-lg font-semibold">Checklist</h3>
            <div className="mt-3 grid gap-2 text-muted-foreground">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked readOnly className="size-4" />
                Identify the lecture objective
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked readOnly className="size-4" />
                Extract important definitions
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" readOnly className="size-4" />
                Create practice questions
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" readOnly className="size-4" />
                Schedule the next review
              </label>
            </div>
          </section>
        </article>
      </CardContent>
    </Card>
  );
}

function ActionsPanel({
  file,
  onStartOver,
}: {
  file: File;
  onStartOver: () => void;
}) {
  const wordCount = countWords(placeholderMarkdown);
  const characterCount = placeholderMarkdown.length;

  return (
    <Card className="h-full border-border/70 bg-surface/70 shadow-none lg:col-span-2 xl:col-span-1">
      <CardContent className="grid gap-6 p-5">
        <section>
          <p className="text-sm font-medium text-muted-foreground">Export</p>
          <div className="mt-3 grid gap-3">
            <Button type="button" variant="outline" className="justify-start">
              <Clipboard aria-hidden="true" />
              Copy Markdown
            </Button>
            <Button type="button" variant="outline" className="justify-start">
              <Download aria-hidden="true" />
              Download Markdown
            </Button>
            <Button type="button" variant="outline" className="justify-start">
              <FileDown aria-hidden="true" />
              Download PDF
            </Button>
          </div>
        </section>

        <section>
          <p className="text-sm font-medium text-muted-foreground">History</p>
          <dl className="mt-3 grid gap-3 text-sm">
            <Metric label="Last conversion" value="Just now" />
            <Metric label="Current status" value="Ready to export" />
            <Metric label="Estimated reading time" value="4 min" />
            <Metric label="Word count" value={wordCount.toLocaleString()} />
            <Metric
              label="Character count"
              value={characterCount.toLocaleString()}
            />
            <Metric label="Source file" value={file.name} />
          </dl>
        </section>

        <Button type="button" onClick={onStartOver}>
          <RotateCcw aria-hidden="true" />
          Start Over
        </Button>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card/70 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-medium">{value}</dd>
    </div>
  );
}

function FilePickerInput({
  inputRef,
  onChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      onChange={onChange}
    />
  );
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function countWords(markdown: string) {
  return markdown
    .replace(/[`#>|[\]-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}
