import { z } from "zod";
import { PochtaClient } from "../client.js";

export const deliveryTimeSchema = z.object({
  from_index: z.string().regex(/^\d{6}$/).describe("Индекс отправителя (6 цифр)"),
  to_index: z.string().regex(/^\d{6}$/).describe("Индекс получателя (6 цифр)"),
  mail_type: z.enum([
    "POSTAL_PARCEL", "ONLINE_PARCEL", "ONLINE_COURIER",
    "EMS", "EMS_OPTIMAL", "LETTER", "BANDEROL",
    "BUSINESS_COURIER", "BUSINESS_COURIER_ES",
  ]).default("POSTAL_PARCEL").describe("Тип отправления"),
  mail_category: z.enum([
    "SIMPLE", "ORDERED", "ORDINARY", "WITH_DECLARED_VALUE",
    "WITH_DECLARED_VALUE_AND_CASH_ON_DELIVERY", "WITH_COMPULSORY_PAYMENT",
  ]).default("SIMPLE").describe("Категория отправления"),
});

let _client: PochtaClient;
function client() { return _client ??= new PochtaClient(); }

export async function handleDeliveryTime(params: z.infer<typeof deliveryTimeSchema>): Promise<string> {
  const result = (await client().post("/delivery", {
    "index-from": params.from_index,
    "index-to": params.to_index,
    "mail-type": params.mail_type,
    "mail-category": params.mail_category,
  })) as Record<string, unknown>;

  const delivery = result.delivery as { min: number; max: number } | undefined;

  return JSON.stringify({
    откуда: params.from_index,
    куда: params.to_index,
    тип: params.mail_type,
    срок_мин_дней: delivery?.min ?? (result as any)["delivery-time-min"] ?? null,
    срок_макс_дней: delivery?.max ?? (result as any)["delivery-time-max"] ?? null,
  }, null, 2);
}
