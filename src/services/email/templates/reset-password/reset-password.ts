import ejs from 'ejs';
import fs from 'fs';
class ResetTemplate {
  public resetPasswordTemplate(username: string, resetLink: string) {
    return ejs.render(fs.readFileSync(__dirname + '/reset-password.ejs', 'utf-8'), {
      username,
      resetLink
    });
  }
}
export const resetTemplate: ResetTemplate = new ResetTemplate();
