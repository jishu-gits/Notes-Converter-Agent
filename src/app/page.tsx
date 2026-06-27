import { UploadCard } from "@/components/upload/upload-card";
import { AppShell } from "@/shared/layouts/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <section className="flex flex-1 items-start py-8">
        <UploadCard />
      </section>
    </AppShell>
  );
}
