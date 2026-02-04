// --- 1. MOCK DATA & 100% ACCURATE LOGIC ---

const CONVERSATION_INTENTS = {
  GREETING_CASUAL: ["hello", "hi", "hey", "hai", "hello polyguard"],
  SYSTEM_CHECK: ["status", "system status", "report", "system report"],
  HELP_REQUEST: ["help", "assist", "guide", "i need help"]
};

// The Logic Engine (Identical to your aiDecisionService)
function findConversationIntent(message: string): string | null {
  if (!message) return null;
  
  // 1. Clean Input
  const clean = message.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  
  // 2. Pad Input for Exact Word Matching
  const paddedInput = " " + clean + " ";

  for (const [intent, phrases] of Object.entries(CONVERSATION_INTENTS)) {
    // @ts-ignore
    for (const phrase of phrases) {
      if (clean === phrase) return intent; 
      // The "100% Accuracy" Check:
      if (paddedInput.includes(" " + phrase + " ")) return intent; 
    }
  }
  return null;
}

// --- 2. THE TEST RUNNER ---

function runTest(input: string, expectedIntent: string | null) {
  const result = findConversationIntent(input);
  const status = result === expectedIntent ? "✅ PASS" : "❌ FAIL (Got: " + result + ")";
  console.log(status + " | Input: " + input);
}

// --- 3. EXECUTE FULL TEST SUITE ---

console.log("\n--- 🟢 POSITIVE MATCHES (Should Detect) ---");
runTest("hello", "GREETING_CASUAL");
runTest("help", "HELP_REQUEST");
runTest("status", "SYSTEM_CHECK");
runTest("HELLO", "GREETING_CASUAL");
runTest("SyStEm StAtUs", "SYSTEM_CHECK");
runTest("hello polyguard", "GREETING_CASUAL");
runTest("i need help please", "HELP_REQUEST"); // Matches 'help' inside
runTest("give me a system report", "SYSTEM_CHECK");

console.log("\n--- 🔴 NEGATIVE MATCHES (Accuracy Check) ---");
runTest("history", null); 
runTest("shipping", null); 
runTest("shield", null); 
runTest("shell", null); 
runTest("shelf", null);
runTest("lately", null); 
runTest("plate", null);

console.log("\n--- 🟡 EDGE CASES ---");
runTest("", null);
runTest("   ", null);
runTest("!@#$%", null);
