"use client";

import { AppSidebar } from "@/components/left-sidebar";
import { DataSelector } from "@/components/data-selector";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Loader2 } from "lucide-react";

interface SupplierContact {
  name: string;
  email: string;
  position: string;
}

interface AlternateMaterial {
  material: string;
  supplier: string;
  supplier_contact: SupplierContact;
  insights: string[];
}

interface InsightData {
  id: number;
  material: string;
  usage: string;
  supplier: string;
  supplier_contact: SupplierContact;
  insights: string[];
  article: string;
  contract_clauses: string;
  alternate_materials: AlternateMaterial[];
}

interface AnalysisData {
  material: string;
  situation_analysis: string;
  alternative_analysis: string;
  summary: string;
}

interface ActionOutput {
  current_supplier_email: string;
  alternative_supplier_email: string;
  action_summary: string;
}

export default function Home() {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [allInsights, setAllInsights] = useState<InsightData[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [isTakingAction, setIsTakingAction] = useState(false);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const [editableSummary, setEditableSummary] = useState<string>("");
  const [actionOutput, setActionOutput] = useState<ActionOutput | null>(null);
  const [openSections, setOpenSections] = useState({
    insights: false,
    article: false,
    contractClauses: false,
    alternativeMaterials: false,
    situationAnalysis: false,
    alternativeAnalysis: false,
    actionOutput: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/insights');
        const data = await response.json();
        
        // Group insights by material
        const groupedInsights = data.reduce((acc: { [key: string]: InsightData }, curr: InsightData) => {
          if (!acc[curr.material]) {
            acc[curr.material] = { ...curr };
          } else {
            // Concatenate insights arrays
            acc[curr.material].insights = [...acc[curr.material].insights, ...curr.insights];
            // Concatenate articles with a separator
            acc[curr.material].article = acc[curr.material].article + "\n\n" + curr.article;
            // Merge alternate materials
            acc[curr.material].alternate_materials = [
              ...acc[curr.material].alternate_materials,
              ...curr.alternate_materials
            ];
          }
          return acc;
        }, {});

        const consolidatedData = Object.values(groupedInsights) as InsightData[];
        setAllInsights(consolidatedData);
        setInsights(consolidatedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const materialOptions = Array.from(new Set(allInsights.map(item => item.material)))
    .map(material => ({
      value: material,
      label: material
    }));

  const handleMaterialChange = (value: string) => {
    setSelectedMaterial(value);
    if (value === "all") {
      setInsights(allInsights);
    } else {
      const filtered = allInsights.filter(insight => insight.material === value);
      setInsights(filtered);
    }
  };

  const handleRowClick = (insight: InsightData) => {
    setSelectedInsight(insight);
  };

  const handleAnalyse = async (material: string) => {
    setIsAnalyzing(material);
    
    // First notification
    setNotification({
      title: "🔄 Analysis Started",
      message: `Initiating comprehensive analysis for ${material}...`
    });

    // Second notification after 2 seconds
    setTimeout(() => {
      setNotification({
        title: "⚠️ Risk Assessment",
        message: `Critical supply chain vulnerability detected for ${material}. Evaluating alternative solutions...`
      });
    }, 2000);

    try {
      const response = await fetch(`http://localhost:8000/analyse?material=${material}`);
      const data = await response.json();
      setAnalysisData(data);
      setEditableSummary(data.summary);
      setShowAnalysisModal(true);
      setActionOutput(null); // Reset action output when starting new analysis
    } catch (error) {
      console.error('Error analyzing material:', error);
      setNotification({
        title: "❌ Analysis Error",
        message: "Unable to complete analysis. Please try again."
      });
    } finally {
      setIsAnalyzing(null);
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleTakeAction = async () => {
    if (!analysisData) return;
    
    setIsTakingAction(true);
    setNotification({
      title: "🔄 Taking Action",
      message: "Processing recommended actions..."
    });

    try {
      const response = await fetch('http://localhost:8000/take_action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material: analysisData.material,
          situation_analysis: analysisData.situation_analysis,
          alternative_analysis: analysisData.alternative_analysis,
          summary: editableSummary
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to take action');
      }

      const actionData = await response.json();
      setActionOutput(actionData);
      setOpenSections(prev => ({...prev, actionOutput: true}));

      setNotification({
        title: "✅ Action Complete",
        message: "Actions have been processed successfully"
      });
    } catch (error) {
      console.error('Error taking action:', error);
      setNotification({
        title: "❌ Error",
        message: "Failed to take action"
      });
    } finally {
      setIsTakingAction(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-32"></div> {/* Spacer div */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">
          Project LLaMA: Low-carbon Lifecycle and Microgrid Adaption
        </h1>

        <h2 className="text-2xl py-6 px-8 bg-gray-100 rounded-lg mb-8 inline-block">Welcome back, Douglas! I have identified some high priority items for your review</h2>
        
        {/* Larger Notification Popup */}
        {notification && (
          <div className="fixed top-4 right-4 bg-blue-50 border-2 border-blue-200 shadow-lg rounded-lg p-6 z-50 min-w-[300px] animate-fade-in">
            <h3 className="text-xl font-bold mb-2 text-blue-900">{notification.title}</h3>
            <p className="text-lg text-blue-800">{notification.message}</p>
          </div>
        )}

        <div className="mb-6">
          <DataSelector 
            options={[{ value: "all", label: "All Materials" }, ...materialOptions]} 
            onChange={handleMaterialChange}
            value={selectedMaterial || "all"}
          />
        </div>

        {/* Analysis Modal */}
        {showAnalysisModal && analysisData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-[90vw] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Analysis for {analysisData.material}</h2>
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Summary Box */}
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Key Recommendations</h3>
                <textarea
                  value={editableSummary}
                  onChange={(e) => setEditableSummary(e.target.value)}
                  className="w-full p-2 rounded border min-h-[100px] bg-white"
                />
              </div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={handleTakeAction}
                  disabled={isTakingAction}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded flex items-center gap-2"
                >
                  {isTakingAction ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing Actions...
                    </>
                  ) : (
                    'Take Recommended Action'
                  )}
                </button>
              </div>

              {actionOutput && (
                <div className="mb-6">
                  <button 
                    onClick={() => toggleSection('actionOutput')}
                    className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                  >
                    <span>Action Output</span>
                    <span>{openSections.actionOutput ? '▼' : '▶'}</span>
                  </button>
                  {openSections.actionOutput && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Current Supplier Email:</h4>
                      <div className="bg-white p-3 rounded mb-4">
                        <ReactMarkdown>{actionOutput.current_supplier_email}</ReactMarkdown>
                      </div>
                      
                      <h4 className="font-semibold mb-2">Alternative Supplier Email:</h4>
                      <div className="bg-white p-3 rounded mb-4">
                        <ReactMarkdown>{actionOutput.alternative_supplier_email}</ReactMarkdown>
                      </div>
                      
                      <h4 className="font-semibold mb-2">Action Summary:</h4>
                      <div className="bg-white p-3 rounded">
                        <ReactMarkdown>{actionOutput.action_summary}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-6">
                <button 
                  onClick={() => toggleSection('situationAnalysis')}
                  className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                >
                  <span>Situation Analysis</span>
                  <span>{openSections.situationAnalysis ? '▼' : '▶'}</span>
                </button>
                {openSections.situationAnalysis && (
                  <div className="prose max-w-none">
                    <ReactMarkdown>{analysisData.situation_analysis}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <button 
                  onClick={() => toggleSection('alternativeAnalysis')}
                  className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                >
                  <span>Alternative Analysis</span>
                  <span>{openSections.alternativeAnalysis ? '▼' : '▶'}</span>
                </button>
                {openSections.alternativeAnalysis && (
                  <div className="prose max-w-none">
                    <ReactMarkdown>{analysisData.alternative_analysis}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

<div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Main Action Items Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {insights.map((insight) => (
                    <tr 
                      key={insight.id} 
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(insight)}>{insight.material}</td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => handleRowClick(insight)}>{insight.usage}</td>
                      <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(insight)}>{insight.supplier}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleAnalyse(insight.material)}
                          disabled={isAnalyzing === insight.material}
                          className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                        >
                          {isAnalyzing === insight.material ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            'Generate Recommendations'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Details Panel */}
            {selectedInsight && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">{selectedInsight.material} Details</h2>
                
                <div className="mb-6">
                  <button 
                    onClick={() => toggleSection('insights')}
                    className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                  >
                    <span>Recent Insights</span>
                    <span>{openSections.insights ? '▼' : '▶'}</span>
                  </button>
                  {openSections.insights && (
                    <ul className="list-disc pl-5 space-y-2">
                      {selectedInsight.insights.map((insight, index) => (
                        <li key={index} className="text-gray-700 prose max-w-none">
                          <ReactMarkdown>{insight}</ReactMarkdown>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mb-6">
                  <button 
                    onClick={() => toggleSection('article')}
                    className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                  >
                    <span>Article</span>
                    <span>{openSections.article ? '▼' : '▶'}</span>
                  </button>
                  {openSections.article && (
                    <div className="text-gray-700 prose max-w-none">
                      <ReactMarkdown>{selectedInsight.article}</ReactMarkdown>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <button 
                    onClick={() => toggleSection('contractClauses')}
                    className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                  >
                    <span>Contract Clauses</span>
                    <span>{openSections.contractClauses ? '▼' : '▶'}</span>
                  </button>
                  {openSections.contractClauses && (
                    <div className="text-gray-700 prose max-w-none">
                      <ReactMarkdown>{selectedInsight.contract_clauses}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {selectedInsight.alternate_materials.length > 0 && (
                  <div>
                    <button 
                      onClick={() => toggleSection('alternativeMaterials')}
                      className="flex items-center justify-between w-full text-lg font-semibold mb-2"
                    >
                      <span>Alternative Materials</span>
                      <span>{openSections.alternativeMaterials ? '▼' : '▶'}</span>
                    </button>
                    {openSections.alternativeMaterials && (
                      selectedInsight.alternate_materials.map((alt, index) => (
                        <div key={index} className="mb-4">
                          <h4 className="font-medium">{alt.material}</h4>
                          <p className="text-sm text-gray-600">Supplier: {alt.supplier}</p>
                          <p className="text-sm text-gray-600">Contact: {alt.supplier_contact.name}</p>
                          <ul className="list-disc pl-5 mt-2">
                            {alt.insights.map((insight, i) => (
                              <li key={i} className="text-sm text-gray-700 prose max-w-none">
                                <ReactMarkdown>{insight}</ReactMarkdown>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No Action Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h3 className="px-6 py-4 text-lg font-semibold text-gray-700 bg-gray-50">Materials Requiring No Action</h3>
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { material: "Silicon Wafers", usage: "Solar Cell Production", supplier: "SiliconTech", status: "Supply Chain Stable" },
                    { material: "Silver Paste", usage: "Cell Metallization", supplier: "MetalChem Inc", status: "Inventory Sufficient" },
                    { material: "EVA Film", usage: "Panel Encapsulation", supplier: "PolymerTech Ltd", status: "Long-term Contract" },
                  ].map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{item.material}</td>
                      <td className="px-6 py-4">{item.usage}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}