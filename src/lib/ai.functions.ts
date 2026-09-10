import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const summarySchema = z.object({
  currency: z.string(),
  balance: z.number(),
  income: z.number(),
  expenses: z.number(),
  upcomingExpenses: z.number(),
  inventoryValue: z.number(),
  transactionCount: z.number(),
  products: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        minStock: z.number(),
        costPrice: z.number(),
        sellingPrice: z.number(),
        status: z.string(),
      }),
    )
    .max(60),
});

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => summarySchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, text: "AI is not configured for this workspace." };
    }

    const prompt = `You are a careful small-business advisor. Using ONLY the figures below, write 3-5 short insights in plain language. Never invent numbers or facts that are not present. Currency code: ${data.currency}.

Cash: balance ${data.balance}, income ${data.income}, expenses ${data.expenses}, upcoming expenses ${data.upcomingExpenses}, recorded transactions ${data.transactionCount}, stock value at cost ${data.inventoryValue}.

Products:
${data.products.map((p) => `- ${p.name}: qty ${p.quantity}, min ${p.minStock}, cost ${p.costPrice}, price ${p.sellingPrice}, status ${p.status}`).join("\n") || "- none recorded"}

Format each insight as a single bullet starting with "- ", stating the recommendation first and then the reason drawn from the numbers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        ok: false as const,
        text:
          response.status === 429
            ? "The AI is busy right now. Try again in a moment."
            : `The AI could not answer right now. ${detail.slice(0, 160)}`,
      };
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return { ok: true as const, text: json.choices?.[0]?.message?.content ?? "" };
  });
