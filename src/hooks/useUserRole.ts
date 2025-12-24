"use client";

import { useAuth } from "@/hooks/useAuth";

export const useUserRole = () => {
  const { user, isLoading } = useAuth();
  const role = user?.roles?.[0];

  return {
    role,
    isDonor: role === "donor",
    isVolunteer: role === "volunteer",
    isRecipient: role === "recipient",
    isLoading,
  } as const;
};
