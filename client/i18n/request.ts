import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = ["en", "es"] as const;
type Locale = (typeof locales)[number];

const defaultLocale: Locale = "en";

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("NEXT_LOCALE")?.value ?? "";
  const locale: Locale = isLocale(requestedLocale)
    ? requestedLocale
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
