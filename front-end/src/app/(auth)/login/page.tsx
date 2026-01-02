"use client";

import { motion } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";

const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

export default function LoginPage() {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            className="space-y-6"
        >
            <div className="space-y-2 text-center lg:text-left">
                <p className="text-sm font-medium text-emerald-600">ZeroHunger</p>
                <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
                <p className="text-muted-foreground">Sign in to coordinate donations and deliveries.</p>
            </div>
            <LoginForm />
        </motion.div>
    );
}
