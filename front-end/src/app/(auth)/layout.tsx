"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="grid min-h-screen lg:grid-cols-2"
            >
                <div className="relative hidden overflow-hidden bg-emerald-900 lg:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-700/80 to-emerald-500/70" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_10%_70%,rgba(255,255,255,0.05),transparent_25%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
                    <div className="relative z-10 flex h-full flex-col justify-between p-12 text-emerald-50">
                        <div className="space-y-4">
                            <p className="text-sm uppercase tracking-[0.3em] text-emerald-100/70">ZeroHunger</p>
                            <h1 className="text-4xl font-semibold leading-tight drop-shadow-md">
                                &ldquo;Ending hunger starts with one shared act of generosity.&rdquo;
                            </h1>
                        </div>
                        <div className="space-y-2 text-emerald-50/80">
                            <p className="text-lg font-medium">Together we build a world without waste.</p>
                            <p className="text-sm">Donors, volunteers, and recipients connected by purpose.</p>
                        </div>
                    </div>
                </div>

                <div className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
                    <div className="absolute inset-0 lg:hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-emerald-800/50 to-emerald-600/40" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.05),transparent_30%)]" />
                    </div>
                    <div className="relative z-10 w-full max-w-lg">
                        {children}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
