import { customAlphabet } from 'nanoid';

export const createShortID = (length: number) =>
  customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    length,
  ) as () => string;
