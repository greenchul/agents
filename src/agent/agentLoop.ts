import OpenAI from "openai";
import { toResponseInputItems } from "openai/lib/responses/ResponseInputItems";
import { loadEnvFile } from "node:process";
import readline from "node:readline";

import { tools, toolMappings } from "./tools/tools.js";

loadEnvFile();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("close", () => {
  console.log("Exiting agent, bye!");
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

console.log("Starting Agent Pokemon....");
rl.question(" > ", async (answer) => {
  await runAgentLoop(answer);
  rl.close();
});

const runAgentLoop = async (startingQuestion: string) => {
  const agentInput: OpenAI.Responses.ResponseInput = [
    { role: "user", content: startingQuestion },
  ];
  // agent loop
  while (true) {
    // talk to model
    let res;
    try {
      res = await openaiClient.responses.create({
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
    } catch (e) {
      console.log("Error calling agent");
      break;
    }
    // push results to conversation
    agentInput.push(...toResponseInputItems(res.output));

    // check for tool calls
    const toolCalls = res.output.filter(
      (item) => item.type === "function_call",
    );

    // execute tools if tool calls
    if (!toolCalls.length) {
      console.log(res.output_text);
      console.log("End of agent loop, no tools it wants to call");
      break;
    } else {
      for (const toolCall of toolCalls) {
        const fnToCall = toolMappings[toolCall.name];
        if (!fnToCall) {
          throw new Error(`Unknown tool: ${toolCall.name}`);
        }
        const args = JSON.parse(toolCall.arguments);

        const response = await fnToCall(...Object.values(args));

        agentInput.push({
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: JSON.stringify(response),
        });
      }
    }
  }
};
