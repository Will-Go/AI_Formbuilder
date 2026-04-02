import { z } from "zod";

export const PasswordPolicySchema = z.object({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres") // Regla 1: Al menos 8 caracteres
    .nonempty("La contraseña es obligatoria") // General: Campo requerido
    .refine((val) => /[A-Z]/.test(val), {
      message: "La contraseña debe contener al menos una letra mayúscula", // Regla 2
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "La contraseña debe contener al menos una letra minúscula", // Regla 3
    })
    .refine((val) => /\d/.test(val), {
      message: "La contraseña debe contener al menos un número", // Regla 4
    })
    .refine((val) => /[!@#$%^&*()\-_=\+\[\]{}|\\;:'",<.>\/?]/.test(val), {
      message:
        "La contraseña debe contener al menos un carácter especial (!@#$%^&*()-_=+[]{}|\\;:'\",<.>/?).", // Regla 5
    }),
});
