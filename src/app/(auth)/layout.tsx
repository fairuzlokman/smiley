import { Smile } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-center gap-2 font-heading text-2xl text-heading">
          <Smile className="size-8 text-primary" aria-hidden="true" />
          Smile Score
        </div>
        <Card>{children}</Card>
      </div>
    </main>
  );
}
