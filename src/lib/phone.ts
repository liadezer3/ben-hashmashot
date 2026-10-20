import { z } from "zod";

export const PHONE_ERROR = "מספר טלפון לא תקין — הזינו 05X-XXXXXXX או מספר בינלאומי שמתחיל ב-+";

/** Strip spaces, dashes, dots and parentheses. */
export const cleanPhone = (raw: string) => raw.replace(/[\s\-().]/g, "");

/** Israeli mobile 05XXXXXXXX, 9725XXXXXXXX, or international +<8-15 digits>. */
export const isValidPhone = (raw: string) => {
  const p = cleanPhone(raw);
  return /^05\d{8}$/.test(p) || /^9725\d{8}$/.test(p) || /^\+[1-9]\d{7,14}$/.test(p);
};

export const phoneSchema = z
  .string()
  .trim()
  .max(25, PHONE_ERROR)
  .refine(isValidPhone, PHONE_ERROR)
  .transform(cleanPhone);

/** Optional field: empty → null, otherwise must be valid. */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(25, PHONE_ERROR)
  .refine((v) => v === "" || isValidPhone(v), PHONE_ERROR)
  .transform((v) => (v === "" ? null : cleanPhone(v)));
