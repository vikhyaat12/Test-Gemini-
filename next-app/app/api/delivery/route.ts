import { json } from "@/lib/http";
import { settingStore, shippingStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode") || "";

  if (!pincode || pincode.length < 6) {
    return json({ error: "Please enter a valid 6-digit pincode" }, 400);
  }

  // Read shipping rules directly from shippingStore
  const rules = await shippingStore.rules.get();
  const allSettings = await settingStore.getAll();
  const getVal = (key: string, fallback: string) => {
    const s = allSettings.find((r: Record<string, unknown>) => r.key === key);
    return s ? String(s.value || fallback) : fallback;
  };

  const deliveryEnabled = getVal("delivery_enabled", "true") === "true";
  const freeShippingEnabled = true;
  const freeShippingThreshold = Number(rules.freeShippingThreshold || 1500);
  const shippingCharge = Number(rules.standardShippingFee || 99);
  const handlingCharge = Number(rules.codHandlingFee || 0);
  const standardDeliveryDays = Number(getVal("delivery_standard_days", "3"));
  const codEnabled = getVal("delivery_cod_enabled", "true") === "true";
  const sameDayEnabled = getVal("delivery_same_day", "false") === "true";
  const sameDayCutoff = getVal("delivery_same_day_cutoff", "14:00");
  const freeShippingMessage = `FREE SHIPPING on orders above ₹${freeShippingThreshold.toLocaleString("en-IN")}`;

  // Parse serviceable pincodes from settings
  const serviceableRaw = getVal("delivery_serviceable_pincodes", "");
  const serviceableRanges = getVal("delivery_serviceable_ranges", "");
  const metroPincodes = getVal("delivery_metro_pincodes", "110,400,560,600,700,500,302,201,226,411");

  // Check if pincode is serviceable
  let serviceable = deliveryEnabled;
  let zone = "standard";
  let extraDays = 0;

  // Check exact pincode list
  if (serviceableRaw) {
    const codes = serviceableRaw.split(",").map(s => s.trim()).filter(Boolean);
    serviceable = codes.includes(pincode);
  }

  // Check pincode ranges (e.g., "110001-110099,400001-400099") — only if exact list didn't match
  if (!serviceable && serviceableRanges) {
    const ranges = serviceableRanges.split(",").map(s => s.trim()).filter(Boolean);
    const pinNum = Number(pincode);
    serviceable = ranges.some(range => {
      const [start, end] = range.split("-").map(Number);
      return pinNum >= start && pinNum <= end;
    });
  }

  // Detect zone from first 3 digits
  const prefix3 = pincode.slice(0, 3);
  const metroList = metroPincodes.split(",").map(s => s.trim()).filter(Boolean);
  if (metroList.includes(prefix3)) {
    zone = "metro";
    extraDays = 0;
  } else {
    zone = "non-metro";
    extraDays = 1;
  }

  // If no serviceable list configured and delivery is enabled, check first 3 digits as fallback
  if (!serviceableRaw && !serviceableRanges && deliveryEnabled) {
    serviceable = true; // Allow all pincodes if no restriction configured
  }

  if (!serviceable) {
    return json({
      serviceable: false,
      pincode,
      message: "Delivery is not available to this pincode yet.",
      deliveryAvailable: false,
    });
  }

  const now = new Date();
  const isSameDay = sameDayEnabled && zone === "metro" && now.getHours() < Number(sameDayCutoff.split(":")[0]);

  let estimatedDays = standardDeliveryDays + extraDays;
  let deliveryLabel = "";

  if (isSameDay) {
    estimatedDays = 0;
    deliveryLabel = "Same-day delivery (order before " + sameDayCutoff + ")";
  } else if (zone === "metro") {
    estimatedDays = Math.max(1, standardDeliveryDays);
    deliveryLabel = estimatedDays === 1 ? "Next-day delivery" : `${estimatedDays} business days`;
  } else {
    estimatedDays = standardDeliveryDays + extraDays;
    deliveryLabel = `${estimatedDays} business days`;
  }

  // Calculate estimated date
  const deliveryDate = new Date(now);
  let businessDaysAdded = 0;
  while (businessDaysAdded < estimatedDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const day = deliveryDate.getDay();
    if (day !== 0 && day !== 6) businessDaysAdded++;
  }

  const dateStr = deliveryDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
  const dateRange = estimatedDays <= 2 ? dateStr : `${dateStr} - ${new Date(deliveryDate.getTime() + 86400000 * 2).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}`;

  return json({
    serviceable: true,
    pincode,
    zone,
    deliveryAvailable: true,
    estimatedDays,
    estimatedDate: dateRange,
    deliveryLabel,
    shippingCharge,
    freeShippingEnabled,
    freeShippingThreshold,
    freeShippingMessage,
    codAvailable: codEnabled,
    sameDayAvailable: isSameDay,
    handlingCharge,
    message: `Delivery to ${pincode} (${zone === "metro" ? "Metro" : "Non-metro"} zone): ${deliveryLabel}`,
  });
}
