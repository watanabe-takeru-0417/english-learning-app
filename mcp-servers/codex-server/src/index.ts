import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";

// Read Codex CLI auth token (ChatGPT Plus subscription)
function getAccessToken(): string {
  const authPath = join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".codex",
    "auth.json"
  );
  try {
    const auth = JSON.parse(readFileSync(authPath, "utf8"));
    if (auth.tokens?.access_token) {
      return auth.tokens.access_token;
    }
  } catch {
    // fallback to env var
  }
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  console.error(
    "No auth found. Run 'codex login --device-auth' first, or set OPENAI_API_KEY."
  );
  process.exit(1);
}

const accessToken = getAccessToken();

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  temperature = 0.3
): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

const server = new McpServer({
  name: "codex-server",
  version: "1.0.0",
});

// Generate code based on specification
server.tool(
  "codex_generate_code",
  "Generate code from a specification. Use for implementing app features, components, utilities, etc.",
  {
    specification: z
      .string()
      .describe("Detailed specification of what the code should do"),
    language: z
      .enum(["typescript", "javascript", "python", "css", "html"])
      .default("typescript")
      .describe("Programming language"),
    framework: z
      .string()
      .optional()
      .describe("Framework context (e.g., 'React', 'Express', 'Next.js')"),
  },
  async ({ specification, language, framework }) => {
    const systemPrompt = `You are an expert ${language} developer${framework ? ` specializing in ${framework}` : ""}. Generate clean, production-ready code based on the specification. Include necessary imports and type definitions. Do not include explanations, only code.`;

    const result = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: specification },
    ]);

    return { content: [{ type: "text", text: result }] };
  }
);

// Review code
server.tool(
  "codex_review_code",
  "Review code for quality, bugs, security issues, and best practices.",
  {
    code: z.string().describe("The code to review"),
    language: z
      .enum(["typescript", "javascript", "python", "css", "html"])
      .default("typescript")
      .describe("Programming language"),
  },
  async ({ code, language }) => {
    const result = await callOpenAI(
      [
        {
          role: "system",
          content: `You are a senior ${language} code reviewer. Review the code and respond in JSON format:
{
  "quality_score": (1-10),
  "bugs": [...],
  "security_issues": [...],
  "improvements": [...],
  "refactored_code": "improved version of the code"
}`,
        },
        { role: "user", content: code },
      ],
      0.2
    );

    return { content: [{ type: "text", text: result }] };
  }
);

// Generate test code
server.tool(
  "codex_generate_tests",
  "Generate unit tests for given code.",
  {
    code: z.string().describe("The code to generate tests for"),
    framework: z
      .enum(["vitest", "jest", "mocha", "pytest"])
      .default("vitest")
      .describe("Testing framework"),
  },
  async ({ code, framework }) => {
    const result = await callOpenAI([
      {
        role: "system",
        content: `Generate comprehensive unit tests using ${framework}. Cover edge cases and error scenarios. Output only the test code.`,
      },
      { role: "user", content: `Write tests for this code:\n\n${code}` },
    ]);

    return { content: [{ type: "text", text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Codex MCP Server running on stdio (ChatGPT auth)");
}

main().catch(console.error);
