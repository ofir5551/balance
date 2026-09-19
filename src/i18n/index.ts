import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  en: {
    title: 'Balance',
    subtitle: 'Gift cards & store credit',
    empty: 'Nothing here yet',
    emptyHint: 'Your gift cards and store credit will show up here.',
    loading: 'Loading…',
    dbError: 'Could not load your balances',
    retry: 'Retry',
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
    soonExpiring: 'Expires soon',
    expired: 'Expired',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    createTitle: 'New entry',
    editTitle: 'Edit entry',
    required: 'Required',
    deleteConfirmTitle: 'Delete entry?',
    deleteConfirmBody: 'This removes the entry and its spend history.',
    acceptingPlaceholder: 'Add store',
    codeNotePlaceholder: 'Code or note',
    merchantPlaceholder: 'Merchant name',
    balancePlaceholder: '0.00',
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
    empty: 'עדיין אין כאן כלום',
    emptyHint: 'כרטיסי המתנה וזיכויי החנות יופיעו כאן.',
    loading: 'טוען…',
    dbError: 'לא ניתן לטעון את היתרות',
    retry: 'נסה שוב',
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
    soonExpiring: 'פג תוקף בקרוב',
    expired: 'פג תוקף',
    add: 'הוסף',
    edit: 'עריכה',
    delete: 'מחיקה',
    save: 'שמירה',
    cancel: 'ביטול',
    createTitle: 'רשומה חדשה',
    editTitle: 'עריכת רשומה',
    required: 'חובה',
    deleteConfirmTitle: 'למחוק רשומה?',
    deleteConfirmBody: 'פעולה זו תמחק את הרשומה ואת היסטוריית המימוש.',
    acceptingPlaceholder: 'הוסף חנות',
    codeNotePlaceholder: 'קוד או הערה',
    merchantPlaceholder: 'שם בית העסק',
    balancePlaceholder: '0.00',
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

export function isRtl(): boolean {
  return i18n.locale === 'he';
}
