import OpenAI from "openai";
import { getPokemon } from "./getPokemon.js";

export const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "get_pokemon",
    description: "Get information about the given Pokemon",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      additionalProperties: false,
      required: ["name"],
    },
    strict: null,
  },
];

export const toolMappings: Record<string, Function> = {
  get_pokemon: getPokemon,
};
