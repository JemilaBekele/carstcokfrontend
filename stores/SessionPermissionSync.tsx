'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissionStore } from '@/stores/auth.store';
import { clientApi } from '@/service/client'; // import your axios/api instance

export default function SessionPermissionSync() {
  const { data: session } = useSession();
  const setPermissions = usePermissionStore((state) => state.setPermissions);

  // Inline function to fetch permissions by role name
  const fetchPermissionsByRoleName = async (
    roleName: string
  ): Promise<string[]> => {
    try {
      const res = await clientApi.get(`/roles/${roleName}/permissions`);
      return res.data.permissions as string[];
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    if (session?.user?.role) {
      const roleName = String(session.user.role || '').trim();
      if (!roleName) {
        return;
      }

      fetchPermissionsByRoleName(roleName)
        .then((perms) => {
          setPermissions(perms);
        })
        .catch(() => undefined);
    }
  }, [session, setPermissions]);

  return null;
}
