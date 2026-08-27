import React, { useState, useRef, useEffect } from 'react';
import type { CashFlowItem, Milestone } from '../App';

interface ExpertAdvisorProps {
  currentSavings: number;
  monthlyIncome: number;
  availableCash: number;
  targetGoal: number;
  investments: CashFlowItem[];
  setInvestments: React.Dispatch<React.SetStateAction<CashFlowItem[]>>;
  expenses: CashFlowItem[];
  setExpenses: React.Dispatch<React.SetStateAction<CashFlowItem[]>>;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
}

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

const ExpertAdvisor: React.FC<ExpertAdvisorProps> = ({
  currentSavings,
  monthlyIncome,
  availableCash,
  targetGoal,
  investments, setInvestments,
  expenses, setExpenses,
  milestones, setMilestones
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('legacyMilestone_groqKey') || '');
  const [isConfigured, setIsConfigured] = useState(() => !!localStorage.getItem('legacyMilestone_groqKey'));

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'I am your Stoic Advisor, powered by Llama 3 via Groq. I am fully wired into your terminal. You can ask me to "Add a 2,000 gym expense" or "Remove my PPF investment".'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isConfigured]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    localStorage.setItem('legacyMilestone_groqKey', apiKey.trim());
    setIsConfigured(true);
  };

  const handleClearKey = () => {
    localStorage.removeItem('legacyMilestone_groqKey');
    setApiKey('');
    setIsConfigured(false);
  };

  // --- ACTION EXECUTOR ENGINE ---
  const executeActions = (actions: any[]) => {
    actions.forEach(action => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      
      if (action.category === 'expense') {
        if (action.type === 'ADD') setExpenses(prev => [...prev, { id, ...action.payload }]);
        if (action.type === 'REMOVE') setExpenses(prev => prev.filter(i => i.id !== action.id));
        if (action.type === 'UPDATE') setExpenses(prev => prev.map(i => i.id === action.id ? { ...i, ...action.payload } : i));
      }
      
      if (action.category === 'investment') {
        if (action.type === 'ADD') setInvestments(prev => [...prev, { id, assetClass: 'equity', ...action.payload }]);
        if (action.type === 'REMOVE') setInvestments(prev => prev.filter(i => i.id !== action.id));
        if (action.type === 'UPDATE') setInvestments(prev => prev.map(i => i.id === action.id ? { ...i, ...action.payload } : i));
      }
      
      if (action.category === 'milestone') {
        if (action.type === 'ADD') setMilestones(prev => [...prev, { id, ...action.payload }]);
        if (action.type === 'REMOVE') setMilestones(prev => prev.filter(i => i.id !== action.id));
        if (action.type === 'UPDATE') setMilestones(prev => prev.map(i => i.id === action.id ? { ...i, ...action.payload } : i));
      }
    });
  };

  // --- NATIVE GROQ API INTEGRATION ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
    setInputText('');
    setIsLoading(true);

    try {
      const systemContext = `
        You are a highly analytical, stoic financial advisor. Keep answers highly concise and pragmatic.
        
        USER'S CURRENT FINANCIAL STATE:
        - Current Savings: ₹${currentSavings}
        - Monthly Income: ₹${monthlyIncome}
        - Available Cash: ₹${availableCash}
        - Expenses: ${JSON.stringify(expenses.map(e => ({ id: e.id, name: e.name, amount: e.amount, frequency: e.frequency })))}
        - Investments: ${JSON.stringify(investments.map(i => ({ id: i.id, name: i.name, amount: i.amount, frequency: i.frequency, assetClass: i.assetClass })))}
        - Milestones: ${JSON.stringify(milestones.map(m => ({ id: m.id, name: m.name, target: m.target })))}

        SYSTEM COMMAND:
        You have direct write access to the user's dashboard! If the user asks you to add, remove, or update an item, you MUST perform the action by appending a JSON array wrapped EXACTLY in <actions> tags at the very end of your response. Do not use markdown inside the actions tag.
        
        Action Schema:
        - ADD: { "type": "ADD", "category": "expense"|"investment"|"milestone", "payload": { "name": "...", "amount": 1000, "frequency": "monthly", "assetClass": "equity" } } 
        - REMOVE: { "type": "REMOVE", "category": "expense"|"investment"|"milestone", "id": "string_id_from_above" }
        - UPDATE: { "type": "UPDATE", "category": "expense"|"investment"|"milestone", "id": "string_id_from_above", "payload": { "amount": 2000 } }

        Example Response:
        I have added Netflix to your expenses.
        <actions>
        [
          { "type": "ADD", "category": "expense", "payload": { "name": "Netflix", "amount": 649, "frequency": "monthly" } }
        ]
        </actions>
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // <-- Updated model here!
          temperature: 0.1,
          messages: [
            { role: "system", content: systemContext },
            { role: "user", content: userText }
          ]
        })
      });

      if (!response.ok) {
        const rawErrorText = await response.text();
        let parsedErrorMsg = `HTTP Error ${response.status}`;
        try {
          const errorJson = JSON.parse(rawErrorText);
          parsedErrorMsg = errorJson.error?.message || parsedErrorMsg;
        } catch (e) {
          parsedErrorMsg = rawErrorText.substring(0, 100) || parsedErrorMsg; 
        }
        throw new Error(parsedErrorMsg);
      }

      const data = await response.json();
      let responseText = data.choices?.[0]?.message?.content || "No text response generated.";

      // Intercept and Execute the Actions Tag
      const actionsMatch = responseText.match(/<actions>([\s\S]*?)<\/actions>/);
      if (actionsMatch) {
        try {
          const actionsJson = JSON.parse(actionsMatch[1]);
          executeActions(actionsJson); 
          responseText = responseText.replace(/<actions>[\s\S]*?<\/actions>/, '').trim(); 
        } catch (err) {
          console.error("Failed to parse AI actions", err);
        }
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: responseText }]);
    } catch (error: any) {
      console.error("NLP Error:", error);
      let errorMsg = `My NLP engine failed: ${error.message}`;
      
      if (error.message.toLowerCase().includes("api key") || error.message.includes("401")) {
        errorMsg = "API Key Error: Please ensure your Groq API key is valid.";
        handleClearKey();
      }
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-[#0F1216] border border-[#2C3E50] w-[350px] sm:w-[450px] h-[550px] mb-4 flex flex-col shadow-2xl transition-all duration-300 ease-in-out">
          
          <div className="bg-[#181C28] border-b border-[#2C3E50] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-[#10b981]'}`}></div>
              <h3 className="text-[#E2E8F0] text-xs uppercase tracking-widest font-semibold">
                {isLoading ? 'Groq is calculating...' : 'Agentic NLP Advisor'}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {isConfigured && (
                <button onClick={handleClearKey} className="text-[#8B3A3A] hover:text-red-400 text-[10px] uppercase tracking-widest transition-colors" title="Remove API Key">
                  Reset Key
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-[#4A6572] hover:text-[#E2E8F0] transition-colors">✕</button>
            </div>
          </div>

          {!isConfigured ? (
            <div className="flex-1 p-6 flex flex-col justify-center items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#2C3E50]/50 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A6572" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              </div>
              <h4 className="text-[#E2E8F0] uppercase tracking-widest text-sm">Initialize Groq Engine</h4>
              <p className="text-[#4A6572] text-xs mb-4">Paste your free Groq API key (gsk_...) to activate Agentic processing. The key is stored locally.</p>
              
              <form onSubmit={handleSaveKey} className="w-full flex flex-col gap-3">
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  placeholder="gsk_..." 
                  className="w-full bg-[#0F1216] border border-[#2C3E50] text-[#E2E8F0] text-sm px-3 py-2 focus:border-[#4A6572] focus:outline-none text-center"
                />
                <button type="submit" className="bg-[#2C3E50] hover:bg-[#4A6572] text-[#E2E8F0] px-4 py-2 text-xs uppercase tracking-widest transition-colors">
                  Connect AI
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-[#2C3E50] text-[#E2E8F0] border border-[#4A6572]' : 'bg-[#181C28] text-[#E2E8F0] border border-[#2C3E50]'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#181C28] text-[#4A6572] border border-[#2C3E50] p-3 text-xs uppercase tracking-widest animate-pulse">
                      Executing operations...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-[#2C3E50] bg-[#181C28] flex gap-2">
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  disabled={isLoading}
                  placeholder="Tell me to add an expense or update an investment..." 
                  className="flex-1 bg-[#0F1216] border border-[#2C3E50] text-[#E2E8F0] text-sm px-3 py-2 focus:border-[#4A6572] focus:outline-none transition-colors disabled:opacity-50" 
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[#2C3E50] hover:bg-[#4A6572] text-[#E2E8F0] px-4 py-2 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  Command
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className={`${isOpen ? 'bg-[#181C28] border-[#4A6572]' : 'bg-[#2C3E50] hover:bg-[#4A6572] border-[#2C3E50]'} border text-[#E2E8F0] rounded-full p-4 shadow-lg transition-all duration-300 flex items-center justify-center group relative`}>
        <div className="absolute inset-0 rounded-full bg-[#10b981] opacity-20 blur-md group-hover:opacity-40 transition-opacity"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform relative z-10">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </div>
  );
};

export default ExpertAdvisor;