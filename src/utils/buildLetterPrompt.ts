export function buildLetterPrompt(city: string, level: string): string {
  return `
You are writing a short, engaging travel letter from ${city}.
This letter will be read by a language learner whose English level is ${level}.
The tone should be warm, slightly humorous, and informative.

The letter should include:
- 1–2 unique facts or trivia about ${city} or its country
- 1 entertaining travel-related anecdote (e.g., local customs, a surprising incident)
- A friendly sign-off that invites the reader to look forward to the next city

Use paragraph breaks and natural transitions.

The output should be in the following JSON format **only**:

{
  "title": "A Letter from ${city}",
  "body": "[full letter text here, ~200 words, with \\n\\n for paragraph breaks]"
}

Respond with **only the JSON**. Do not include explanations or extra text.
  `.trim();
}