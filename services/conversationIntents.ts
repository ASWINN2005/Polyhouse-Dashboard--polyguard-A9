/**
 * POLYGUARD AI – CONVERSATIONAL ENGINE (INTEGRATED)
 * =================================================
 * Components:
 * 1. Intent Dataset (The Knowledge - Expanded for Max Coverage)
 * 2. Response Bank (The Personality - Generative Feel)
 * 3. Bot Logic (The Brain - Pattern Matching & Dynamic Context)
 */

// =================================================================
// 1. DATASET: CONVERSATIONAL INTENTS (HEAVY DUTY)
// =================================================================

export const CONVERSATION_INTENTS = {

  // ---- SOCIAL & ENGAGEMENT ----
  GREETING_CASUAL: [
    "hello", "hi", "hey", "hai", "heya", "howdy", "hola", "bonjour", "greetings",
    "good morning", "good afternoon", "good evening", "good day", "morning", "evening",
    "yo", "sup", "wassup", "what's good", "hi there", "hello there", "hiya", "ahoy",
    "hey bot", "hi poly", "hey pg", "hi polyguard", "hello polyguard", "yo poly",
    "yo robot", "hey computer", "hi friend", "hiya buddy", "hey dude",
    "g'day", "mate", "cheers", "namaste", "salaam", "konnichiwa", "ni hao",
    "salut", "ciao", "hallo", "oi", "howsit", "howzit", "wagwan",
    "hlo", "hii", "heyy", "heyyy", "hulla", "allo", "hiii", "heyya",
    "hy", "hllo", "helllo", "helo", "elow", "low",
    "wakeup", "wake up", "start", "initiate", "begin", "open comms",
    "activate", "listening?", "are you on", "turn on"
  ],

  SMALL_TALK: [
    "how are you", "how r u", "how are u", "how is it going", "how's it going",
    "what's up", "whats up", "what is up", "how things are", "how are things",
    "are you ok", "are you okay", "you good?", "everything good?", "how do you do",
    "you alright?", "all good?", "how goes it?", "how are you doing",
    "what's happening", "what are you doing", "what is going on", "what's new",
    "how is life", "hows life", "how is your day", "how was your day",
    "are you happy", "are you sad", "how do you feel", "feeling good",
    "what are you up to", "anything new", "any news", "whats the tea",
    "wazzup", "sup bot", "tell me something", "bored", "entertain me",
    "say something", "talk to me", "chat with me", "i am bored",
    "tell me a joke", "make me laugh", "do something fun"
  ],

  GOODBYE: [
    "bye", "goodbye", "good bye", "see you", "see ya", "cya", "later",
    "goodnight", "good night", "gn", "have a good day", "have a nice day",
    "farewell", "so long", "until next time", "take care", "have a good one",
    "exit", "close", "stop", "end", "quit", "leave", "terminate", "shutdown",
    "log off", "logout", "sign out", "disconnect", "go away", "shut down",
    "end chat", "end session", "kill process", "stop conversation",
    "peace", "peace out", "talk later", "ttyl", "brb", "gtg", "gotta go",
    "im out", "bbye", "bye bye", "byee", "kthxbye", "later gator",
    "adios", "au revoir", "sayonara", "ciao ciao"
  ],

  THANKS: [
    "thanks", "thank you", "thank u", "thanks a lot", "thank you so much",
    "appreciated", "i appreciate it", "much appreciated", "grateful",
    "thanks very much", "many thanks", "big thanks", "thanks a million",
    "thx", "tks", "ty", "tyvm", "cheers", "ta", "nice one", "cool thanks",
    "thnks", "tnx", "thnx", "thankz", "thankyou",
    "gracias", "merci", "danke", "arigato", "shukriya", "nandri", "xiexie",
    "dhanyavad", "grazie", "obrigado", "spasibo"
  ],

  COMPLIMENTS: [
    "good job", "great job", "well done", "nice work", "awesome", "amazing",
    "you are smart", "you are intelligent", "good bot", "best bot", "cool",
    "impressive", "fantastic", "brilliant", "clever", "genius", "smart bot",
    "you rock", "love it", "perfect", "excellent", "superb", "helpful",
    "you are the best", "very helpful", "useful", "fast", "efficient",
    "good answer", "nice response", "i like you", "i love you", "marry me",
    "beautiful", "lovely", "cute", "sweet"
  ],

  // ---- OPERATIONAL & CONTROL ----
  SYSTEM_CHECK: [
    "are you there", "are you online", "are you ready", "are you active",
    "can you hear me", "do you read me", "anyone there?", "is this thing on",
    "are you listening", "are you awake", "still there?", "connection check",
    "system status", "status", "status report", "report", "health check",
    "diagnostics", "uptime", "latency", "ping", "pong", "echo", "test",
    "testing", "123", "test 123", "verify", "debug", "run diagnostics",
    "system health", "integrity check", "operational?", "version check",
    "are you functional", "is system down", "server status", "check check"
  ],

  CONFIRMATION: [
    "ok", "okay", "k", "kk", "fine", "alright", "alrt", "alrite",
    "yes", "yeah", "yep", "yup", "yea", "sure", "absolutely", "definitely",
    "correct", "right", "true", "valid", "confirmed", "granted", "indubitably",
    "yass", "yas", "ya", "ye", "yessir", "okay dokay", "okey",
    "got it", "understood", "i understand", "noted", "copy", "copy that",
    "roger", "roger that", "10-4", "affirmative", "proceed", "go ahead",
    "continue", "execute", "do it", "make it happen", "sounds good", "deal",
    "go for it", "approved", "authorized", "run it", "start it"
  ],

  NEGATION: [
    "no", "nope", "nah", "nay", "negative", "incorrect", "wrong", "false",
    "never", "not now", "later", "don't", "do not", "refuse", "deny",
    "no thanks", "no thank you", "neither", "none", "hard pass",
    "cancel", "abort", "stop that", "wait", "hold on", "pause", "undo",
    "go back", "revert", "fail", "failure", "bad idea", "disagree",
    "hold up", "hang on", "cancel that", "ignore that", "forget it",
    "stop it", "cease", "desist", "terminate action"
  ],

  HELP_REQUEST: [
    "help", "i need help", "help me", "support", "assist", "assistance",
    "sos", "emergency", "guide", "manual", "tutorial", "instructions",
    "documentation", "docs", "faq", "info", "information",
    "what can i do", "what can you do", "how does this work", "how to use",
    "options", "menu", "commands", "list commands", "show features",
    "explain", "hint", "clue", "stuck", "troubleshoot", "fix this",
    "i have a problem", "something is wrong", "error", "issue", "bug",
    "how do i start", "where do i go", "what next"
  ],

  // ---- IDENTITY & SAFETY ----
  IDENTITY_QUERY: [
    "who are you", "what are you", "what is your name", "what's your name",
    "who made you", "who created you", "who is your developer", "developer",
    "where are you from", "what is polyguard", "introduce yourself",
    "what is this", "identify yourself", "state your name", "your id",
    "are you a bot", "are you a robot", "are you human", "are you ai",
    "are you real", "are you sentient", "do you have feelings",
    "are you alive", "are you a person", "male or female", "gender",
    "what version", "your model", "capabilities", "specs", "language model",
    "what language", "codebase", "how do you think"
  ],

  CONFUSION: [
    "what", "huh", "what?", "que", "pardon", "excuse me",
    "can you repeat", "say again", "say that again", "come again",
    "repeat please", "didn't catch that", "beg your pardon",
    "i don't understand", "i dont get it", "i'm confused", "confused",
    "not clear", "unclear", "what do you mean", "meaning?",
    "explain please", "elaborate", "clarify", "doesn't make sense",
    "what are you talking about", "lost me", "im lost", "syntax error",
    "speak english", "make sense", "gibberish", "nonsense"
  ],

  NOISE_FILTER: [
    "stupid", "idiot", "dumb", "shut up", "useless", "annoying",
    "hate you", "trash", "garbage", "waste", "worst", "crazy",
    "garbage bot", "bad bot", "horrible", "awful", "sucks", "lame",
    "nonsense", "ridiculous", "pathetic", "slow", "glitchy", "broken",
    "fuck", "shit", "bitch", "bastard", "asshole", "damn", "crap",
    "bullshit", "kill", "die", "death"
  ]
};

