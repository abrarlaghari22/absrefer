import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AdminTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AdminTabsProps {
  tabs: AdminTab[];
  defaultTab?: string;
}

export function AdminTabs({ tabs, defaultTab }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="bg-white rounded-xl shadow-lg" data-testid="admin-tabs">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" data-testid="tab-navigation">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>
      <div className="p-6" data-testid="tab-content">
        {activeTabContent}
      </div>
    </div>
  );
}
