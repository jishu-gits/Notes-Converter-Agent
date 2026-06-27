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
import {
  deleteJob,
  downloadMarkdown,
  downloadPDF,
  getGeneratedMarkdown,
  getJobStatus,
  uploadPDF,
  type JobStatus,
} from "./upload-api";

const maxFileSize = 25 * 1024 * 1024;
const maxPollAttempts = 120;

type UploadStatus = "idle" | "ready" | "processing" | "complete";
type DownloadTarget = "markdown" | "pdf";

export function UploadCard() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const activeRequestRef = React.useRef(0);
  const copyFeedbackTimerRef = React.useRef<number | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [markdown, setMarkdown] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [status, setStatus] = React.useState<UploadStatus>("idle");
  const [processingLabel, setProcessingLabel] = React.useState("Uploading");
  const [progress, setProgress] = React.useState(0);
  const [downloadTarget, setDownloadTarget] =
    React.useState<DownloadTarget | null>(null);
  const [copySucceeded, setCopySucceeded] = React.useState(false);

  React.useEffect(() => {
    return () => {
      activeRequestRef.current += 1;

      if (copyFeedbackTimerRef.current) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const handleChooseFile = () => {
    if (status !== "processing") {
      inputRef.current?.click();
    }
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

    activeRequestRef.current += 1;
    setSelectedFile(file);
    setJobId(null);
    setMarkdown("");
    setCopySucceeded(false);
    setErrorMessage(null);
    setStatus("ready");
    setProgress(0);
    setProcessingLabel("Uploading");
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (status !== "processing") {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (status === "processing") {
      return;
    }

    const file = event.dataTransfer.files[0];

    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemove = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    resetUpload();
  };

  const handleConvert = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();

    if (!selectedFile || status === "processing") {
      return;
    }

    void startConversion(selectedFile);
  };

  const startConversion = async (file: File) => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    setErrorMessage(null);
    setCopySucceeded(false);
    setJobId(null);
    setMarkdown("");
    setProgress(8);
    setProcessingLabel("Uploading");
    setStatus("processing");

    try {
      const upload = await uploadPDF(file);

      if (!isActiveRequest(requestId)) {
        return;
      }

      setJobId(upload.jobId);
      setProgress(15);
      await pollJob(upload.jobId, requestId);
    } catch (error) {
      if (!isActiveRequest(requestId)) {
        return;
      }

      setStatus("ready");
      setProgress(0);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const pollJob = async (nextJobId: string, requestId: number) => {
    for (let attempt = 1; attempt <= maxPollAttempts; attempt += 1) {
      await waitForPollInterval();

      if (!isActiveRequest(requestId)) {
        return;
      }

      const nextStatus = await getJobStatus(nextJobId);

      if (!isActiveRequest(requestId)) {
        return;
      }

      setProcessingLabel(getStatusLabel(nextStatus));
      setProgress(estimateProgress(nextStatus, attempt));

      if (nextStatus.status === "failed") {
        throw new Error(nextStatus.error ?? "Backend conversion failed.");
      }

      if (nextStatus.status === "completed") {
        const generatedMarkdown = await getGeneratedMarkdown(
          nextJobId,
          nextStatus,
        );

        if (!isActiveRequest(requestId)) {
          return;
        }

        if (!generatedMarkdown.trim()) {
          throw new Error("Backend returned empty markdown.");
        }

        setMarkdown(generatedMarkdown);
        setProcessingLabel("Completed");
        setProgress(100);
        setStatus("complete");
        return;
      }
    }

    throw new Error("Conversion timed out. Please retry.");
  };

  const resetUpload = () => {
    activeRequestRef.current += 1;

    if (jobId) {
      void deleteJob(jobId).catch(() => undefined);
    }

    setSelectedFile(null);
    setJobId(null);
    setMarkdown("");
    setCopySucceeded(false);
    setErrorMessage(null);
    setIsDragging(false);
    setStatus("idle");
    setProgress(0);
    setProcessingLabel("Uploading");
  };

  const handleCopyMarkdown = async () => {
    try {
      setErrorMessage(null);
      await navigator.clipboard.writeText(markdown);
      setCopySucceeded(true);

      if (copyFeedbackTimerRef.current) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }

      copyFeedbackTimerRef.current = window.setTimeout(() => {
        setCopySucceeded(false);
      }, 1600);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleDownloadMarkdown = async () => {
    if (!jobId) {
      setErrorMessage("No completed job is available to download.");
      return;
    }

    setDownloadTarget("markdown");
    setErrorMessage(null);

    try {
      const blob = await downloadMarkdown(jobId);
      saveBlob(blob, `${getFileStem(selectedFile?.name ?? "notes")}.md`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDownloadTarget(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!jobId) {
      setErrorMessage("No completed job is available to download.");
      return;
    }

    setDownloadTarget("pdf");
    setErrorMessage(null);

    try {
      const blob = await downloadPDF(jobId);
      saveBlob(blob, `${getFileStem(selectedFile?.name ?? "notes")}.pdf`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDownloadTarget(null);
    }
  };

  const isActiveRequest = (requestId: number) =>
    activeRequestRef.current === requestId;

  if (status === "complete" && selectedFile) {
    return (
      <Card className="w-full border-border/70 bg-card/90 shadow-elevation-2 backdrop-blur-xl">
        <CardContent className="p-4 sm:p-5">
          <FilePickerInput inputRef={inputRef} onChange={handleFileChange} />
          {errorMessage ? (
            <InlineError
              message={errorMessage}
              onRetry={() => handleConvert()}
              className="mb-5"
            />
          ) : null}
          <motion.div
            className="grid w-full gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <UploadedPdfPanel
              file={selectedFile}
              statusLabel="Completed"
              onChangePDF={handleChooseFile}
              onRemovePDF={() => handleRemove()}
            />
            <MarkdownPreview markdown={markdown} />
            <ActionsPanel
              copySucceeded={copySucceeded}
              downloadTarget={downloadTarget}
              file={selectedFile}
              markdown={markdown}
              onCopyMarkdown={handleCopyMarkdown}
              onDownloadMarkdown={handleDownloadMarkdown}
              onDownloadPDF={handleDownloadPDF}
              onStartOver={resetUpload}
            />
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
            progress={progress}
            statusLabel={processingLabel}
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
            Add a PDF to generate markdown study material from the connected
            backend.
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
          onRetry={selectedFile ? () => handleConvert() : undefined}
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
                  ? "Validated and ready for backend processing"
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
  onRetry,
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
  onRetry?: () => void;
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
        <InlineError message={errorMessage} onRetry={onRetry} className="mt-5" />
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
  statusLabel,
}: {
  file: File;
  progress: number;
  statusLabel: string;
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
          key={statusLabel}
          className="mt-2 text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {statusLabel}
        </motion.p>
      </AnimatePresence>

      <div className="mt-7 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${Math.round(progress)}%` }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {Math.round(progress)}% complete
      </p>
    </motion.div>
  );
}

function UploadedPdfPanel({
  file,
  statusLabel,
  onChangePDF,
  onRemovePDF,
}: {
  file: File;
  statusLabel: string;
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
          {statusLabel}
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

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = React.useMemo(() => parseMarkdown(markdown), [markdown]);
  const title = getMarkdownTitle(markdown);

  return (
    <Card className="h-full border-border/70 bg-card/95 shadow-none">
      <CardContent className="p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Markdown Preview
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">
              {title}
            </h2>
          </div>
          <Badge variant="secondary">Generated</Badge>
        </div>

        <article className="space-y-7 text-sm leading-7 text-foreground">
          {blocks.map((block, index) => renderMarkdownBlock(block, index))}
        </article>
      </CardContent>
    </Card>
  );
}

function ActionsPanel({
  copySucceeded,
  downloadTarget,
  file,
  markdown,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadPDF,
  onStartOver,
}: {
  copySucceeded: boolean;
  downloadTarget: DownloadTarget | null;
  file: File;
  markdown: string;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onDownloadPDF: () => void;
  onStartOver: () => void;
}) {
  const wordCount = countWords(markdown);
  const characterCount = markdown.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <Card className="h-full border-border/70 bg-surface/70 shadow-none lg:col-span-2 xl:col-span-1">
      <CardContent className="grid gap-6 p-5">
        <section>
          <p className="text-sm font-medium text-muted-foreground">Export</p>
          <div className="mt-3 grid gap-3">
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={onCopyMarkdown}
            >
              <Clipboard aria-hidden="true" />
              Copy Markdown
            </Button>
            {copySucceeded ? (
              <Badge variant="success" className="w-fit">
                <Check aria-hidden="true" className="size-3.5" />
                Copied
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled={downloadTarget !== null}
              onClick={onDownloadMarkdown}
            >
              <Download aria-hidden="true" />
              {downloadTarget === "markdown"
                ? "Downloading..."
                : "Download Markdown"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled={downloadTarget !== null}
              onClick={onDownloadPDF}
            >
              <FileDown aria-hidden="true" />
              {downloadTarget === "pdf" ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </section>

        <section>
          <p className="text-sm font-medium text-muted-foreground">History</p>
          <dl className="mt-3 grid gap-3 text-sm">
            <Metric label="Last conversion" value="Just now" />
            <Metric label="Current status" value="Ready to export" />
            <Metric
              label="Estimated reading time"
              value={`${readingTime} min`}
            />
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

function InlineError({
  className,
  message,
  onRetry,
}: {
  className?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      className={[
        "rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-left text-sm text-destructive",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </motion.div>
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

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: MarkdownListItem[] }
  | { type: "code"; language?: string; code: string }
  | { type: "quote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

type MarkdownListItem = {
  text: string;
  checked?: boolean;
};

function parseMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w+)?/);

    if (fence) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        language: fence[1],
        code: codeLines.join("\n"),
      });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)/);

    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = parseTableRow(lines[index]);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    const orderedListMatch = line.match(/^\d+\.\s+(.+)/);
    const unorderedListMatch = line.match(/^[-*]\s+(.+)/);

    if (orderedListMatch || unorderedListMatch) {
      const ordered = Boolean(orderedListMatch);
      const items: MarkdownListItem[] = [];

      while (index < lines.length) {
        const currentLine = lines[index];
        const match = ordered
          ? currentLine.match(/^\d+\.\s+(.+)/)
          : currentLine.match(/^[-*]\s+(.+)/);

        if (!match) {
          break;
        }

        const checkbox = match[1].match(/^\[(x|X| )\]\s+(.+)/);
        items.push(
          checkbox
            ? {
                text: checkbox[2],
                checked: checkbox[1].toLowerCase() === "x",
              }
            : { text: match[1] },
        );
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && lines[index].trim()) {
      if (paragraphLines.length > 0 && isSpecialMarkdownLine(lines[index])) {
        break;
      }

      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function renderMarkdownBlock(block: MarkdownBlock, index: number) {
  switch (block.type) {
    case "heading":
      if (block.level === 1) {
        return (
          <h1 key={index} className="text-3xl font-semibold tracking-normal">
            {block.text}
          </h1>
        );
      }

      if (block.level === 2) {
        return (
          <h2 key={index} className="text-xl font-semibold tracking-normal">
            {block.text}
          </h2>
        );
      }

      return (
        <h3 key={index} className="text-lg font-semibold tracking-normal">
          {block.text}
        </h3>
      );
    case "paragraph":
      return (
        <p key={index} className="text-muted-foreground">
          {block.text}
        </p>
      );
    case "list":
      if (block.items.some((item) => typeof item.checked === "boolean")) {
        return (
          <div key={index} className="grid gap-2 text-muted-foreground">
            {block.items.map((item, itemIndex) => (
              <label key={itemIndex} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(item.checked)}
                  readOnly
                  className="size-4"
                />
                {item.text}
              </label>
            ))}
          </div>
        );
      }

      if (block.ordered) {
        return (
          <ol
            key={index}
            className="list-decimal space-y-2 pl-5 text-muted-foreground"
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item.text}</li>
            ))}
          </ol>
        );
      }

      return (
        <ul key={index} className="list-disc space-y-2 pl-5 text-muted-foreground">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item.text}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface">
              <tr>
                {block.headers.map((header) => (
                  <th key={header} className="border-b px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-b px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <pre
          key={index}
          className="rounded-lg bg-surface-sunken p-4 text-xs leading-6 text-foreground whitespace-pre-wrap"
        >
          <code>{block.code}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote
          key={index}
          className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-muted-foreground"
        >
          {block.text}
        </blockquote>
      );
  }
}

function isTableStart(lines: string[], index: number) {
  return (
    lines[index]?.includes("|") &&
    Boolean(lines[index + 1]?.match(/^\s*\|?[\s:-]+\|[\s|:-]*$/))
  );
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSpecialMarkdownLine(line: string) {
  return (
    /^```/.test(line) ||
    /^(#{1,3})\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    line.trim().startsWith(">") ||
    line.includes("|")
  );
}

function getMarkdownTitle(markdown: string) {
  return (
    markdown
      .split("\n")
      .find((line) => line.startsWith("# "))
      ?.replace(/^#\s+/, "")
      .trim() || "Generated study notes"
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

function getStatusLabel(status: JobStatus) {
  switch (status.status) {
    case "queued":
      return "Uploading";
    case "uploading":
      return "Uploading";
    case "extracting":
      return "Extracting text";
    case "generating":
      return "Generating Markdown";
    case "formatting":
      return "Finalizing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "processing":
      return formatBackendStatus(status.rawStatus);
  }
}

function estimateProgress(status: JobStatus, attempt: number) {
  if (typeof status.progress === "number") {
    return status.progress;
  }

  switch (status.status) {
    case "queued":
      return 15;
    case "uploading":
      return 24;
    case "extracting":
      return 44;
    case "generating":
      return 66;
    case "formatting":
      return 84;
    case "completed":
      return 100;
    case "failed":
      return 100;
    case "processing":
      return Math.min(90, 20 + attempt * 6);
  }
}

function formatBackendStatus(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function waitForPollInterval() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 1000);
  });
}

function saveBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getFileStem(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "notes";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please retry.";
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}
