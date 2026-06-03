import { resend } from './resend'

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const { error } = await resend.emails.send({
    from: 'DevStash <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin-bottom:8px">Reset your password</h2>
        <p style="color:#6b7280;margin-bottom:24px">
          Click the button below to reset your password. The link expires in 1&nbsp;hour.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:500">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">
          Or copy this link:<br/>
          <a href="${resetUrl}" style="color:#6b7280;word-break:break-all">${resetUrl}</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">
          If you didn&apos;t request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[resend]', error)
    throw new Error(error.message)
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyUrl: string,
) {
  const { error } = await resend.emails.send({
    from: 'DevStash <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin-bottom:8px">Welcome to DevStash, ${name}!</h2>
        <p style="color:#6b7280;margin-bottom:24px">
          Click the button below to verify your email address. The link expires in 24&nbsp;hours.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:500">
          Verify Email
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">
          Or copy this link:<br/>
          <a href="${verifyUrl}" style="color:#6b7280;word-break:break-all">${verifyUrl}</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">
          If you didn&apos;t create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[resend]', error)
    throw new Error(error.message)
  }
}
