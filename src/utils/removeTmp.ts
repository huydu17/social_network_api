import fs from 'fs';
export const removeTmp = async (path: string) => {
  await fs.promises.unlink(path);
};
