export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "ur", label: "Urdu" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "bn", label: "Bengali" },
  { code: "id", label: "Indonesian" },
  { code: "de", label: "German" },
  { code: "tr", label: "Turkish" },
  { code: "zh", label: "Chinese" }
] as const;

export type LanguageCode = (typeof supportedLanguages)[number]["code"];

export const copy = {
  en: {
    title: "What do you want to check?",
    subtitle: "Check before you trust, click, or pay.",
    message: "Message",
    screenshot: "Screenshot",
    link: "Link",
    qr: "QR code",
    payment: "Payment",
    phone: "Phone",
    pastePlaceholder: "Paste a suspicious message or link...",
    analyze: "Check risk",
    tagline: "Verify Before You Pay."
  }
};
