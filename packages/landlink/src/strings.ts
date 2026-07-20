export interface LandlinkStrings {
  // profile
  verifiedLabel: string;
  // admin footer link
  manageLabel: string;
  // social block
  socialAriaLabel: string;
  // embed block
  embedDefaultTitle: string;
  // countdown block
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  // email-capture block (hardcoded error only; others are configurable per block)
  emailCaptureError: string;
  // locked-link PIN modal
  lockedDialogLabel: string;
  lockedTitle: string;
  lockedSubtitle: string;
  lockedPlaceholder: string;
  lockedIncorrect: string;
  lockedSubmit: string;
  lockedCancel: string;
  // vcard block
  vcardSave: string;
  vcardSaved: string;
  // testimonial block — "{n}" is replaced with the numeric rating
  testimonialRatingSuffix: string;
  // rss-feed block locale for date formatting (e.g. "en-US", "pt-BR")
  rssFeedLocale: string;
}

export const en: LandlinkStrings = {
  verifiedLabel: "Verified",
  manageLabel: "Manage",
  socialAriaLabel: "Social links",
  embedDefaultTitle: "Media embed",
  countdownDays: "days",
  countdownHours: "hrs",
  countdownMinutes: "min",
  countdownSeconds: "sec",
  emailCaptureError: "Something went wrong. Please try again.",
  lockedDialogLabel: "Protected access",
  lockedTitle: "Protected content",
  lockedSubtitle: "Enter the code to access",
  lockedPlaceholder: "Code",
  lockedIncorrect: "Incorrect code",
  lockedSubmit: "Access",
  lockedCancel: "Cancel",
  vcardSave: "Save contact",
  vcardSaved: "Contact saved!",
  testimonialRatingSuffix: "out of 5 stars",
  rssFeedLocale: "en-US",
};

export const ptBR: LandlinkStrings = {
  verifiedLabel: "Verificado",
  manageLabel: "Gerenciar",
  socialAriaLabel: "Redes sociais",
  embedDefaultTitle: "Mídia incorporada",
  countdownDays: "dias",
  countdownHours: "hrs",
  countdownMinutes: "min",
  countdownSeconds: "seg",
  emailCaptureError: "Algo deu errado. Tente novamente.",
  lockedDialogLabel: "Acesso protegido",
  lockedTitle: "Conteúdo protegido",
  lockedSubtitle: "Digite o código para acessar",
  lockedPlaceholder: "Código",
  lockedIncorrect: "Código incorreto",
  lockedSubmit: "Acessar",
  lockedCancel: "Cancelar",
  vcardSave: "Salvar contato",
  vcardSaved: "Contato salvo!",
  testimonialRatingSuffix: "de 5 estrelas",
  rssFeedLocale: "pt-BR",
};
