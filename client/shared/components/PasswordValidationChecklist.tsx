"use client";

import React from "react";
import { Typography } from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";

interface PasswordValidationChecklistProps {
  password: string;
  className?: string;
}

interface ValidationRule {
  id: string;
  label: string;
  isValid: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    isValid: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    isValid: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    isValid: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "At least one number",
    isValid: (password: string) => /\d/.test(password),
  },
  {
    id: "special",
    label: "At least one special character (!@#$%^&*)",
    isValid: (password: string) =>
      /[!@#$%^&*()\-_=\+\[\]{}|\\;:'\",<.>/?]/.test(password),
  },
];

export default function PasswordValidationChecklist({
  password,
  className = "",
}: PasswordValidationChecklistProps) {
  return (
    <div
      className={`mt-2 border border-neutral-200 bg-neutral-50 p-3 ${className}`}
    >
      <Typography variant="body2" className="mb-2 font-medium text-gray-700">
        Requisitos de Contraseña
      </Typography>

      <ul className="space-y-1">
        {validationRules.map((rule) => {
          const isValid = rule.isValid(password);
          return (
            <li key={rule.id} className="flex items-center gap-2">
              {isValid ? (
                <CheckCircle
                  className="text-success h-4 w-4"
                  fontSize="small"
                />
              ) : (
                <Cancel className="h-4 w-4 text-gray-400" fontSize="small" />
              )}

              <Typography
                variant="body2"
                className={`text-xs ${
                  isValid ? "text-success! line-through" : "text-gray-500"
                }`}
              >
                {rule.label}
              </Typography>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
