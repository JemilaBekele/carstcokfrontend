import RolePermissionForm from './form'; // Adjust path as needed

type RolePermissionViewPageProps = {
  id: string;
};

export default function RolePermissionViewPage({
  id
}: RolePermissionViewPageProps) {
  const pageTitle =
    id === 'new' ? 'Create New Role Permission' : 'Edit Role Permission';

  return <RolePermissionForm pageTitle={pageTitle} />;
}
