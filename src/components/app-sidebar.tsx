import * as React from "react"
import {
  IconTable,
  IconChartScatter, IconChartDots, IconCode,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStatus } from "@/hooks/use-auth"; // Added import

// Simplified data structure for the sidebar
const sidebarData = {
  // user: { // This will be replaced by the authenticated user
  //   name: "saketh",
  //   email: "bg54677",
  //   avatar: "/avatars/shadcn.jpg",
  // },
  // Upper section tabs: Datasets, Exploration, Outputs
  upperNavItems: [
    {
      title: "Datasets",
      url: "/", // Root route for datasets
      icon: IconTable,
    },
    {
      title: "Exploration",
      url: "/exploration",
      icon: IconChartDots,
    },
    {
      title: "Sampling",
      url: "/sampling",
      icon: IconChartScatter,
    },
    {
      title: "Workbench",
      url: "/workbench",
      icon: IconCode,
    },
  ],
  // Bottom part of nav bar (Settings, Get Help, Search)
  secondaryNavItems: [
    // {
    //   title: "Settings",
    //   url: "#settings", // Replace with actual URLs
    //   icon: IconSettings,
    // },
    // {
    //   title: "Get Help",
    //   url: "#help", // Replace with actual URLs
    //   icon: IconHelp,
    // },
    // {
    //   title: "Search",
    //   url: "#search", // Replace with actual URLs
    //   icon: IconSearch,
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated, isLoading } = useAuthStatus(); // Get user data from hook
  return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          {/* This section is kept, potentially the "quick create" you mentioned */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:!p-1.5 group"
              >
                <a href="#" className="flex items-center gap-2">
                  {/*<img */}
                  {/*  src="/logo.png" */}
                  {/*  alt="Logo"*/}
                  {/*  className="w-6 h-6"*/}
                  {/*/>*/}
                  <span className="text-sm font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md group-hover:shadow-md transition-all">
                    AI Accelerator
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Upper section with 3 tabs */}
          <NavMain items={sidebarData.upperNavItems} />


          {/* Bottom part of nav bar (within content scroll area) - kept as is */}
          <NavSecondary items={sidebarData.secondaryNavItems} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          {/* Bottom part of nav bar (fixed footer) - NavUser kept as is */}
          {isAuthenticated && !isLoading && user && <NavUser user={{name: user.sub || "User", email: user.role_name ? `Role: ${user.role_name}` : "Role: N/A", avatar: "/avatars/shadcn.jpg"}} />}
        </SidebarFooter>
      </Sidebar>
  )
}
