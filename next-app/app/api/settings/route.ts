import { json } from "@/lib/http";
import { settingStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const all = await settingStore.getAll();
  // Only expose safe public settings
  const publicKeys = [
    "theme_primary", "theme_gold", "logo_url", "logo_height_desktop", "logo_height_mobile", "logo_max_width", "logo_alt",
    "site_name", "site_tagline", "contact_email", "contact_phone", "free_shipping_enabled", "free_shipping_threshold",
    "shipping_charge", "shipping_message", "handling_charge", "handling_charge_enabled", "delivery_enabled",
    "delivery_standard_days", "delivery_express_days", "delivery_cod_enabled", "delivery_same_day",
    "delivery_same_day_cutoff", "delivery_serviceable_pincodes", "delivery_serviceable_ranges", "delivery_metro_pincodes"
  ];
  const safe = all.filter((s: Record<string, unknown>) => publicKeys.includes(String(s.key)));
  return json({ settings: safe });
}
