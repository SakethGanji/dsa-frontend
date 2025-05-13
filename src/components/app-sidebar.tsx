import * as React from "react"
import {
  // Keep only necessary icons
  IconChartBar,
  IconDatabase,
  // IconHelp,
  IconInnerShadowTop,
  IconReport,
  // IconSearch,
  // IconSettings,
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

// Simplified data structure for the sidebar
const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  // Upper section tabs: Datasets, Exploration, Outputs
  upperNavItems: [
    {
      title: "Datasets",
      url: "/", // Root route for datasets
      icon: IconDatabase,
    },
    {
      title: "Exploration",
      url: "/exploration",
      icon: IconChartBar,
    },
    {
      title: "Sampling",
      url: "/sampling",
      icon: IconReport,
    },
    {
      title: "Outputs",
      url: "/outputs",
      icon: IconReport,
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
  return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          {/* This section is kept, potentially the "quick create" you mentioned */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="#">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">name</span>
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
          <NavUser user={sidebarData.user} />
        </SidebarFooter>
      </Sidebar>
  )
}