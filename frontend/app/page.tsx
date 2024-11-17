"use client";

import { AppSidebar } from "@/components/left-sidebar";
import { DataSelector } from "@/components/data-selector";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';

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

export default function Home() {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [allInsights, setAllInsights] = useState<InsightData[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(null);
  const [openSections, setOpenSections] = useState({
    insights: false,
    article: false,
    contractClauses: false,
    alternativeMaterials: false
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
    try {
      const response = await fetch(`http://localhost:8000/analyse?material=${material}`);
      const data = await response.json();
      console.log(data); // Handle the response as needed
    } catch (error) {
      console.error('Error analyzing material:', error);
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
        
        <div className="mb-6">
          <DataSelector 
            options={[{ value: "all", label: "All Materials" }, ...materialOptions]} 
            onChange={handleMaterialChange}
            value={selectedMaterial || "all"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  {/* <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th> */}
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
                    {/* <td className="px-6 py-4 cursor-pointer" onClick={() => handleRowClick(insight)}>
                      <div>
                        <div className="font-medium">{insight.supplier_contact.name}</div>
                        <div className="text-sm text-gray-500">{insight.supplier_contact.position}</div>
                        <div className="text-sm text-gray-500">{insight.supplier_contact.email}</div>
                      </div>
                    </td> */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleAnalyse(insight.material)}
                        className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Generate Recommendations
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
                      <li key={index} className="text-gray-700">
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
                  <div className="text-gray-700 prose">
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
                  <div className="text-gray-700 prose">
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
                            <li key={i} className="text-sm text-gray-700">
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
        </div>
      </main>
    </div>
  );
}