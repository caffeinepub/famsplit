import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { BottomNav, type TabId } from "./components/BottomNav";
import { SanaAssistant } from "./components/SanaAssistant";
import { Analytics } from "./pages/Analytics";
import { Budget } from "./pages/Budget";
import { Dashboard } from "./pages/Dashboard";
import { Expenses } from "./pages/Expenses";
import { Members } from "./pages/Members";
import { Settle } from "./pages/Settle";
import { Wallet } from "./pages/Wallet";
import { AppProvider } from "./store/AppContext";

function AppInner() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onTabChange={setActiveTab} />;
      case "expenses":
        return <Expenses />;
      case "members":
        return <Members />;
      case "budget":
        return <Budget />;
      case "analytics":
        return <Analytics />;
      case "wallet":
        return <Wallet />;
      case "settle":
        return <Settle />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh relative">
      <main className="pb-14 min-h-dvh overflow-y-auto">{renderTab()}</main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster richColors position="top-center" />
      <SanaAssistant />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
