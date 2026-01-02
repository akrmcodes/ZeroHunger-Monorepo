"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, type Variants } from "framer-motion";
import { HeartHandshake, Users, HandHeart, ArrowRight } from "lucide-react";
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
import { registerSchema, type RegisterSchema } from "@/lib/utils/validators";
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

const roles = [
    {
        value: "donor" as const,
        title: "Donor",
        description: "Share surplus food to make a direct impact.",
        Icon: HeartHandshake,
    },
    {
        value: "volunteer" as const,
        title: "Volunteer",
        description: "Pick up and deliver to those in need.",
        Icon: Users,
    },
    {
        value: "recipient" as const,
        title: "Recipient",
        description: "Access fresh, available donations nearby.",
        Icon: HandHeart,
    },
];

export function RegisterForm() {
    const { register: submitRegister } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            phone: "",
            role: "donor",
        },
    });

    const selectedRole = watch("role");

    const onSubmit = async (values: RegisterSchema) => {
        setSubmitting(true);
        try {
            await submitRegister(values);
            toast.success("Account created", { description: "Welcome to ZeroHunger." });
        } catch (err) {
            const apiErr = err as ApiError;
            toast.error(apiErr.message ?? "Unable to register");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardHeader>
                <CardTitle className="text-3xl font-semibold tracking-tight">Join the Movement</CardTitle>
            </CardHeader>
            <CardContent>
                <motion.form
                    onSubmit={handleSubmit(onSubmit)}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    <motion.div variants={itemVariants} className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Choose your role</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {roles.map(({ value, title, description, Icon }) => {
                                const active = selectedRole === value;
                                return (
                                    <motion.button
                                        key={value}
                                        type="button"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setValue("role", value, { shouldValidate: true })}
                                        className={`group rounded-xl border bg-card/60 p-4 text-left transition-all duration-200 ${active
                                            ? "border-emerald-500 ring-2 ring-emerald-500"
                                            : "border-border hover:border-emerald-400/70"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"
                                                    }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <div className="space-y-1">
                                                <p className="text-base font-semibold leading-tight">{title}</p>
                                                <p className="text-sm text-muted-foreground leading-snug">{description}</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                        {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" autoComplete="name" {...register("name")}
                            className="h-11" placeholder="Alex Morgan" />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" {...register("email")}
                            className="h-11" placeholder="you@example.com" />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                {...register("password")}
                                className="h-11"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                {...register("password_confirmation")}
                                className="h-11"
                                placeholder="••••••••"
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")}
                            className="h-11" placeholder="+1 555 123 4567" />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button type="submit" className="w-full h-11" disabled={submitting}>
                                {submitting ? "Creating account..." : "Create Account"}
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="h-px flex-1 bg-border" />
                        <span>Already a member?</span>
                        <div className="h-px flex-1 bg-border" />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link href={"/login" as Route}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                    Sign In <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </motion.form>
            </CardContent>
        </Card>
    );
}

export default RegisterForm;
