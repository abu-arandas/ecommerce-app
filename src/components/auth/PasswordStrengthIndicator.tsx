import React from 'react';
import { calculatePasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from '@/utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const text = getPasswordStrengthText(strength);
  const colorClass = getPasswordStrengthColor(strength);

  return (
    <div className="mt-2">
      <div className={`password-strength-bar ${strength}`} />
      <p className={`text-xs mt-1 ${colorClass} font-medium`}>{text}</p>
    </div>
  );
}
