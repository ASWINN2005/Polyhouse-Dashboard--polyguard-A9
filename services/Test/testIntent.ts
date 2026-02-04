// =================================================================
// 1. MOCK DATASET (A copy of your key intents for testing)
// =================================================================
const CONVERSATION_INTENTS = {
  GREETING_CASUAL: ["hello", "hi", "hey", "yo", "sup", "howdy", "hiya"],
  SYSTEM_CHECK: ["status", "system status", "report", "health check", "diagnostics"],
  HELP_REQUEST: ["help", "assist", "support", "guide"],
  GOODBYE: ["bye", "goodbye", "exit", "quit", "later", "peace out"],
  NOISE_FILTER: ["stupid", "idiot", "trash", "shut up"]
};

// =================================================================
// 2. THE LOGIC ENGINE (100% Accurate Word-Boundary Matcher)
// =================================================================
function findConversationIntent(message: string): string | null {
  if (!message) return null;

  // A. Clean: Lowercase, remove special chars, trim
  const clean = message.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  
  // B. Pad: Add spaces to start and end for boundary detection
  //    "hello world" -> " hello world "
  const paddedInput = " " + clean + " ";

  for (const [intent, phrases] of Object.entries(CONVERSATION_INTENTS)) {
    // @ts-ignore
    for (const phrase of phrases) {
      // 1. Exact Phrase Match (e.g. "system status")
      if (clean === phrase) return intent;
      
      // 2. Word Boundary Match
      //    Check if " phrase " exists inside " paddedInput "
      //    This matches "hi" inside "oh hi there"
      //    But IGNORES "hi" inside "history" or "shipping"
      if (paddedInput.includes(" " + phrase + " ")) return intent;
    }
  }
  return null;
}

// =================================================================
// 3. THE TEST RUNNER
// =================================================================
function runTest(input: string, expectedIntent: string | null) {
  const result = findConversationIntent(input);
  const status = result === expectedIntent ? "✅ PASS" : `❌ FAIL (Got: ${result})`;
  
  // Pretty printing
  const paddedInput = input.padEnd(25, " ");
  console.log(`${status} | Input: "${paddedInput}"`);
}

// =================================================================
// 4. EXECUTE TEST CASES
// =================================================================

console.log("\n--- 🟢 POSITIVE MATCHES (Social & Slang) ---");
runTest("hello", "GREETING_CASUAL");
runTest("hi", "GREETING_CASUAL");
runTest("yo what's up", "GREETING_CASUAL"); // Matches 'yo'
runTest("sup bot", "GREETING_CASUAL");      // Matches 'sup'

console.log("\n--- 🟢 POSITIVE MATCHES (Operational) ---");
runTest("system status", "SYSTEM_CHECK");
runTest("give me a report", "SYSTEM_CHECK"); // Matches 'report'
runTest("run diagnostics", "SYSTEM_CHECK"); // Matches 'diagnostics'
runTest("i need help", "HELP_REQUEST");     // Matches 'help'

console.log("\n--- 🟢 POSITIVE MATCHES (Exits & Noise) ---");
runTest("exit", "GOODBYE");
runTest("peace out", "GOODBYE");
runTest("you are stupid", "NOISE_FILTER");  // Matches 'stupid'

console.log("\n--- 🔴 ACCURACY CHECKS (The '100% Logic' Test) ---");
// These ensure we don't accidentally trigger commands inside other words
runTest("history", null);     // Contains "hi" -> Should FAIL
runTest("shipping", null);    // Contains "hi" -> Should FAIL
runTest("hill", null);        // Contains "hi" -> Should FAIL
runTest("supportive", null);  // Contains "support" -> Should FAIL (unless 'support' is own word)
runTest("shill", null);       // Contains "hi" -> Should FAIL
runTest("later", "GOODBYE");  // Should MATCH
runTest("lateral", null);     // Contains "later" -> Should FAIL

console.log("\n--- 🟡 EDGE CASES (Messy Input) ---");
runTest("HELLO!!!", "GREETING_CASUAL");     // Case + Punctuation
runTest("   status   ", "SYSTEM_CHECK");    // Whitespace
runTest("help???", "HELP_REQUEST");         // Symbols
runTest("", null);                          // Empty