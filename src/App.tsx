import { useState, useEffect, useMemo, FormEvent } from "react";
import { 
  Sparkle, 
  Trash2, 
  RotateCcw, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Heart,
  Share2,
  Info,
  ChevronRight,
  TrendingDown,
  Percent,
  Plus,
  HelpCircle,
  PiggyBank,
  Coffee,
  Smartphone,
  Gamepad2,
  Dumbbell,
  Target,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ==========================================
// <!-- DATA TYPE DEFINITIONS -->
// ==========================================

// Structure representing an analyzed spending item (denominated in BASE USD for multi-currency safety)
interface ImpulseCheckItem {
  id: string;
  itemName: string;
  price: number; // Stored in Base USD
  monthlyBudget: number; // Stored in Base USD active at check
  timestamp: number;
  dailyBudget: number; // Stored in Base USD
  percentageOfDaily: number;
  vibeScore: "good" | "wait" | "no";
  comment: string;
  subtext: string;
  status: "pending" | "bought" | "saved";
}

// Quick pre-fill spent options (Prices in Base USD)
interface SpendingPreset {
  name: string;
  price: number; // In Base USD
  icon: any;
  category: string;
}

const PRESETS: SpendingPreset[] = [
  { name: "Artisanal Oat Latte", price: 6.75, icon: Coffee, category: "coffee" },
  { name: "Ergonomic Mechanical Keyboard", price: 129.00, icon: Smartphone, category: "tech" },
  { name: "Next-Gen Open World Game", price: 69.99, icon: Gamepad2, category: "game" },
  { name: "Premium Gym Pre-Workout", price: 44.50, icon: Dumbbell, category: "health" }
];

// Multi-currency multiplier metrics relative to 1 USD
interface CurrencyConfig {
  symbol: string;
  rate: number;
  label: string;
}

const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($)" },
  INR: { symbol: "₹", rate: 83.0, label: "INR (₹)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 0.79, label: "GBP (£)" }
};

interface SavingsGoal {
  name: string;
  targetAmount: number; // Stored in Base USD
  targetDate: string; // "YYYY-MM-DD"
  baselineSavings: number; // Stored in Base USD
}

export default function App() {
  // ==========================================
  // <!-- LOGIC SECTION: STATES & LOGIC -->
  // ==========================================

  // --- 1. Currency State ---
  const [currency, setCurrency] = useState<"USD" | "INR" | "EUR" | "GBP">(() => {
    const saved = localStorage.getItem("impulse_currency");
    return (saved as "USD" | "INR" | "EUR" | "GBP") || "USD";
  });

  // --- Helper Conversion Functions ---
  const toActiveCurrency = (valInUSD: number): number => {
    return valInUSD * CURRENCIES[currency].rate;
  };

  const toBaseUSD = (valInActive: number): number => {
    return valInActive / CURRENCIES[currency].rate;
  };

  // --- 2. Persistent Budget limit state (stored in Base USD) ---
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem("impulse_monthly_budget_usd");
    return saved ? Number(saved) : 450; // default $450 USD
  });

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  // Budget values edited in the live currency
  const [editedBudgetValue, setEditedBudgetValue] = useState<string>("");

  // Update budget values when currency or raw budget changes
  useEffect(() => {
    setEditedBudgetValue(String(Math.round(toActiveCurrency(monthlyBudget))));
  }, [monthlyBudget, currency]);

  // --- 3. Persistent Audit Logs (stored in Base USD) ---
  const [sanityLogs, setSanityLogs] = useState<ImpulseCheckItem[]>(() => {
    const saved = localStorage.getItem("impulse_sanity_logs_usd");
    return saved ? JSON.parse(saved) : [];
  });

  // --- 4. Persistent Savings Goal (stored in Base USD) ---
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(() => {
    const saved = localStorage.getItem("impulse_savings_goal");
    return saved ? JSON.parse(saved) : null;
  });

  // Goal Form Fields
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalBaseline, setGoalBaseline] = useState("");
  const [goalError, setGoalError] = useState<string | null>(null);

  // Active column tab switching
  const [activeTab, setActiveTab] = useState<"diagnostics" | "history" | "goals">("diagnostics");

  // --- 5. Interactive Form States ---
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState<string>(""); // input value entered in active currency
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // --- 6. Scanning simulator parameters ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState("");
  const [selectedResult, setSelectedResult] = useState<ImpulseCheckItem | null>(null);

  // --- Savings synchronization & storage triggers ---
  useEffect(() => {
    localStorage.setItem("impulse_currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("impulse_monthly_budget_usd", String(monthlyBudget));
  }, [monthlyBudget]);

  useEffect(() => {
    localStorage.setItem("impulse_sanity_logs_usd", JSON.stringify(sanityLogs));
  }, [sanityLogs]);

  useEffect(() => {
    if (savingsGoal) {
      localStorage.setItem("impulse_savings_goal", JSON.stringify(savingsGoal));
    } else {
      localStorage.removeItem("impulse_savings_goal");
    }
  }, [savingsGoal]);

  // --- 7. Derived Metrics ---
  const dailyDisposable = useMemo(() => {
    // Divided by 30 baseline days (stored in base USD)
    return monthlyBudget / 30;
  }, [monthlyBudget]);

  const moneyResisted = useMemo(() => {
    // Sum in Base USD
    return sanityLogs
      .filter(item => item.status === "saved")
      .reduce((sum, item) => sum + item.price, 0);
  }, [sanityLogs]);

  const moneySpent = useMemo(() => {
    // Sum in Base USD
    return sanityLogs
      .filter(item => item.status === "bought")
      .reduce((sum, item) => sum + item.price, 0);
  }, [sanityLogs]);

  const totalChecksCount = sanityLogs.length;

  // Calculable Live goal budget and progress indicators
  const savingsProgress = useMemo(() => {
    if (!savingsGoal) return 0;
    // Current savings progress = starting baseline + successfully resisted items - bought items
    return savingsGoal.baselineSavings + moneyResisted - moneySpent;
  }, [savingsGoal, moneyResisted, moneySpent]);

  // Days remaining target schedule calculation
  const daysRemaining = useMemo(() => {
    if (!savingsGoal) return 0;
    const target = new Date(savingsGoal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [savingsGoal]);

  // Baseline schedule for savings goals
  const requiredGoalSavingsDaily = useMemo(() => {
    if (!savingsGoal || daysRemaining <= 0) return 0;
    const gapToGoal = savingsGoal.targetAmount - savingsProgress;
    if (gapToGoal <= 0) return 0;
    return gapToGoal / daysRemaining;
  }, [savingsGoal, savingsProgress, daysRemaining]);

  // Realtime Advisory warning about potential purchases before clicking "Check"
  const putsGoalAtRisk = useMemo(() => {
    if (!savingsGoal || !itemPrice || isNaN(Number(itemPrice)) || Number(itemPrice) <= 0) return null;
    
    const costInUSD = toBaseUSD(Number(itemPrice));
    const potentialProgress = savingsProgress - costInUSD;
    const potentialRemaining = savingsGoal.targetAmount - potentialProgress;
    
    if (daysRemaining <= 0) {
      return {
        isAtRisk: true,
        reason: "The target calendar deadline has passed. Any further spending increases your progress deficit!"
      };
    }
    
    const potentialRequiredDaily = potentialRemaining / daysRemaining;
    const currentRequiredDaily = Math.max(0, (savingsGoal.targetAmount - savingsProgress) / daysRemaining);
    const diff = potentialRequiredDaily - currentRequiredDaily;
    
    // Fun Allowance threshold limit
    const dailyDisposableUSD = monthlyBudget / 30;
    
    if (potentialRequiredDaily > dailyDisposableUSD) {
      return {
        isAtRisk: true,
        reason: `🚨 RISK DETECTED: This purchase raises your scheduled daily save rate to ${CURRENCIES[currency].symbol}${toActiveCurrency(potentialRequiredDaily).toFixed(2)}/day, which exceeds your active Daily Fun allowance of ${CURRENCIES[currency].symbol}${toActiveCurrency(dailyDisposableUSD).toFixed(0)}/day.`
      };
    }
    
    if (potentialProgress < 0) {
      return {
        isAtRisk: true,
        reason: `🚨 OUT OF FUNDS: This buy depletes your goal progress into a negative deficit of ${CURRENCIES[currency].symbol}${Math.abs(toActiveCurrency(potentialProgress)).toFixed(2)}.`
      };
    }

    if (diff > 0 && (costInUSD > dailyDisposableUSD)) {
      return {
        isAtRisk: true,
        reason: `⚠️ ALERT: This purchase increases your required daily savings burden by +${CURRENCIES[currency].symbol}${toActiveCurrency(diff).toFixed(2)}/day to stay on schedule.`
      };
    }
    
    return null;
  }, [savingsGoal, savingsProgress, itemPrice, daysRemaining, monthlyBudget, currency]);

  // Today's minimum constraint date format YYYY-MM-DD
  const todayFormatted = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // --- 8. Witty Verdict Categorization (inputs in Base USD) ---
  const getVibeAnalysis = (name: string, priceInUSD: number, dailyBudgetInUSD: number) => {
    const ratio = priceInUSD / dailyBudgetInUSD;
    const nameLower = name.toLowerCase();

    let vibeScore: "good" | "wait" | "no";
    if (ratio <= 0.5) {
      vibeScore = "good";
    } else if (ratio <= 1.5) {
      vibeScore = "wait";
    } else {
      vibeScore = "no";
    }

    let comment = "";
    let subtext = "";

    // Trigger categories
    if (
      nameLower.includes("coffee") || 
      nameLower.includes("latte") || 
      nameLower.includes("espresso") || 
      nameLower.includes("starbucks") || 
      nameLower.includes("tea") || 
      nameLower.includes("boba")
    ) {
      if (vibeScore === "good") {
        comment = "Approved liquid utility. Minor cash leak.";
        subtext = "Nice simple treat. Keep enjoying, but don't let the cafe turn your pocket into theirs.";
      } else {
        comment = "A premium cup of lifestyle markup.";
        subtext = `Did you know home coffee pays itself back in a week? This run wastes ${(ratio * 100).toFixed(0)}% of your secure daily budget allowance.`;
      }
    } else if (
      nameLower.includes("sneaker") || 
      nameLower.includes("shoe") || 
      nameLower.includes("nike") || 
      nameLower.includes("clothing") || 
      nameLower.includes("apparel") || 
      nameLower.includes("jacket") || 
      nameLower.includes("shirt")
    ) {
      if (vibeScore === "good") {
        comment = "Wardrobe maintenance. Acceptable!";
        subtext = "It fits cleanly under your daily allowance baseline. Go out and wear it warmly.";
      } else if (vibeScore === "wait") {
        comment = "Standby! Does your closet actually lack depth?";
        subtext = "Equivalent to nearly a full day of total allowance. Give this a cooling-off buffer of 24 hours.";
      } else {
        comment = "Your closet called, it's having a structural panic attack.";
        subtext = `This single impulse consumes ${ratio.toFixed(1)} consecutive days of fun allowance. Put down local sneakers and step away.`;
      }
    } else if (
      nameLower.includes("gadget") || 
      nameLower.includes("keyboard") || 
      nameLower.includes("mouse") || 
      nameLower.includes("tech") || 
      nameLower.includes("phone") || 
      nameLower.includes("headphones")
    ) {
      if (vibeScore === "good") {
        comment = "Hardware add-on. Reasonable cost footprint.";
        subtext = "As long as it's not a duplicate cord, your wallet approves.";
      } else {
        comment = "Paying dopamine tax to technical giant companies.";
        subtext = `Will this accessory actually boost your productive output, or just provide a 10-minute retail high? Consumes ${ratio.toFixed(1)} days of budget freedom.`;
      }
    } else if (
      nameLower.includes("uber") || 
      nameLower.includes("dash") || 
      nameLower.includes("delivery") || 
      nameLower.includes("takeout") || 
      nameLower.includes("restaurant")
    ) {
      if (ratio > 1.0) {
        comment = "Lukewarm premium delivery tax.";
        subtext = "Scurry back to your refrigerator. Cooking is a literal superpower when it comes to compounding your bank.";
      } else {
        comment = "Convenience nutrition on an active budget.";
        subtext = "Passable comfort, but keep these small micro-drains accounted for so they don't compound.";
      }
    } else {
      // General proportional scale comments
      if (vibeScore === "good") {
        comment = "Approved Impulse. Minor impact profile.";
        subtext = `Under ${(ratio * 100).toFixed(0)}% of your daily allowance. Purchase with absolute calm and clear thoughts.`;
      } else if (vibeScore === "wait") {
        comment = "Buffer warning. The 24-Hour cooling method applies.";
        subtext = `This absorbs ${(ratio * 100).toFixed(0)}% of today's allowance. Let it sleep in your mind until tomorrow morning.`;
      } else {
        comment = "Hold up! Severe financial atmospheric pressure.";
        subtext = `This takes ${ratio.toFixed(1)} days of your fun boundary. Back away from the buy layout and close the tab.`;
      }
    }

    return { vibeScore, comment, subtext };
  };

  // --- 9. Actions & Handlers ---
  const handleApplyPreset = (preset: SpendingPreset) => {
    setItemName(preset.name);
    // Preset price is in base USD, prefill in selected active currency term
    setItemPrice((preset.price * CURRENCIES[currency].rate).toFixed(2));
    setActiveAlert(null);
  };

  const handleUpdateBudget = () => {
    const valueNum = Number(editedBudgetValue);
    if (!isNaN(valueNum) && valueNum > 0) {
      // Convert active value entered on screen back to base USD to store
      setMonthlyBudget(toBaseUSD(valueNum));
      setIsEditingBudget(false);
      setActiveAlert(null);
    } else {
      setActiveAlert("Budget value must be a valid positive number.");
    }
  };

  const executeDiagnosticPulse = () => {
    if (!itemName.trim()) {
      setActiveAlert("Please enter a valid item name first.");
      return;
    }
    const costInActive = Number(itemPrice);
    if (isNaN(costInActive) || costInActive <= 0) {
      setActiveAlert("Please enter a realistic, positive price.");
      return;
    }

    setActiveAlert(null);
    setIsScanning(true);
    setActiveTab("diagnostics"); // Automatically focus tab to diagnostics to see outcome

    const steps = [
      "Calculating your actual disposable limits...",
      "Simulating alternative compounding stock indices...",
      "Analyzing emotional pulse against wallet baseline...",
      "Vibe checked. Generating diagnostic verdict..."
    ];

    let currentStep = 0;
    setScanStepMessage(steps[0]);

    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setScanStepMessage(steps[currentStep]);
      } else {
        clearInterval(stepInterval);
        
        // Convert to base USD for storage
        const costInUSD = toBaseUSD(costInActive);
        const calculatedDailyUSD = dailyDisposable;
        const percentageOfDaily = Math.round((costInUSD / calculatedDailyUSD) * 100);
        const { vibeScore, comment, subtext } = getVibeAnalysis(itemName, costInUSD, calculatedDailyUSD);

        const newResult: ImpulseCheckItem = {
          id: Math.random().toString(36).substring(2, 9),
          itemName: itemName.trim(),
          price: costInUSD,
          monthlyBudget,
          timestamp: Date.now(),
          dailyBudget: calculatedDailyUSD,
          percentageOfDaily,
          vibeScore,
          comment,
          subtext,
          status: "pending"
        };

        setSanityLogs((prev) => [newResult, ...prev]);
        setSelectedResult(newResult);
        setIsScanning(false);
        setScanStepMessage("");

        // Reset inputs
        setItemName("");
        setItemPrice("");
      }
    }, 550);
  };

  const changeItemStatus = (itemId: string, newStatus: "pending" | "bought" | "saved") => {
    setSanityLogs((prev) => 
      prev.map((item) => item.id === itemId ? { ...item, status: newStatus } : item)
    );
    if (selectedResult && selectedResult.id === itemId) {
      setSelectedResult(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const deleteLogItem = (itemId: string) => {
    setSanityLogs((prev) => prev.filter((item) => item.id !== itemId));
    if (selectedResult?.id === itemId) {
      setSelectedResult(null);
    }
  };

  const clearAllLogs = () => {
    if (window.confirm("Are you sure you want to clear your full sanity check history?")) {
      setSanityLogs([]);
      setSelectedResult(null);
    }
  };

  // Setup state for saving goals
  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      setGoalError("Goal name is required.");
      return;
    }
    const targetVal = Number(goalTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      setGoalError("Please enter a valid positive target amount.");
      return;
    }
    if (!goalDate) {
      setGoalError("Please select a calendar target date.");
      return;
    }
    const baselineVal = Number(goalBaseline || "0");
    if (isNaN(baselineVal) || baselineVal < 0) {
      setGoalError("Please enter a valid baseline amount.");
      return;
    }

    // Convert target and baseline which were entered in live currency back to Base USD!
    setSavingsGoal({
      name: goalName.trim(),
      targetAmount: toBaseUSD(targetVal),
      targetDate: goalDate,
      baselineSavings: toBaseUSD(baselineVal)
    });

    setGoalError(null);
    setGoalName("");
    setGoalTarget("");
    setGoalDate("");
    setGoalBaseline("");
  };

  const handleDeleteGoal = () => {
    if (window.confirm("Are you sure you want to delete this savings goal?")) {
      setSavingsGoal(null);
    }
  };

  return (
    // ==========================================
    // <!-- UI SECTION: RENDERING & DESIGNS -->
    // ==========================================
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] flex flex-col font-sans relative overflow-x-hidden antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* Decorative premium blurs */}
      <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-900/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-purple-900/5 blur-[130px] pointer-events-none" />

      {/* Main Top Header Area formatted as the elegant dark template */}
      <nav id="navbar" className="h-16 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-600/15">I</div>
          <div>
            <span className="text-sm sm:text-base font-semibold tracking-wide uppercase text-[#EDEDED]">Impulse Check</span>
            <span className="hidden sm:inline text-[9px] text-[#555] font-mono ml-2 uppercase tracking-widest">Financial Calibrator</span>
          </div>
        </div>

        {/* Global Controls: Currency Selector & Status Indicators */}
        <div className="flex items-center gap-4 text-[10px] sm:text-xs font-medium text-[#707070] uppercase tracking-widest">
          {/* CURRENCY SELECTOR */}
          <div className="flex items-center gap-1.5 bg-[#090909] border border-[#1C1C1C] rounded-lg px-2.5 py-1">
            <span className="text-[9px] text-[#555] font-bold">CURRENCY:</span>
            <select
              id="currency-selector"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "INR" | "EUR" | "GBP")}
              className="bg-transparent border-none text-[#EDEDED] font-mono text-[10px] sm:text-xs focus:ring-0 focus:outline-none cursor-pointer py-0 px-0.5 "
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <span className="hidden sm:block h-4 w-[1px] bg-[#222]"></span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Active
          </span>
          <span className="hidden sm:block h-4 w-[1px] bg-[#222]"></span>
          <span className="hidden sm:inline font-mono">v2.10 Stable</span>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls, Custom Limit, Input Panel (lg:col-span-7) */}
        <div id="calculator-section" className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Quick Info & Savings Counter Summary Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 hover:border-emerald-500/20 transition-all duration-300">
              <p className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Saved (Resisted)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-base sm:text-lg font-mono font-bold text-[#EDEDED]">
                  {CURRENCIES[currency].symbol}{toActiveCurrency(moneyResisted).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 hover:border-rose-500/20 transition-all duration-300">
              <p className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Spent (Bought anyway)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="text-base sm:text-lg font-mono font-bold text-[#EDEDED]">
                  {CURRENCIES[currency].symbol}{toActiveCurrency(moneySpent).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Dynamic Budget Calibration Card */}
          <section id="budget-card" className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 sm:p-8 transition-all duration-300 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Global limits parameters</span>
                <h2 className="font-display font-semibold tracking-tight text-lg text-[#EDEDED]">Monthly Fun Allowance</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Dynamic Edit Allowance input */}
              <div className="md:col-span-7">
                {isEditingBudget ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-[#707070] uppercase font-semibold">Set New Limit ({CURRENCIES[currency].symbol})</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-500">{CURRENCIES[currency].symbol}</span>
                        <input
                          id="budget-input"
                          type="text"
                          value={editedBudgetValue}
                          onChange={(e) => setEditedBudgetValue(e.target.value)}
                          className="w-full bg-[#0F0F0F] border border-[#222] rounded-md py-2.5 pl-7 pr-3 text-sm text-[#EDEDED] font-mono focus:outline-none focus:border-indigo-600 transition-colors"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <button
                        id="save-budget-btn"
                        onClick={handleUpdateBudget}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-md transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                      <button
                        id="cancel-budget-btn"
                        onClick={() => {
                          setEditedBudgetValue(String(Math.round(toActiveCurrency(monthlyBudget))));
                          setIsEditingBudget(false);
                          setActiveAlert(null);
                        }}
                        className="bg-[#18181b] hover:bg-[#222] text-xs text-[#707070] py-2.5 px-3 rounded-md transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-[#EDEDED] tracking-tight">
                      {CURRENCIES[currency].symbol}{Math.round(toActiveCurrency(monthlyBudget)).toLocaleString("en-US")}
                    </span>
                    <button
                      id="edit-budget-trigger"
                      onClick={() => setIsEditingBudget(true)}
                      className="text-indigo-500 hover:text-indigo-400 text-xs font-semibold tracking-wider uppercase flex items-center gap-1 transition-all cursor-pointer"
                    >
                      (Edit)
                    </button>
                  </div>
                )}
                <p className="text-xs text-[#707070] mt-3 font-mono">
                  Allowance boundary to run active impulse diagnostics against.
                </p>
              </div>

              {/* Computed daily allowance based on live base */}
              <div className="md:col-span-5 bg-[#0F0F0F] border border-[#1A1A1A] p-4 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] text-[#707070] uppercase font-bold tracking-wider block mb-1">
                  DAILY ALLOWANCE LIMIT
                </span>
                <span className="text-xl font-bold font-mono text-[#EDEDED]">
                  {CURRENCIES[currency].symbol}{toActiveCurrency(dailyDisposable).toFixed(2)}
                  <span className="text-xs text-[#707070] font-normal"> / day</span>
                </span>
              </div>
            </div>
          </section>

          {/* 2. Primary Spend Request Form */}
          <section id="interaction-form-section" className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-2xl relative">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Interactive assessment model</span>
            
            <div className="flex items-center gap-2 mb-6">
              <h2 className="font-display font-semibold tracking-tight text-lg text-[#EDEDED]">Purchase Profile Details</h2>
            </div>

            {/* Error alerts */}
            {activeAlert && (
              <div className="mb-6 p-4 bg-[#111] border border-rose-950/40 text-rose-500 text-xs rounded-xl flex items-center gap-3 font-mono">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{activeAlert}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Item Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-[#707070] uppercase font-semibold">Item Name</label>
                <input
                  id="item-name-input"
                  type="text"
                  maxLength={50}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="bg-[#0F0F0F] border border-[#222] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-indigo-600 transition-colors text-[#EDEDED] placeholder-[#3a3a3a]"
                  placeholder="e.g. Mechanical Keyboard (V3)"
                />
              </div>

              {/* Price Entry (prefixed with current currency symbol) */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-[#707070] uppercase font-semibold">Item Price ({CURRENCIES[currency].symbol})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#707070] select-none">{CURRENCIES[currency].symbol}</span>
                  <input
                    id="item-price-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#222] rounded-md py-3 pl-8 pr-4 text-sm font-mono focus:outline-none focus:border-indigo-600 transition-colors text-[#EDEDED] placeholder-[#3a3a3a]"
                    placeholder="189.00"
                  />
                </div>
              </div>

              {/* Real-time Savings Goal Impact Warning advisory */}
              {putsGoalAtRisk && (
                <div className="p-4 bg-[#0A0600] border border-amber-900/35 text-amber-500 rounded-xl flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-400">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Real-time Goal advisory: '{savingsGoal?.name}'</span>
                  </div>
                  <p className="leading-relaxed select-text">
                    {putsGoalAtRisk.reason}
                  </p>
                </div>
              )}

              {/* Spend Presets Quick Selector */}
              <div className="pt-2">
                <span className="text-[10px] text-[#707070] uppercase font-bold tracking-widest block mb-3">
                  OR QUICK PRE-FILL SPEND TARGET
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map((preset) => {
                    const PresetIcon = preset.icon;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleApplyPreset(preset)}
                        className="flex items-center gap-2 text-left bg-[#0F0F0F] hover:bg-[#151515] border border-[#1A1A1A] hover:border-[#222] rounded-xl p-3 transition-all text-xs text-gray-300 hover:text-white cursor-pointer"
                      >
                        <span className="p-1 px-1.5 rounded bg-indigo-500/10 text-indigo-400 flex items-center">
                          <PresetIcon className="h-3.5 w-3.5" />
                        </span>
                        <div className="overflow-hidden">
                          <p className="truncate font-medium">{preset.name}</p>
                          <p className="text-[10px] text-[#707070] font-mono">{CURRENCIES[currency].symbol}{toActiveCurrency(preset.price).toFixed(2)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Great Impulse Trigger button conforming to Elegant Dark styles */}
              <div className="pt-4">
                <motion.button
                  id="check-impulse-btn"
                  onClick={executeDiagnosticPulse}
                  disabled={isScanning}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-4 px-6 rounded-xl font-display font-medium text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 ${
                    isScanning 
                      ? "bg-[#0F0F0F] border border-[#1A1A1A] text-indigo-400" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg shadow-indigo-900/20"
                  }`}
                >
                  {/* Glowing scanner line animation when processing */}
                  {isScanning && (
                    <motion.div 
                      key="scanline"
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_10px_#818cf8]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  )}

                  {isScanning ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                      <span className="font-mono text-xs tracking-wider animate-pulse">
                        {scanStepMessage || "ASSESSING SPEND SUITABILITY..."}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>CHECK IMPULSE</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </>
                  )}
                </motion.button>
              </div>

            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Tab switcher with Verdict, History & Goals (lg:col-span-5) */}
        <div id="tabs-column" className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Tabs navigation menu wrapper */}
          <div className="flex border-b border-[#1A1A1A] gap-4">
            <button
              id="tab-diagnostics-btn"
              onClick={() => setActiveTab("diagnostics")}
              className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 hover:text-[#EDEDED] transition-all cursor-pointer ${
                activeTab === "diagnostics" 
                  ? "border-indigo-600 text-[#EDEDED]" 
                  : "border-transparent text-[#707070]"
              }`}
            >
              Verdict
            </button>
            <button
              id="tab-history-btn"
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 hover:text-[#EDEDED] transition-all relative flex items-center gap-1.5 cursor-pointer ${
                activeTab === "history" 
                  ? "border-indigo-600 text-[#EDEDED]" 
                  : "border-transparent text-[#707070]"
              }`}
            >
              <span>History Log</span>
              {totalChecksCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono leading-none rounded-full bg-indigo-900/40 text-indigo-400 font-bold">
                  {totalChecksCount}
                </span>
              )}
            </button>
            <button
              id="tab-goals-btn"
              onClick={() => setActiveTab("goals")}
              className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 hover:text-[#EDEDED] transition-all relative flex items-center gap-1.5 cursor-pointer ${
                activeTab === "goals" 
                  ? "border-indigo-600 text-[#EDEDED]" 
                  : "border-transparent text-[#707070]"
              }`}
            >
              <span>Savings Goals</span>
              {savingsGoal && (
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (savingsProgress >= savingsGoal.targetAmount) ? "bg-emerald-500 animate-pulse" : "bg-indigo-400 animate-pulse"
                }`} />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* TAB 1: DIAGNOSTICS & VERDICT COVER */}
            {activeTab === "diagnostics" && (
              <motion.div
                key="tab-diagnostics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {selectedResult ? (
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    {/* Visual elegant blur gradient overlay */}
                    <div className={`absolute -top-12 -right-12 w-32 h-32 blur-3xl rounded-full ${
                      selectedResult.vibeScore === "good" 
                        ? "bg-emerald-600/10" 
                        : selectedResult.vibeScore === "wait"
                        ? "bg-amber-600/10" 
                        : "bg-rose-600/10"
                    }`} />

                    <div className="mb-4 text-center">
                      <span className={`text-[11px] font-bold uppercase tracking-[0.3em] ${
                        selectedResult.vibeScore === "good" 
                          ? "text-emerald-500" 
                          : selectedResult.vibeScore === "wait"
                          ? "text-amber-500" 
                          : "text-rose-500"
                      }`}>
                        The Analysis
                      </span>
                    </div>

                    {/* Display Item Name and Price clearly inside findings */}
                    <div className="text-center mb-6">
                      <h3 className="font-display font-medium text-lg leading-tight text-[#EDEDED] uppercase tracking-wide select-all">{selectedResult.itemName}</h3>
                      <p className="text-xs font-mono text-[#707070] mt-1.5">
                        Amount: <span className="text-white font-bold">{CURRENCIES[currency].symbol}{toActiveCurrency(selectedResult.price).toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                      {/* Huge bold word display */}
                      <div className={`text-[90px] leading-none font-black tracking-tighter mb-4 italic select-all text-center ${
                        selectedResult.vibeScore === "good" 
                          ? "text-emerald-400" 
                          : selectedResult.vibeScore === "wait"
                          ? "text-amber-400" 
                          : "text-white"
                      }`}>
                        {selectedResult.vibeScore === "good" && "YES."}
                        {selectedResult.vibeScore === "wait" && "WAIT."}
                        {selectedResult.vibeScore === "no" && "NO."}
                      </div>

                      <div className={`px-6 py-2 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-lg ${
                        selectedResult.vibeScore === "good" 
                          ? "bg-emerald-600 shadow-emerald-900/30" 
                          : selectedResult.vibeScore === "wait"
                          ? "bg-amber-600 shadow-amber-900/30" 
                          : "bg-rose-600 shadow-rose-900/30"
                      }`}>
                        {selectedResult.vibeScore === "good" && "Good Buy Vibe"}
                        {selectedResult.vibeScore === "wait" && "Wait a Day Vibe"}
                        {selectedResult.vibeScore === "no" && "Hard No Vibe"}
                      </div>
                    </div>

                    {/* Info cards map */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-[#111] p-4 rounded-xl border border-[#222]">
                        <div className="text-[10px] text-[#707070] uppercase font-bold mb-1">Daily Allowance</div>
                        <div className="text-sm font-mono text-white">
                          {CURRENCIES[currency].symbol}{toActiveCurrency(selectedResult.dailyBudget).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#111] p-4 rounded-xl border border-[#222]">
                        <div className="text-[10px] text-[#707070] uppercase font-bold mb-1">Budget Drain</div>
                        <div className={`text-sm font-mono ${
                          selectedResult.vibeScore === "good" 
                            ? "text-emerald-400" 
                            : selectedResult.vibeScore === "wait"
                            ? "text-amber-400" 
                            : "text-rose-500"
                        }`}>
                          { (selectedResult.price / selectedResult.dailyBudget).toFixed(1) } Days allowance
                        </div>
                      </div>
                    </div>

                    {/* Risk Indicator Integration inside Verdict active card */}
                    {savingsGoal && (
                      <div className="mb-8 p-3 bg-[#0C0C0D] border border-[#1A1A1A] rounded-xl flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#707070]">Goal impacts:</span>
                        <span className={`font-semibold ${
                          (selectedResult.price > dailyDisposable) ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {(selectedResult.price > dailyDisposable) ? "⚠️ Highly Dilutive" : "✅ Target Safe"}
                        </span>
                      </div>
                    )}

                    <div className="text-center space-y-4 mb-8">
                      {/* Beautiful Serif commentary quote */}
                      <p className="text-lg font-serif italic text-white leading-relaxed select-text">
                        "{selectedResult.comment}"
                      </p>
                      
                      {/* Small colored theme divider lines */}
                      <div className={`h-[1px] w-12 mx-auto opacity-50 ${
                        selectedResult.vibeScore === "good" 
                          ? "bg-emerald-500" 
                          : selectedResult.vibeScore === "wait"
                          ? "bg-amber-500" 
                          : "bg-rose-600"
                      }`} />

                      {/* Subtitle explanation details */}
                      <p className="text-xs text-[#707070] font-sans leading-relaxed max-w-sm mx-auto select-text">
                        {selectedResult.subtext}
                      </p>
                    </div>

                    {/* Choice controls aligned elegantly */}
                    <div className="border-t border-[#1A1A1A]/90 pt-6">
                      <span className="text-[10px] text-[#707070] uppercase font-bold tracking-widest block mb-4 text-center">
                        Resolve impulse choice
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          id="mark-resisted-active-btn"
                          onClick={() => changeItemStatus(selectedResult.id, "saved")}
                          disabled={selectedResult.status === "saved"}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all outline-none ${
                            selectedResult.status === "saved"
                              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono cursor-default"
                              : "bg-[#0F0F0F] border border-[#222] text-emerald-400 hover:bg-emerald-950/20 active:scale-95 cursor-pointer"
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Resisted 💰</span>
                        </button>

                        <button
                          id="mark-bought-active-btn"
                          onClick={() => changeItemStatus(selectedResult.id, "bought")}
                          disabled={selectedResult.status === "bought"}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all outline-none ${
                            selectedResult.status === "bought"
                              ? "bg-rose-500/10 border border-rose-500/25 text-rose-400 font-mono cursor-default"
                              : "bg-[#0F0F0F] border border-[#222] text-rose-400 hover:bg-rose-950/20 active:scale-95 cursor-pointer"
                          }`}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Bought 💸</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 font-mono">
                        <span>Status: <strong className="text-[#888]">{selectedResult.status}</strong></span>
                        <button
                          id="close-result-panel-btn"
                          onClick={() => setSelectedResult(null)}
                          className="text-[#707070] hover:text-white transition-all cursor-pointer underline"
                        >
                          Clear verdict overlay
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="border border-[#1A1A1A] bg-[#0A0A0A] rounded-3xl p-8 py-10 flex flex-col items-center justify-center text-center shadow-lg pointer-events-none select-none">
                    <HelpCircle className="h-10 w-10 text-[#444] animate-pulse mb-3" />
                    <h3 className="font-display font-medium text-sm text-[#707070] uppercase tracking-wider">Awaiting Active diagnosis</h3>
                    <p className="text-xs text-[#555] font-mono mt-2 max-w-xs">
                      Enter item name and cost on the left to activate diagnostic calibration.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: HISTORY LOG TRAIL */}
            {activeTab === "history" && (
              <motion.div
                key="tab-history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 shadow-xl flex flex-col min-h-[350px]">
                  <div className="flex items-center justify-between mb-4 border-b border-[#1A1A1A]/90 pb-4">
                    <h2 className="font-display font-semibold tracking-tight text-sm uppercase text-[#EDEDED]">PERSISTENT AUDIT TRAILS</h2>
                    {totalChecksCount > 0 && (
                      <button
                        id="clear-all-logs-btn"
                        onClick={clearAllLogs}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-all text-[11px] font-mono cursor-pointer uppercase tracking-wider font-semibold"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {totalChecksCount === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 select-none">
                      <Clock className="h-8 w-8 text-[#444] mb-2 animate-pulse" />
                      <p className="text-xs text-[#707070] mb-1 font-mono">No log history found.</p>
                      <p className="text-[10px] text-[#555] font-mono max-w-xs leading-normal">
                        All checks triggered will generate secure persistent browser audit history in this local sandbox.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-[480px] space-y-3 pr-1 scrollbar-thin">
                      {sanityLogs.map((item) => {
                        return (
                          <div
                            key={item.id}
                            className={`relative border rounded-xl p-3.5 flex flex-col gap-3 transition-all duration-200 bg-[#0F0F0F] ${
                              item.status === "saved" 
                                ? "border-emerald-500/20 bg-emerald-950/5" 
                                : item.status === "bought"
                                ? "border-rose-500/20 bg-rose-950/5"
                                : "border-[#1A1A1A] hover:border-[#222]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Title and stats */}
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-1.5">
                                  {/* Color vibe pill indicator */}
                                  <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                    item.vibeScore === "good" 
                                      ? "bg-emerald-500" 
                                      : item.vibeScore === "wait"
                                      ? "bg-amber-500" 
                                      : "bg-rose-500"
                                  }`} />
                                  <h4 className="font-sans font-semibold text-xs text-[#EDEDED] truncate tracking-tight pr-1 select-all">
                                    {item.itemName}
                                  </h4>
                                </div>
                                
                                <p className="text-[10px] text-[#707070] mt-1.5 font-mono">
                                  {CURRENCIES[currency].symbol}{toActiveCurrency(item.price).toFixed(2)} — <span className="text-[#555]">{(item.price / item.dailyBudget).toFixed(1)} Days limit</span>
                                </p>
                              </div>

                              {/* Interactive Delete/Audit log item */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  item.status === "saved"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                    : item.status === "bought"
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/15"
                                    : "bg-[#222] text-[#707070]"
                                }`}>
                                  {item.status}
                                </span>

                                <button
                                  id={`delete-log-item-${item.id}`}
                                  onClick={() => deleteLogItem(item.id)}
                                  className="text-[#555] hover:text-rose-400 p-1 rounded-md hover:bg-[#18181b] transition-colors cursor-pointer"
                                  title="Remove from audit history"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Prompt interactive selection when pending status */}
                            {item.status === "pending" && (
                              <div className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-lg flex items-center justify-between gap-2">
                                <p className="text-[10px] text-[#707070] font-sans tracking-wide">
                                  Decision resolution:
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    id={`mark-resisted-log-${item.id}`}
                                    onClick={() => changeItemStatus(item.id, "saved")}
                                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 py-1 px-2.5 rounded-md font-semibold font-mono active:scale-95 transition-all cursor-pointer outline-none"
                                  >
                                    Resisted
                                  </button>
                                  <button
                                    id={`mark-bought-log-${item.id}`}
                                    onClick={() => changeItemStatus(item.id, "bought")}
                                    className="text-[10px] bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 py-1 px-2.5 rounded-md font-semibold font-mono active:scale-95 transition-all cursor-pointer outline-none"
                                  >
                                    Bought
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Display quick inspect option if already processed */}
                            {item.status !== "pending" && (
                              <button
                                id={`reopen-log-${item.id}`}
                                onClick={() => {
                                  setSelectedResult(item);
                                  setActiveTab("diagnostics");
                                }}
                                className="text-[10px] text-[#707070] hover:text-indigo-400 text-left transition-all hover:underline cursor-pointer"
                              >
                                View full parameters & commentary &rarr;
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {/* TAB 3: SAVINGS GOALS INTEGRATION */}
            {activeTab === "goals" && (
              <motion.div
                key="tab-goals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {!savingsGoal ? (
                  // Setup clean configuration interface
                  <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4 border-b border-[#1A1A1A]/80 pb-3">
                      <Target className="h-5 w-5 text-indigo-500" />
                      <h3 className="font-display font-semibold tracking-tight text-sm uppercase text-[#EDEDED]">Set Savings Target</h3>
                    </div>

                    {goalError && (
                      <div className="mb-4 p-3 bg-[#111] border border-rose-955 text-rose-400 text-xs rounded-xl font-mono">
                        {goalError}
                      </div>
                    )}

                    <form onSubmit={handleSaveGoal} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Goal Name</label>
                        <input
                          type="text"
                          maxLength={40}
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          className="bg-[#0F0F0F] border border-[#222] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 text-[#EDEDED] placeholder-[#3a3a3a]"
                          placeholder="e.g. M3 Macbook Pro"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Target Amount ({CURRENCIES[currency].symbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#707070]">{CURRENCIES[currency].symbol}</span>
                          <input
                            type="number"
                            min="1"
                            value={goalTarget}
                            onChange={(e) => setGoalTarget(e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#222] rounded-md py-2 pl-7 pr-3 text-xs font-mono focus:outline-none focus:border-indigo-600 text-[#EDEDED]"
                            placeholder="1200"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Target Calendar Date</label>
                        <input
                          type="date"
                          min={todayFormatted}
                          value={goalDate}
                          onChange={(e) => setGoalDate(e.target.value)}
                          className="bg-[#0F0F0F] border border-[#222] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 text-[#EDEDED] font-mono cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-[#707070] uppercase font-bold tracking-wider">Starting Savings ({CURRENCIES[currency].symbol})</label>
                          <span className="text-[9px] text-[#444] font-mono uppercase font-bold">Optional baseline</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#707070]">{CURRENCIES[currency].symbol}</span>
                          <input
                            type="number"
                            min="0"
                            value={goalBaseline}
                            onChange={(e) => setGoalBaseline(e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#222] rounded-md py-2 pl-7 pr-3 text-xs font-mono focus:outline-none focus:border-indigo-600 text-[#EDEDED]"
                            placeholder="200"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-md transition-colors cursor-pointer"
                        >
                          Lock Savings Target Goal
                        </button>
                      </div>
                    </form>
                  </section>
                ) : (
                  // Render active savings target details and metrics progress
                  <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />

                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest font-mono">Active Target Target</span>
                        <h3 className="font-display font-semibold text-[#EDEDED] text-base select-all">{savingsGoal.name}</h3>
                      </div>
                      
                      <button
                        onClick={handleDeleteGoal}
                        className="text-xs text-rose-500 hover:text-rose-400 font-mono font-semibold uppercase tracking-wider cursor-pointer"
                      >
                        Delete Goal
                      </button>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#707070]">Progress</span>
                        <span className="text-white font-bold">
                          {Math.min(100, Math.max(0, (savingsProgress / savingsGoal.targetAmount) * 100)).toFixed(1)}% Completed
                        </span>
                      </div>
                      
                      {/* Interactive Progress track */}
                      <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, (savingsProgress / savingsGoal.targetAmount) * 100))}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-[#555] font-mono leading-none pt-1">
                        <span>{CURRENCIES[currency].symbol}{toActiveCurrency(savingsProgress).toLocaleString("en-US", { maximumFractionDigits: 0 })} saved</span>
                        <span>Target: {CURRENCIES[currency].symbol}{toActiveCurrency(savingsGoal.targetAmount).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {/* Side-by-side Goal Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                        <span className="text-[9px] text-[#707070] uppercase font-bold block mb-1">Time Remaining</span>
                        <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                          {daysRemaining > 0 ? `${daysRemaining} Days` : "Timeline Reached!"}
                        </span>
                      </div>

                      <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                        <span className="text-[9px] text-[#707070] uppercase font-bold block mb-1">Savings Gap left</span>
                        <span className="text-xs sm:text-sm font-semibold font-mono text-[#EDEDED]">
                          {CURRENCIES[currency].symbol}{Math.max(0, toActiveCurrency(savingsGoal.targetAmount) - toActiveCurrency(savingsProgress)).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Calculated Daily Target Schedule parameters */}
                    <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-4 rounded-xl flex flex-col justify-center mb-6">
                      <span className="text-[10px] text-[#606060] uppercase font-bold tracking-wider block mb-1">
                        REQUIRED SCHEDULE SAVINGS
                      </span>
                      
                      {daysRemaining > 0 ? (
                        <>
                          <span className="text-base font-bold font-mono text-emerald-400">
                            {CURRENCIES[currency].symbol}{toActiveCurrency(requiredGoalSavingsDaily).toFixed(2)}
                            <span className="text-xs text-[#707070] font-normal"> / day</span>
                          </span>
                          <span className="text-[10px] text-[#555] font-mono mt-1.5 leading-normal">
                            Or roughly {CURRENCIES[currency].symbol}{toActiveCurrency(requiredGoalSavingsDaily * 30).toLocaleString("en-US", { maximumFractionDigits: 0 })} / month to reach by {savingsGoal.targetDate}.
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-mono text-amber-500">
                          Timeline milestone reached. Check details.
                        </span>
                      )}
                    </div>

                    {/* Integrated Warning Disclaimer if Behind or Out of Limits */}
                    {daysRemaining > 0 && requiredGoalSavingsDaily > (monthlyBudget / 30) ? (
                      <div className="p-3.5 bg-[#0C0600] border border-amber-900/35 text-amber-500 rounded-xl flex flex-col gap-1 text-[11px] font-mono line-height-relaxed select-text">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Savings Rate Warning</span>
                        </div>
                        <p>
                          Your target daily rate of {CURRENCIES[currency].symbol}{toActiveCurrency(requiredGoalSavingsDaily).toFixed(0)}/day slightly exceeds your default daily pocket fun boundaries ({CURRENCIES[currency].symbol}{toActiveCurrency(monthlyBudget / 30).toFixed(0)}/day), suggesting minor target risk. Minimize high-cost impulses!
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 text-emerald-400/90 rounded-xl flex items-center gap-2 text-[10px] font-mono">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>Savings trajectory is fully secure. Keeps boundaries stable!</span>
                      </div>
                    )}

                  </section>
                )}
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </main>

      {/* Styled high-end template footer adhering to Elegant Dark */}
      <footer id="footer" className="h-12 border-t border-[#1A1A1A] flex items-center px-4 sm:px-10 justify-between text-[10px] text-[#444] font-bold uppercase tracking-widest mt-auto bg-[#050505]">
        <div className="hidden sm:block">Financial health is a choice, not a circumstance.</div>
        <div className="block sm:hidden flex-1">Financial health is a choice.</div>
        <div className="flex gap-4 sm:gap-6 justify-end items-center">
          <span className="text-[#555] font-mono">Audit Log ({totalChecksCount})</span>
          <span className="text-[#555] font-mono">Profile Active</span>
          <button
            id="reset-full-instance-btn"
            onClick={() => {
              if (window.confirm("Restore factory calibrations (clear database + settings)?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-indigo-500 hover:text-indigo-400 uppercase tracking-widest transition-colors font-mono cursor-pointer outline-none"
          >
            Reset
          </button>
        </div>
      </footer>

    </div>
  );
}
