type PasswordValidation = { ok: true } | { ok: false; error: string }

export function validateNewPassword(
  password: string,
  confirmPassword: string,
): PasswordValidation {
  if (password !== confirmPassword) return { ok: false, error: 'Passwords do not match.' }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
  return { ok: true }
}
