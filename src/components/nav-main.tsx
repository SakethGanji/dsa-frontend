import { type Icon } from "@tabler/icons-react"
import { Link, useMatchRoute } from '@tanstack/react-router'
import { cn } from "@/lib/utils"

// import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const matchRoute = useMatchRoute()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = matchRoute({ to: item.url, fuzzy: true })
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link 
                    to={item.url} 
                    className={cn(
                      "flex items-center gap-2 relative transition-all duration-200 p-2",
                      "group hover:bg-muted/50 rounded-md",
                      isActive && "border border-primary/50 bg-primary/5 font-medium"
                    )}
                  >
                    {item.icon && <item.icon className={cn(
                      "transition-colors",
                      isActive && "text-primary"
                    )} />}
                    <span className={cn(
                      "transition-colors", 
                      isActive && "text-primary"
                    )}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
