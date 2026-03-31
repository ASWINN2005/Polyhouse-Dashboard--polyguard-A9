// src/components/GeminiAdvisor.tsx
import React, { useEffect, useState, useRef } from 'react'
import type { SensorData, WeatherData } from '../types'
import { chatWithAgronomist, analyzePolyhouseData } from "../services/aiDecisionService";
import type { ActuatorState } from '../types';


// Replace lucide icons import if absent; keep UI minimal if lucide is missing.
import { BrainCircuit, RefreshCw, MessageSquare, Bot, Trash2, Send } from 'lucide-react'

type GeminiAdvisorProps = {
  currentData: SensorData
  weather?: WeatherData | null
  actuators: ActuatorState
  thresholds: any
  onToggleActuator: (key: keyof ActuatorState, forceState?: boolean) => void
}

type ChatMessage = { role: 'user' | 'ai'; text: string; buttons?: string[]; timestamp: string }

export const PolyhouseAIAdvisor: React.FC<GeminiAdvisorProps> = ({ currentData, weather, actuators, thresholds, onToggleActuator }) => {
  const [analysis, setAnalysis] = useState<{ analysis: string; recommendations: string[] } | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const [chatInput, setChatInput] = useState('')

  // Lazy initializer: reads localStorage ONCE at first render with NO state update.
  // This prevents any scroll-to-bottom effect from firing on page load or refresh.
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("polyhouse_chat");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })

  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // Track how many messages existed at initial load to detect only NEW additions
  const knownLengthRef = useRef(chatHistory.length)

  // Refs for tracking latest data without triggering endless re-renders
  const latestData = useRef(currentData);
  const latestActuators = useRef(actuators);
  const latestThresholds = useRef(thresholds);

  useEffect(() => { latestData.current = currentData; }, [currentData]);
  useEffect(() => { latestActuators.current = actuators; }, [actuators]);
  useEffect(() => { latestThresholds.current = thresholds; }, [thresholds]);

  useEffect(() => {
    // initial analysis
    fetchAnalysis();
    // periodic update every 2 minutes
    const id = setInterval(fetchAnalysis, 120000);
    return () => clearInterval(id);
  }, []);

  // Use refs in analysis to ensure we always fetch based on the absolute newest data 
  // without destroying and re-creating the 2-minute timer every 3 seconds.
  async function fetchAnalysis() {
    if (!latestData.current) return;
    setAnalysisLoading(true);
    try {
      const res = await analyzePolyhouseData(latestData.current, latestActuators.current, latestThresholds.current);
      setAnalysis({ analysis: res.analysis, recommendations: res.recommendations });
    } catch (e) {
      setAnalysis({ analysis: 'Analysis failed (local)', recommendations: [] });
    } finally {
      setTimeout(() => setAnalysisLoading(false), 500); // Small UI buffer for fast local execution
    }
  }

  // Persist chat history to localStorage on every change
  useEffect(() => {
    localStorage.setItem("polyhouse_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Only scroll when chatHistory LENGTH GROWS (new message sent), not on initial load
  useEffect(() => {
    if (chatHistory.length > knownLengthRef.current) {
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    knownLengthRef.current = chatHistory.length;
  }, [chatHistory])

  async function handleSend(overrideText?: string) {
    const textToSend = overrideText || chatInput.trim();
    if (!textToSend) return;

    const userMessage = {
      role: 'user' as const,
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setChatHistory((h) => [...h, userMessage]);
    if (!overrideText) setChatInput('');
    setChatLoading(true);

    try {
      const reply = await chatWithAgronomist(
        textToSend,
        {
          sensors: currentData,
          actuators: actuators,
          thresholds: thresholds,
          environment: weather?.current ?? { temp: 28, condition: 'Sunny', humidity: 45, windSpeed: 12 },
          system: {
            time: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            demoMode: false,
            latency: '24ms'
          }
        }
      );

      const aiMessage = {
        role: 'ai' as const,
        text: reply.text,
        buttons: reply.buttons,
        timestamp: new Date().toISOString()
      };

      setChatHistory((h) => [...h, aiMessage]);
      if (reply.commands && reply.commands.length > 0) {
        reply.commands.forEach(cmd => onToggleActuator(cmd.actuator, cmd.state));
      }
    } catch (error) {
      setChatHistory((h) => [
        ...h,
        {
          role: 'ai' as const,
          text: '🤖 I couldn\'t generate a response right now.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[550px]">
      {/* Left: Analysis */}
      <div className="h-[400px] lg:h-full bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">Smart Crop Doctor (Local)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Deterministic local advisor</p>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={analysisLoading}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700/50 text-gray-600 hover:text-emerald-600"
            title="Refresh"
          >
            <RefreshCw size={16} className={analysisLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {analysisLoading && !analysis ? (
            <div className="text-sm text-gray-500">Analyzing (local)…</div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded">
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">Summary</div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{analysis.analysis}</div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">Recommendations</div>
                <ul className="list-disc list-inside text-sm">
                  {analysis.recommendations.length ? (
                    analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <li className="text-sm text-gray-400">No actions recommended.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Waiting for sensor data...</div>
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="h-[500px] lg:h-full bg-white dark:bg-slate-800 rounded-2xl p-0 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white">Agronomist Assistant</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Local chat — concise replies</p>
            </div>
          </div>
          {chatHistory.length > 0 && (
            <button
              onClick={() => {
                setChatHistory([]);
                localStorage.removeItem("polyhouse_chat");
              }}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-700/50 text-gray-500 hover:text-red-500 transition-colors"
              title="Clear chat history"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-gray-50 dark:bg-slate-900/50">
          {chatHistory.length === 0 ? (
            <div className="text-center text-sm text-gray-500">
              <div className="mx-auto w-14 h-14 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                <Bot size={28} className="text-indigo-500" />
              </div>
              Ask about irrigation, temperature, or say "Hi".
            </div>
          ) : (
            chatHistory.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-emerald-600 border border-gray-200 dark:border-slate-600'}`}>
                  {m.role === 'user' ? 'ME' : 'AI'}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-600'}`}>
                  {m.text}
                  {m.role === 'ai' && m.buttons && m.buttons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.buttons.map((btn, bidx) => (
                         <button 
                           key={bidx} 
                           onClick={() => handleSend(btn)}
                           className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800"
                         >
                           {btn}
                         </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl">
          <div className="relative">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a question... (Enter to send)"
              className="w-full pl-6 pr-12 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button onClick={handleSend} disabled={chatLoading || !chatInput.trim()} className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PolyhouseAIAdvisor
