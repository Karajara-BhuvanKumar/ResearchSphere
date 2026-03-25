import type { LucideIcon } from "lucide-react";

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHero = ({ icon: Icon, title, description }: PageHeroProps) => {
  return (
    <section className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center bg-muted">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageHero;
