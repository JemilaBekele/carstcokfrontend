import type { IBranch } from "@/models/Branch";
import type { IShop } from "@/models/shop";
import type { IStore } from "@/models/store";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  roleType?: string;
  role?: string;
  permissions: string[];
  branch?: IBranch | null;
  shops?: IShop[];
  stores?: IStore[];
  lastLoginAt?: string;
};

export type BackendRole =
  | string
  | {
      id?: string;
      name?: string;
      description?: string;
    }
  | null;

export type BackendAuthUser = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  roleType?: string;
  role?: BackendRole;
  permissions?: string[];
  branch?: IBranch | null;
  shops?: IShop[];
  stores?: IStore[];
  lastLoginAt?: string;
};
