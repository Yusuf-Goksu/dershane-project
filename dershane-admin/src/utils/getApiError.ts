export function getApiError(err: any, fallback = "İşlem başarısız") {
  return err?.response?.data?.message || err?.message || fallback;
}
