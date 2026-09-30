export const getPokemon = async (name: string): Promise<string> => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`,
  );

  if (!response.ok) {
    return "Uh oh, failed to get Pokemon";
  }

  const pokemon = await response.json();

  if (pokemon.id > 151) {
    ("Hmm this is not a first gen pokemon, I only deal with first gen pokemon! Error!");
  }

  return JSON.stringify(pokemon);
};
