"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import { navItems } from "@/constants/data";
import {
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconPhotoUp,
  IconUserCircle,
  IconLoader2,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Icons } from "../icons";
import { OrgSwitcher } from "../org-switcher";
import { usePermissionStore } from "@/stores/auth.store";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/service/authApi";
import { toast } from "sonner";
import { filterNavItemsWithCheckers } from "@/lib/filterNavItems";

export const company = {
  name: "Acme Inc",
  logo: IconPhotoUp,
  plan: "Enterprise",
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [filteredNavItems, setFilteredNavItems] = React.useState(navItems);
  const authUser = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.hydrated);

  const hasPermission = usePermissionStore((state) => state.hasPermission);
  const hasAnyPermission = usePermissionStore(
    (state) => state.hasAnyPermission,
  );
  const hasAllPermissions = usePermissionStore(
    (state) => state.hasAllPermissions,
  );
  const isInitialized = usePermissionStore((state) => state._isInitialized);
  const hasHydrated = usePermissionStore((state) => state._hasHydrated);
  const isLoading =
    !authHydrated || !hasHydrated || (authUser && !isInitialized);

  const filterNavItemsByPermissions = React.useCallback(() => {
    if (!hasHydrated || !authUser || !isInitialized) {
      return [];
    }
    return filterNavItemsWithCheckers(navItems, {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    });
  }, [
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasHydrated,
    authUser,
    isInitialized,
  ]);

  React.useEffect(() => {
    if (authUser && isInitialized) {
      setFilteredNavItems(filterNavItemsByPermissions());
    } else {
      setFilteredNavItems([]);
    }
  }, [authUser, filterNavItemsByPermissions, isInitialized]);

  const handleSignOut = async () => {
    try {
      toast.success("Signed out successfully");
      logout();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const user = authUser;

  if (!authUser || isLoading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 p-4">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading navigation...
            </p>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (filteredNavItems.length === 0 && authUser) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 p-4 text-center">
            <div className="rounded-full bg-muted p-3">
              <IconUserCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No Access</p>
              <p className="text-xs text-muted-foreground">
                You don&apos;t have permission to access any features
              </p>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Group items by their section label for clean visual separation
  const navGroups = filteredNavItems.reduce<
    Record<string, typeof filteredNavItems>
  >((acc, item) => {
    const section = item.group ?? "Overview";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {Object.entries(navGroups).map(([groupLabel, items]) => (
          <SidebarGroup key={groupLabel} className="py-0">
            <SidebarGroupLabel className="px-1.5 py-0 text-[11px]">
              {groupLabel}
            </SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                const isActive =
                  pathname === item.url ||
                  item.items?.some((child) => pathname === child.url) ||
                  false;

                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive}
                        >
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const SubIcon = subItem.icon
                              ? Icons[subItem.icon]
                              : undefined;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                >
                                  <Link href={subItem.url}>
                                    {SubIcon && <SubIcon className="h-4 w-4" />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url || "#"}>
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {user && (
                    <UserAvatarProfile
                      className="h-8 w-8 rounded-lg"
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="px-1 py-1.5">
                    {user && (
                      <UserAvatarProfile
                        className="h-8 w-8 rounded-lg"
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profile")}
                  >
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <IconLogout className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
