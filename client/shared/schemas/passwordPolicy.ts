import { z } from "zod";

export const PasswordPolicySchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long") // Regla 1: Al menos 8 caracteres
    .nonempty("Password is required") // General: Campo requerido
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter", // Regla 2
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must contain at least one lowercase letter", // Regla 3
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must contain at least one number", // Regla 4
    })
    .refine((val) => /[!@#$%^&*()\-_=\+\[\]{}|\\;:'",<.>\/?]/.test(val), {
      message:
        "Password must contain at least one special character (!@#$%^&*()-_=+[]{}|\\;:'\",<.>/?).", // Regla 5
    }),
});

export type passwordPolicy = z.infer<typeof PasswordPolicySchema>;
