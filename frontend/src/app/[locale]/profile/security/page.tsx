"use client";

import React from "react";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { SecurityDashboard } from "@/components/Security/SecurityDashboard";

export default function SecurityPage() {
    return (
        <main className="min-h-screen bg-stellar-navy pb-20 pt-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/profile/settings"
                        className="rounded-full bg-stellar-lightNavy p-2 text-stellar-slate transition-colors hover:text-stellar-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-gold-400" />
                        <h1 className="text-2xl font-bold text-stellar-white">
                            Security & Privacy
                        </h1>
                    </div>
                </div>

                <SecurityDashboard />
            </div>
        </main>
    );
}
