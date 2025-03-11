import crypto from 'crypto';
export const generateRadomHex = (str: string) => {
  return crypto.randomBytes(32).toString('hex') + str;
};
