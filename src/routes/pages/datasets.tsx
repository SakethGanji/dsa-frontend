import { DatasetsDisplay } from "@/components/datasets-display"
import { PageTransition } from "@/components/page-transition"

export function DatasetsPage() {
  return (
    <PageTransition>
      <DatasetsDisplay />
    </PageTransition>
  )
}