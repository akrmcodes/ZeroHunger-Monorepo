"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginSchemaType } from "@/lib/utils/validators";
import type { ApiError } from "@/types/api";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

export function LoginForm() {
    const { login } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginSchemaType>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    });

    const onSubmit = async (values: LoginSchemaType) => {
        setSubmitting(true);
        try {
            await login(values, values.remember || false);
            toast.success("Welcome back", { description: "You are now signed in." });
        } catch (err) {
            const apiErr = err as ApiError;
            toast.error(apiErr.message ?? "Unable to sign in");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardHeader>
                <CardTitle className="text-3xl font-semibold tracking-tight">Welcome Back</CardTitle>
            </CardHeader>
            <CardContent>
                <motion.form
                    onSubmit={handleSubmit(onSubmit)}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" {...register("email")}
                            className="h-11" placeholder="you@example.com" />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" autoComplete="current-password" {...register("password")}
                            className="h-11" placeholder="••••••••" />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 font-medium text-foreground">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border accent-emerald-600"
                                {...register("remember")}
                            />
                            Remember me
                        </label>
                        <Link href={"/forgot-password" as Route} className="text-emerald-600 hover:text-emerald-700">
                            Forgot password?
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button type="submit" className="w-full h-11" disabled={submitting}>
                                {submitting ? "Signing in..." : "Sign In"}
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="h-px flex-1 bg-border" />
                        <span>New to ZeroHunger?</span>
                        <div className="h-px flex-1 bg-border" />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link href={"/register" as Route}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                    Join the Movement <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </motion.form>
            </CardContent>
        </Card>
    );
}

export default LoginForm;
