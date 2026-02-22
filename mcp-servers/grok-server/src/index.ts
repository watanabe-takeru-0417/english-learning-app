import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";

const apiKey = process.env.XAI_GROK_API_KEY;
if (!apiKey) {
  console.error("XAI_GROK_API_KEY is required");
  process.exit(1);
}

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";

async function callGrok(prompt: string): Promise<string> {
  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

const server = new McpServer({
  name: "grok-server",
  version: "1.0.0",
});

// Research with real-time info (Grok's strength)
server.tool(
  "grok_research",
  "Research a topic using Grok. Grok has access to real-time information from X/Twitter, making it great for current trends and up-to-date info.",
  {
    topic: z.string().describe("The topic to research"),
    language: z
      .enum(["en", "ja"])
      .default("ja")
      .describe("Response language"),
  },
  async ({ topic, language }) => {
    const prompt =
      language === "ja"
        ? `以下のトピックについて最新の情報を含めて調査してください: ${topic}`
        : `Research the following topic with the latest information: ${topic}`;

    const result = await callGrok(prompt);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Verify/cross-reference information
server.tool(
  "grok_verify",
  "Cross-reference and verify information. Use to fact-check English learning content or validate translations.",
  {
    claim: z.string().describe("The claim or information to verify"),
    context: z
      .string()
      .optional()
      .describe("Additional context for verification"),
  },
  async ({ claim, context }) => {
    const prompt = `Verify the following claim/information. Is it accurate? Provide corrections if needed.

Claim: ${claim}
${context ? `Context: ${context}` : ""}

Respond in JSON format:
{
  "is_accurate": true/false,
  "confidence": (1-10),
  "corrections": "any corrections needed",
  "additional_info": "relevant additional information",
  "sources": "what this is based on"
}`;

    const result = await callGrok(prompt);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Trending English expressions
server.tool(
  "grok_trending_english",
  "Get trending English expressions, slang, or business phrases that are currently popular.",
  {
    category: z
      .enum(["business", "tech", "casual", "slang", "interview"])
      .describe("Category of expressions"),
    count: z.number().default(10).describe("Number of expressions to return"),
  },
  async ({ category, count }) => {
    const prompt = `List ${count} currently trending or commonly used English ${category} expressions/phrases. For each, provide:
- The expression
- Meaning in Japanese
- Example usage in a sentence
- How common it is (1-10)

Format as JSON array. Focus on expressions that a Japanese professional would find useful.`;

    const result = await callGrok(prompt);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Grok MCP Server running on stdio");
}

main().catch(console.error);
