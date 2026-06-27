export type MockUploadJob = {
  jobId: string;
  fileName: string;
  status: "queued";
};

export type MockJobStatus = {
  jobId: string;
  status: "processing";
};

export type MockDownload = {
  fileName: string;
  mimeType: string;
};

export async function uploadPDF(file: File): Promise<MockUploadJob> {
  await wait(120);

  return {
    jobId: "mock-upload-job",
    fileName: file.name,
    status: "queued",
  };
}

export async function getJobStatus(jobId: string): Promise<MockJobStatus> {
  await wait(80);

  return {
    jobId,
    status: "processing",
  };
}

export async function downloadMarkdown(): Promise<MockDownload> {
  await wait(80);

  return {
    fileName: "lecture-notes.md",
    mimeType: "text/markdown",
  };
}

export async function downloadPDF(): Promise<MockDownload> {
  await wait(80);

  return {
    fileName: "lecture-notes.pdf",
    mimeType: "application/pdf",
  };
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
