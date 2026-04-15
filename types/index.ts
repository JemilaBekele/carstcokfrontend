import { Icons } from '@/components/icons';

export type NavItem = {
  title: string;
  url: string;
  icon?: keyof typeof Icons;
  disabled?: boolean;
  description?: string;
  external?: boolean;
  isActive?: boolean;
  shortcut?: string[];
  items?: NavItem[];
  permission?: string; // Single permission required
  permissions?: string[]; // Multiple permissions required
  permissionMode?: 'all' | 'any'; // How to evaluate multiple permissions
};

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
