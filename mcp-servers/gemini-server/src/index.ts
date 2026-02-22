import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import "dotenv/config";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GEMINI_API_KEY is required");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const server = new McpServer({
  name: "gemini-server",
  version: "1.0.0",
});

// Research tool - information gathering
server.tool(
  "gemini_research",
  "Research a topic using Gemini. Use for gathering information about English learning methodologies, content, linguistics, etc.",
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
        ? `以下のトピックについて詳しく調査し、要点をまとめてください: ${topic}`
        : `Research the following topic and summarize key points: ${topic}`;

    const result = await model.generateContent(prompt);
    return {
      content: [{ type: "text", text: result.response.text() }],
    };
  }
);

// Generate English learning content
server.tool(
  "gemini_generate_content",
  "Generate English learning content (vocabulary lists, example sentences, grammar explanations, etc.)",
  {
    content_type: z
      .enum([
        "vocabulary",
        "sentences",
        "grammar",
        "dialogue",
        "interview_questions",
      ])
      .describe("Type of content to generate"),
    topic: z.string().describe("Topic or context for the content"),
    difficulty: z
      .enum(["beginner", "intermediate", "advanced"])
      .default("intermediate")
      .describe("Difficulty level"),
    count: z.number().default(10).describe("Number of items to generate"),
  },
  async ({ content_type, topic, difficulty, count }) => {
    const prompts: Record<string, string> = {
      vocabulary: `Generate ${count} ${difficulty}-level English vocabulary words related to "${topic}". For each word, provide: the word, pronunciation guide, Japanese translation, and an example sentence. Format as JSON array.`,
      sentences: `Generate ${count} ${difficulty}-level Japanese sentences related to "${topic}" for English translation practice (瞬間英作文). For each, provide: Japanese sentence, correct English translation, key grammar point. Format as JSON array.`,
      grammar: `Explain the English grammar concept "${topic}" at ${difficulty} level. Include: explanation in Japanese, 5 example sentences, common mistakes by Japanese speakers. Format as JSON.`,
      dialogue: `Create a ${difficulty}-level English business dialogue about "${topic}". Include ${count} exchanges. Provide Japanese translation for each line. Format as JSON array.`,
      interview_questions: `Generate ${count} ${difficulty}-level English job interview questions for a tech company about "${topic}". For each, provide: the question, a model answer, key phrases to use, and Japanese translation. Format as JSON array.`,
    };

    const result = await model.generateContent(prompts[content_type]);
    return {
      content: [{ type: "text", text: result.response.text() }],
    };
  }
);

// Evaluate English response
server.tool(
  "gemini_evaluate",
  "Evaluate an English response for grammar, naturalness, and appropriateness",
  {
    user_response: z.string().describe("The user's English response to evaluate"),
    context: z
      .string()
      .describe("The context or prompt the user was responding to"),
  },
  async ({ user_response, context }) => {
    const prompt = `You are an English language evaluator. A Japanese learner wrote the following English response.

Context/Prompt: ${context}
User's Response: ${user_response}

Evaluate and respond in JSON format:
{
  "score": (1-10),
  "grammar_errors": [...],
  "naturalness": "comment on how natural it sounds",
  "suggestions": ["improved version 1", "improved version 2"],
  "feedback_ja": "日本語でのフィードバック"
}`;

    const result = await model.generateContent(prompt);
    return {
      content: [{ type: "text", text: result.response.text() }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP Server running on stdio");
}

main().catch(console.error);
