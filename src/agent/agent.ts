import OpenAI from "openai";
import { toResponseInputItems } from "openai/lib/responses/ResponseInputItems";
import { loadEnvFile } from "node:process";

import { tools, toolMappings } from "./tools/tools.js";

loadEnvFile();

const openaiClient = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const agentInput: OpenAI.Responses.ResponseInput = [
  { role: "user", content: "Tell me about the Pokemon Charmander please" },
];

const runAgent = async () => {
  const res = await openaiClient.responses.create({
    instructions: `
    You are PokeAI, an expert on Generation I Pokémon.

    You only discuss the original 151 Pokémon.
    Use the available tools whenever you need factual information
    about a Pokémon.

    Keep answers concise and friendly.

    Do not answer questions on any topic other than Pokemon
    `,
    model: "gpt-5-mini",
    input: agentInput,
    tools,
  });

  const toolCalls = res.output.filter((item) => item.type === "function_call");
  agentInput.push(...toResponseInputItems(res.output));

  console.log("tool it wants to call ", toolCalls);
  console.log("tool choice", res.tool_choice);
  if (!toolCalls.length) {
    console.log("End of agent loop, no tools it wants to call");
    return;
  } else {
    for (const toolCall of toolCalls) {
      const fnToCall = toolMappings[toolCall.name];
      const args = JSON.parse(toolCall.arguments);

      const response = await fnToCall(...Object.values(args));

      agentInput.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: JSON.stringify(response),
      });
    }
  }

  //   console.log({ agentInput });
  const secondCall = await openaiClient.responses.create({
    instructions: `
    You are PokeAI, an expert on Generation I Pokémon.

    You only discuss the original 151 Pokémon.
    Use the available tools whenever you need factual information
    about a Pokémon.

    Keep answers concise and friendly.

    Do not answer questions on any topic other than Pokemon
    `,
    model: "gpt-5-mini",
    input: agentInput,
    tools,
  });

  console.log(secondCall.output_text);
};

runAgent();
