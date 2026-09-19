import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  en: {
    title: 'Balance',
    subtitle: 'Gift cards & store credit',
    empty: 'No entries yet',
    emptyHint: 'Add one in the next build (ME-4).',
    loading: 'Loading…',
    dbError: 'Could not open the database',
    detail: 'Details',
    history: 'Spend history',
    noHistory: 'No spends yet',
    type: 'Type',
    merchant: 'Merchant',
    accepting: 'Also accepted at',
    balance: 'Balance',
    currency: 'Currency',
    expiry: 'Expires',
    codeNote: 'Code / note',
    none: '—',
    override: 'override',
    types: {
      gift_card: 'Gift card',
      store_credit: 'Store credit',
      voucher: 'Voucher',
      other: 'Other',
    },
  },
  he: {
    title: 'Balance',
    subtitle: 'כרטיסי מתנה וזיכוי חנות',
    empty: 'אין רשומות עדיין',
    emptyHint: 'הוספה תגיע ב־ME-4.',
    loading: 'טוען…',
    dbError: 'לא ניתן לפתוח את מסד הנתונים',
    detail: 'פרטים',
    history: 'היסטוריית מימוש',
    noHistory: 'אין מימושים עדיין',
    type: 'סוג',
    merchant: 'בית עסק',
    accepting: 'מתקבל גם ב',
    balance: 'יתרה',
    currency: 'מטבע',
    expiry: 'תוקף',
    codeNote: 'קוד / הערה',
    none: '—',
    override: 'חריגה',
    types: {
      gift_card: 'כרטיס מתנה',
      store_credit: 'זיכוי חנות',
      voucher: 'שובר',
      other: 'אחר',
    },
  },
});

i18n.defaultLocale = 'en';
i18n.enableFallback = true;
const code = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.locale = code === 'he' ? 'he' : code;

export default i18n;

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
