import { z } from "zod";
import { PochtaClient } from "../client.js";
import type { PochtaCalcResult } from "../types.js";

export const calculateSchema = z.object({
  from_index: z.string().describe("Почтовый индекс отправителя (6 цифр)"),
  to_index: z.string().describe("Почтовый индекс получателя (6 цифр)"),
  weight: z.number().positive().describe("Вес отправления в граммах"),
  mail_type: z.enum([
    "POSTAL_PARCEL", "ONLINE_PARCEL", "ONLINE_COURIER",
    "EMS", "EMS_OPTIMAL", "LETTER", "BANDEROL",
    "BUSINESS_COURIER", "BUSINESS_COURIER_ES",
  ]).default("POSTAL_PARCEL").describe("Тип отправления"),
  mail_category: z.enum([
    "SIMPLE", "ORDERED", "ORDINARY", "WITH_DECLARED_VALUE",
    "WITH_DECLARED_VALUE_AND_CASH_ON_DELIVERY", "WITH_COMPULSORY_PAYMENT",
  ]).default("SIMPLE").describe("Категория отправления"),
  declared_value: z.number().optional().describe("Объявленная ценность в копейках"),
  dimension_type: z.enum(["S", "M", "L", "XL", "OVERSIZED"]).optional().describe("Типоразмер"),
});

let _client: PochtaClient;
function client() { return _client ??= new PochtaClient(); }

export async function handleCalculate(params: z.infer<typeof calculateSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    "index-from": params.from_index,
    "index-to": params.to_index,
    "mail-category": params.mail_category,
    "mail-type": params.mail_type,
    mass: params.weight,
  };
  if (params.declared_value !== undefined) body["declared-value"] = params.declared_value;
  if (params.dimension_type) body["dimension-type"] = params.dimension_type;

  const result = (await client().post("/tariff", body)) as PochtaCalcResult;

  return JSON.stringify({
    стоимость_всего_коп: result.total_rate,
    ндс_коп: result.total_nds,
    наземная_пересылка: result.ground_rate ? {
      стоимость_коп: result.ground_rate.rate,
      ндс_коп: result.ground_rate.vat,
    } : null,
    срок_доставки: result.delivery_time ? {
      мин_дней: result.delivery_time.min_days,
      макс_дней: result.delivery_time.max_days,
    } : null,
    примечание: result.notice,
  }, null, 2);
}
