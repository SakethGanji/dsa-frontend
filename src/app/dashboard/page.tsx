import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DatasetsDisplay } from "@/components/datasets-display"; // <-- Import the new component

export default function Page() {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="border-1 border-solid">
                <SiteHeader />
                <div className="flex flex-1 flex-col ">
                    {/* This @container div can remain. The gap-2 might not be needed if DatasetsDisplay is the only child in the padded div. */}
                    <div className="@container/main flex flex-1 flex-col">
                        {/* This div will provide padding around your DatasetsDisplay component.
                            It takes the py-4/md:py-6 from your original structure and adds px for horizontal padding.
                            The gap properties are removed as DatasetsDisplay is the sole child here. */}
                        <div className="flex flex-col pt-0 pb-4 md:pb-6 px-4 lg:px-6"> {/* Adjusted padding based on original structure */}
                            <DatasetsDisplay />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}