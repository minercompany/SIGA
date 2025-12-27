"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { RefreshCcw } from "lucide-react";
import { ImportProvider } from "@/context/ImportContext";
import ImportStatusFloating from "@/components/ImportStatusFloating";
import ForcePasswordChange from "@/components/auth/ForcePasswordChange";

export default function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (!token) {
            setAuthorized(false);
            router.push("/login");
        } else {
            if (userData) {
                setUser(JSON.parse(userData));
            }
            setAuthorized(true);
        }
    }, [pathname, router]);

    if (!authorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCcw className="h-10 w-10 animate-spin text-teal-600" />
                    <p className="text-teal-700 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <ImportProvider>
            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
                {user?.requiresPasswordChange && (
                    <ForcePasswordChange onSuccess={() => setUser({ ...user, requiresPasswordChange: false })} />
                )}
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        <div className="animate-fade-in">
                            {children}
                        </div>
                    </main>
                    <ImportStatusFloating />
                </div>
            </div>
        </ImportProvider>
    );
}
