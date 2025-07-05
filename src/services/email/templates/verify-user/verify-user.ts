import ejs from 'ejs';
import fs from 'fs';
class VerifyTemplate {
  public verifyTemplate(username: string, code: number) {
    return ejs.render(fs.readFileSync(__dirname + '/verify-user.ejs', 'utf-8'), {
      username,
      code
    });
  }
}
export const verifyTemplate: VerifyTemplate = new VerifyTemplate();
