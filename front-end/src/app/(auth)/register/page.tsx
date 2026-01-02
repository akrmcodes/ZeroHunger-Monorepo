"use client";

import { motion } from "framer-motion";
import RegisterForm from "@/components/auth/RegisterForm";

const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

export default function RegisterPage() {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
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
