import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from || "SmallLet <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Email exception:", err);
    return { success: false, error: err };
  }
};
