"use client";

import { useEffect, useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const { isMaintenanceMode, isLoading } = useConfig();
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Wait for config to load
        if (isLoading) return;

        // White-listed routes that are always accessible
        // /login is needed for Admins to log in
        // /maintenance is the target page
        if (pathname === "/maintenance" || pathname === "/login") {
            // Check if we are in maintenance page but mode is OFF -> redirect to dashboard
            if (pathname === "/maintenance" && !isMaintenanceMode) {
                router.replace("/dashboard");
                return;
            }
            setChecked(true);
            return;
        }

        if (isMaintenanceMode) {
            const userStr = localStorage.getItem("user");
            let isSuperAdmin = false;

            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // Check if Super Admin
                    if (user.rol === "SUPER_ADMIN") {
                        isSuperAdmin = true;
                    }
                } catch (e) {
                    console.error("Error parsing user data");
                }
            }

            if (!isSuperAdmin) {
                // If not Admin, redirect to Maintenance
                router.replace("/maintenance");
                return;
            }
            // If Admin, proceed
        }

        setChecked(true);
    }, [isMaintenanceMode, isLoading, pathname, router]);

    // Show Loader while checking config
    if (isLoading || !checked) {
        // If we are already on the maintenance page, we could show it, but it's better to verify status first to avoid flashing it if maintenance is OFF.
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return <>{children}</>;
}
