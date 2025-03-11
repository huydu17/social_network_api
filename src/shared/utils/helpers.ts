import { User } from 'src/features/users/models/user.schema';

export class Helpers {
  public static lowerCase(str: string): string {
    return str.toLowerCase();
  }
  public static removeQuetes(str: string) {
    return str.replace(/^"([^"]+)"/, '$1');
  }
  public static async validateUsername(userName: string) {
    const rmWhiteSpace = userName.split(' ').join('');
    let newFormatUsername = this.toLowerCaseNonAccentVietnamese(rmWhiteSpace);
    const maxRandom = 123456789;
    let existingUser;
    do {
      existingUser = await User.findOne({ userName: newFormatUsername });
      if (existingUser) {
        newFormatUsername += Math.floor(Math.random() * maxRandom)
          .toString()
          .charAt(0);
      }
    } while (existingUser);
    return newFormatUsername;
  }
  public static parseJson(prop: string) {
    try {
      JSON.parse(prop);
    } catch (error) {
      return prop;
    }
    return JSON.parse(prop);
  }

  public static toLowerCaseNonAccentVietnamese(str: string) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
    return str;
  }
}