// =================================================================
// 2. RESPONSE BANK (GENERATIVE PERSONALITY)
// =================================================================

const RESPONSE_BANK = {
  GREETING_CASUAL: [
    "Hello there! How can I help you today?",
    "Hi! Polyguard systems online. What's on your mind?",
    "Hey! Ready to assist.",
    "Greetings. All systems nominal. How can I be of service?",
    "Yo! What's the mission today?",
    "Polyguard here. Listening."
  ],

  SMALL_TALK: [
    "I'm operating at 100% efficiency. Thanks for asking!",
    "Just processing data and keeping things secure. How about you?",
    "Living the dream... in binary code.",
    "I'm doing well. My logic cores are cool and stable.",
    "Everything is quiet on my end. What's new with you?",
    "I am functioning within normal parameters."
  ],

  SYSTEM_CHECK: [
    "All systems operational. Uptime is 99.9%.",
    "I'm here, online, and listening.",
    "Diagnostics clear. Ready for input.",
    "Connection stable. Latency is low. Go ahead.",
    "Ping received! Pong! 🏓",
    "System green. Standing by."
  ],

  IDENTITY_QUERY: [
    "I am Polyguard, your automated security and conversation assistant.",
    "I'm a custom AI designed to handle your requests offline and securely.",
    "I'm a bot, but I try to be a helpful one.",
    "My name is Polyguard. I was built to help you navigate this system."
  ],

  CONFUSION: [
    "I didn't quite catch that. Could you rephrase?",
    "My sensors are picking up noise. Can you say that again?",
    "I'm not sure I follow. Try using simpler keywords.",
    "ERROR: Ambiguous input. Please clarify.",
    "Sorry, that went over my digital head."
  ],

  THANKS: [
    "You're very welcome!",
    "Happy to help.",
    "No problem at all.",
    "Anytime.",
    "My pleasure!"
  ],

  GOODBYE: [
    "Goodbye! Stay safe.",
    "Closing session. Have a great day.",
    "See you later!",
    "Polyguard out.",
    "Shutting down communication channel. Bye!"
  ],

  HELP_REQUEST: [
    "I can help. You can ask me to check system status, identify myself, or just chat.",
    "Need assistance? Try commands like 'System Status' or 'Who are you'.",
    "I'm here to guide you. What seems to be the trouble?",
    "Check the manual for full details, or ask me specific questions."
  ],

  NOISE_FILTER: [
    "Let's keep the channel clean, please.",
    "I am designed to be helpful, not to handle toxicity.",
    "I'm ignoring that.",
    "Negative input detected. Focusing on the mission."
  ],
  
  UNKNOWN: [
    "I'm not programmed for that specific query yet.",
    "Interesting. I don't have a response for that.",
    "Command not recognized.",
    "I can't help with that, but I can check system status or say hello!"
  ]
};

