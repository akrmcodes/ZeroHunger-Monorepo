"use client";

import { motion, type Variants } from "framer-motion";
import RegisterForm from "@/components/auth/RegisterForm";

const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
    },
};

const pageTransition = {
    duration: 0.5,
    ease: "easeOut" as const,
};

export default function RegisterPage() {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            <div className="space-y-2 text-center lg:text-left">
                <p className="text-sm font-medium text-emerald-600">ZeroHunger</p>
                <h1 className="text-4xl font-bold tracking-tight">Join the Movement</h1>
                <p className="text-muted-foreground">
                    Become a donor, volunteer, or recipient and help us end hunger together.
                </p>
            </div>
            <RegisterForm />
        </motion.div>
    );
}
