import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import authConfig from "@/auth.config";

export const metadata: Metadata = {
  title: "Next Shadcn Dashboard Starter",
  description: "Basic dashboard with Next.js and Shadcn",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  // const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

  // Fetch session inside the layout
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <KBar>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar session={session} />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
