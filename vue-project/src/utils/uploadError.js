/**
 * The message to show when an image upload fails. A 413 comes from nginx with an HTML body, so its
 * own message is unreadable; every other failure gets a generic retry message.
 */
export function uploadErrorMessage(err, t) {
  const status = err?.response?.status ?? err?.status;
  return status === 413 ? t("uploadErrors.tooLarge") : t("uploadErrors.failed");
}
