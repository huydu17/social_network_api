import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { appConfig } from 'src/shared/config/appConfig';
import { BadRequestException } from 'src/shared/middlewares/globalErrorHandle';
interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}
class MailTransport {
  public async sendMail(to: string, subject: string, html: string) {
    const transporter: Mail = nodemailer.createTransport({
      host: appConfig.HOST,
      port: 587,
      secure: false,
      auth: {
        user: appConfig.MAIL_USER,
        pass: appConfig.MAIL_PASSWORD
      }
    });
    const mailOptions: IMailOptions = {
      from: appConfig.MAIL_SENDER!,
      to,
      subject,
      html
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new BadRequestException('Error sending email');
    }
  }
}

export const mailTransport: MailTransport = new MailTransport();
