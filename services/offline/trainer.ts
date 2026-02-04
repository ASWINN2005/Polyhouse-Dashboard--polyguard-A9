import agronomy from "./knowledge/agronomy.json";
import faq from "./knowledge/faq.json";

export function loadOfflineKnowledge() {
  return { agronomy, faq };
}
