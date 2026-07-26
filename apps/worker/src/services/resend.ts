import { Resend } from 'resend'

export async function sendVerificationCodeEmail(apiKey: string, toEmail: string, code: string) {
  const resend = new Resend(apiKey)
  const htmlContent = `
    <div style="background-color: #090d16; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; box-sizing: border-box;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="padding: 28px 32px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #0b1120;">
            <span style="font-size: 26px; font-weight: 900; color: #c084fc; letter-spacing: -0.5px;">Briefr</span>
            <span style="font-size: 11px; font-weight: 700; color: #a855f7; background: rgba(168, 85, 247, 0.15); padding: 4px 10px; border-radius: 20px; margin-left: 8px; border: 1px solid rgba(168, 85, 247, 0.3); vertical-align: middle;">PROJE HAFIZASI</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 32px;">
            <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">E-posta Adresinizi Doğrulayın</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
              Briefr hesabınızı aktifleştirmek ve projenize erişmek için aşağıdaki 6 haneli doğrulama kodunu uygulamaya girin:
            </p>
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
              <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #38bdf8; font-family: 'Courier New', Courier, monospace;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
              Bu kodu siz talep etmediyseniz lütfen bu e-postayı dikkate almayın. Doğrulama kodu güvenlik sebebiyle 15 dakika geçerlidir.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 12px;">
            © ${new Date().getFullYear()} Briefr. Tüm hakları saklıdır. — <a href="https://briefr.onurd.com.tr" style="color: #c084fc; text-decoration: none; font-weight: 600;">briefr.onurd.com.tr</a>
          </td>
        </tr>
      </table>
    </div>
  `

  try {
    const res = await resend.emails.send({
      from: 'Briefr <briefr@onurd.com.tr>',
      to: toEmail,
      subject: `Briefr E-posta Doğrulama Kodu: ${code} 🔐`,
      html: htmlContent,
    })
    if (res.error) throw new Error(res.error.message)
  } catch (err: any) {
    console.warn('Resend primary sender warning (briefr@onurd.com.tr):', err?.message || err)
    // Automatic fallback to Resend testing sender if domain is unverified
    const fallbackRes = await resend.emails.send({
      from: 'Briefr <onboarding@resend.dev>',
      to: toEmail,
      subject: `Briefr E-posta Doğrulama Kodu: ${code} 🔐`,
      html: htmlContent,
    })
    if (fallbackRes.error) {
      console.error('Resend fallback sender error:', fallbackRes.error)
      throw new Error(`Resend E-posta Gönderim Hatası: ${fallbackRes.error.message}`)
    }
  }
}

export async function sendWelcomeEmail(apiKey: string, toEmail: string, fullName: string, frontendUrl: string) {
  const resend = new Resend(apiKey)
  const htmlContent = `
    <div style="background-color: #090d16; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; box-sizing: border-box;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="padding: 28px 32px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #0b1120;">
            <span style="font-size: 26px; font-weight: 900; color: #c084fc; letter-spacing: -0.5px;">Briefr</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 32px; text-align: center;">
            <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">Merhaba ${fullName}! 👋</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              Briefr ailesine hoş geldiniz. İlk projenizi oluşturarak tüm Slack, Gmail ve Notion kaynaklarınızı akıllı hafızaya bağlamaya başlayabilirsiniz.
            </p>
            <a href="${frontendUrl}/onboarding" style="display: inline-block; background: linear-gradient(to right, #9333ea, #6366f1); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
              Kuruluma Başla →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 12px;">
            © ${new Date().getFullYear()} Briefr. Tüm hakları saklıdır.
          </td>
        </tr>
      </table>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'Briefr <briefr@onurd.com.tr>',
      to: toEmail,
      subject: "Briefr'a Hoş Geldiniz 🧠",
      html: htmlContent,
    })
  } catch {
    try {
      await resend.emails.send({
        from: 'Briefr <onboarding@resend.dev>',
        to: toEmail,
        subject: "Briefr'a Hoş Geldiniz 🧠",
        html: htmlContent,
      })
    } catch { /* optional */ }
  }
}

export async function sendInviteEmail(apiKey: string, toEmail: string, workspaceName: string, inviterName: string, frontendUrl: string) {
  const resend = new Resend(apiKey)
  const htmlContent = `
    <div style="background-color: #090d16; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; box-sizing: border-box;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="padding: 28px 32px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #0b1120;">
            <span style="font-size: 26px; font-weight: 900; color: #c084fc; letter-spacing: -0.5px;">Briefr</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 32px; text-align: center;">
            <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">Çalışma Alanına Davet Edildiniz! 🚀</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              <strong style="color: #f8fafc;">${inviterName}</strong> sizi <strong style="color: #c084fc;">${workspaceName}</strong> çalışma alanına katılması için davet etti.
            </p>
            <a href="${frontendUrl}/login" style="display: inline-block; background: linear-gradient(to right, #9333ea, #6366f1); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
              Giriş Yap ve Katıl →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 12px;">
            © ${new Date().getFullYear()} Briefr. Tüm hakları saklıdır.
          </td>
        </tr>
      </table>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'Briefr <briefr@onurd.com.tr>',
      to: toEmail,
      subject: `${inviterName} sizi ${workspaceName} çalışma alanına davet etti 🚀`,
      html: htmlContent,
    })
  } catch {
    try {
      await resend.emails.send({
        from: 'Briefr <onboarding@resend.dev>',
        to: toEmail,
        subject: `${inviterName} sizi ${workspaceName} çalışma alanına davet etti 🚀`,
        html: htmlContent,
      })
    } catch { /* optional */ }
  }
}
