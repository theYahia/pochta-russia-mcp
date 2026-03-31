import { z } from "zod";
import { PochtaClient } from "../client.js";

const client = new PochtaClient();

export const trackSchema = z.object({
  barcode: z.string().describe("Трек-номер (штрих-код) почтового отправления, например RA123456789RU"),
});

export async function handleTrack(params: z.infer<typeof trackSchema>): Promise<string> {
  const result = await client.trackByBarcode(params.barcode);
  return JSON.stringify(result, null, 2);
}
