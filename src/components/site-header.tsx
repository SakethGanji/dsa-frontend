import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../components/providers/auth-provider"
import { useDatasetContext } from "@/contexts/DatasetContext"
import { LogOut, Database, GitBranch, X, ChevronRight } from "lucide-react"

export function SiteHeader() {
  const { logout, user } = useAuth();
  const { selectedDataset, selectedVersion, clearSelection } = useDatasetContext();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Datasets</h1>
        
        {/* Show selected dataset info */}
        {selectedDataset && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedDataset.name}</span>
              {selectedVersion && (
                <>
                  <GitBranch className="h-3 w-3 text-muted-foreground ml-1" />
                  <Badge variant="secondary" className="text-xs h-5">
                    v{selectedVersion.version_number}
                  </Badge>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <span className="text-sm mr-2">Role: {user.role_id || "N/A"}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="flex items-center gap-1"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}