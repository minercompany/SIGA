"use client";

export default function PublicLayout({
    children,
}: {
    children: JSX.Element;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {children}
        </div>
    );
}
