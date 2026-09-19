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
    expiresOn: 'Expires %{date}',
    expired: 'Expired',
    spend: 'Spend',
    spendAmount: 'Amount',
    spendPlaceholder: '0.00',
    spendNote: 'Note',
    spendNotePlaceholder: 'Optional note',
    spendInvalid: 'Enter an amount greater than zero',
    overspendTitle: 'Record overspend?',
    overspendBody:
      'This spend is larger than the remaining balance. The balance will go negative.',
    recordOverspend: 'Record overspend',
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
    notifChannelName: 'Expiry reminders',
    notifWeeklyTitle: 'Balance reminder',
    notifWeeklyBodySome:
      'You have %{count} item(s) expired or expiring within 14 days. Open Balance to review.',
    notifWeeklyBodyNone:
      "Nothing expired or expiring within 14 days. You're all set.",
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
    expiresOn: 'פג תוקף %{date}',
    expired: 'פג תוקף',
    spend: 'מימוש',
    spendAmount: 'סכום',
    spendPlaceholder: '0.00',
    spendNote: 'הערה',
    spendNotePlaceholder: 'הערה אופציונלית',
    spendInvalid: 'הזן סכום גדול מאפס',
    overspendTitle: 'לרשום חריגה?',
    overspendBody: 'המימוש גדול מהיתרה. היתרה תהפוך לשלילית.',
    recordOverspend: 'רשום חריגה',
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
    notifChannelName: 'תזכורות תוקף',
    notifWeeklyTitle: 'תזכורת Balance',
    notifWeeklyBodySome:
      'יש לך %{count} פריטים שפג תוקפם או שיפוג תוקפם בתוך 14 יום. פתח את Balance לבדיקה.',
    notifWeeklyBodyNone:
      'אין פריטים שפג תוקפם או שיפוג תוקפם בתוך 14 יום. הכול בסדר.',
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
