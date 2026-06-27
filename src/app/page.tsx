import { AppShell } from "@/shared/layouts/app-shell";
import { PageSection } from "@/shared/layouts/page-section";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { siteConfig } from "@/config/site";
import { CheckCircle2, Layers3, Palette, ShieldCheck } from "lucide-react";

const foundationAreas = [
  {
    title: "Architecture",
    description:
      "Feature folders, shared primitives, services, and config are separated by responsibility.",
    icon: Layers3,
  },
  {
    title: "Design System",
    description:
      "Semantic tokens define color, spacing, radius, elevation, and motion for light and dark mode.",
    icon: Palette,
  },
  {
    title: "Standards",
    description:
      "TypeScript, ESLint, Prettier, environment templates, and documentation are ready for Phase 1.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <PageSection
        eyebrow="Phase 0"
        title={siteConfig.name}
        description="The project foundation is ready for feature work after review. This screen intentionally avoids upload, AI, conversion, authentication, and backend behavior."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {foundationAreas.map((area) => {
            const Icon = area.icon;

            return (
              <Card key={area.title}>
                <CardHeader>
                  <div className="bg-accent text-accent-foreground mb-3 flex size-10 items-center justify-center rounded-md">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <CardTitle>{area.title}</CardTitle>
                  <CardDescription>{area.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Foundation Status</CardTitle>
              <CardDescription>
                The repository contains only architectural scaffolding and
                documentation for this phase.
              </CardDescription>
            </div>
            <Badge variant="success">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              Ready for review
            </Badge>
          </CardHeader>
          <CardContent className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-2">
            <span>Next.js App Router</span>
            <span>Tokenized Tailwind CSS</span>
            <span>shadcn-style primitives</span>
            <span>Documented state strategy</span>
          </CardContent>
        </Card>
      </PageSection>
    </AppShell>
  );
}
