"use client";
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import axios from "axios";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarInset
} from "@/components/ui/sidebar";

// Define types for graph data
interface Node {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  full_title?: string;
  content?: string;
}

interface Edge {
  source: string | Node;
  target: string | Node;
  relationship: string;
}

interface Article {
  Topic: string;
  Material: string;
  Supplier: string;
  Price_Impact: number;
  Timeline: string;
  Adjacent_Product: string;
  Article: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  articles: Article[];
}

const App: React.FC = () => {
  const graphRef = useRef<SVGSVGElement>(null);
  const nodeDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAndCreateGraph = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/graph");
        
        // Add more detailed error handling for empty response
        if (!response.data) {
          console.error("No data received from server");
          throw new Error("No data received from server");
        }

        // Check if response.data is an empty object
        if (Object.keys(response.data).length === 0) {
          console.error("Empty data object received from server");
          throw new Error("Empty data object received from server");
        }

        // Validate each required property exists and has data
        if (!response.data.nodes || !Array.isArray(response.data.nodes)) {
          console.error("Invalid or missing nodes data");
          throw new Error("Invalid or missing nodes data");
        }

        if (!response.data.edges || !Array.isArray(response.data.edges)) {
          console.error("Invalid or missing edges data");
          throw new Error("Invalid or missing edges data");
        }

        const data: GraphData = {
          nodes: response.data.nodes,
          edges: response.data.edges,
          articles: Array.isArray(response.data.articles) ? response.data.articles : []
        };

        if (data.nodes.length === 0 || data.edges.length === 0) {
          throw new Error("Graph data arrays are empty");
        }

        createGraph(data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
        // Display more detailed error message to user
        if (nodeDetailsRef.current) {
          nodeDetailsRef.current.innerHTML = `
            <div style="color: red; padding: 1em; border: 1px solid red; border-radius: 4px;">
              <h3>Error Loading Graph Data</h3>
              <p>Please check:</p>
              <ul>
                <li>The backend server is running at http://127.0.0.1:8000</li>
                <li>The server is returning valid graph data</li>
                <li>Your network connection is stable</li>
              </ul>
              <p>Technical details: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          `;
        }
      }
    };
  
    fetchAndCreateGraph();
  }, []);

  const createGraph = (data: GraphData) => {
    if (!graphRef.current) return;

    // Ensure articles array exists, default to empty array if not
    const articles = data.articles || [];

    // Clear any existing SVG content
    d3.select(graphRef.current).selectAll("*").remove();

    const width = window.innerWidth * 0.75;
    const height = window.innerHeight;

    const svg = d3.select(graphRef.current)
      .attr("width", width)
      .attr("height", height);

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Add edges
    const link = svg.append("g")
      .selectAll("line")
      .data(data.edges)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "#888")
      .style("stroke-width", 2);

    // Add nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 10)
      .style("cursor", "pointer")
      .style("fill", (d: Node) => {
        if (d.type === "Material") return "skyblue";
        if (d.type === "Supplier") return "lightgreen";
        if (d.type === "Article") return "orange";
        return "gray";
      })
      .call(drag(simulation) as any);

    // Add labels
    const label = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .text((d: Node) => d.label)
      .attr("x", 12)
      .attr("y", 4);

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x + 12)
        .attr("y", (d: any) => d.y + 4);
    });

    // Handle node clicks
    node.on("click", (event: any, d: Node) => {
      if (nodeDetailsRef.current) {
        if (d.type === "Article") {
          // Display article content
          nodeDetailsRef.current.innerHTML = `
            <div style="max-height: 90vh; overflow-y: auto;">
              <h3>${d.full_title}</h3>
              <p>${d.content}</p>
            </div>
          `;
        } else {
          // Find relevant articles for this node
          const relevantArticles = articles.filter(article => 
            article.Material === d.id || 
            article.Supplier === d.id || 
            article.Adjacent_Product === d.id
          );

          let articlesHtml = '';
          if (relevantArticles.length > 0) {
            articlesHtml = `
              <h3>Related Articles</h3>
              ${relevantArticles.map(article => `
                <div style="margin-top: 1em; padding: 1em; border: 1px solid #eee; border-radius: 4px;">
                  <h4>${article.Topic}</h4>
                  <p><strong>Price Impact:</strong> ${article.Price_Impact}%</p>
                  <p><strong>Timeline:</strong> ${article.Timeline}</p>
                  <p><strong>Analysis:</strong> ${article.Article}</p>
                </div>
              `).join('')}
            `;
          }

          nodeDetailsRef.current.innerHTML = `
            <div style="max-height: 90vh; overflow-y: auto;">
              <h3>Node Details</h3>
              <p><strong>ID:</strong> ${d.id}</p>
              <p><strong>Label:</strong> ${d.label}</p>
              <p><strong>Type:</strong> ${d.type}</p>
              ${articlesHtml}
            </div>
          `;
        }
      }
    });
  };

  // Drag functionality
  const drag = (simulation: d3.Simulation<Node, undefined>) => {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <h2 className="px-4 text-lg font-semibold">Node Details</h2>
          </SidebarHeader>
          <SidebarContent>
            <div ref={nodeDetailsRef} className="p-4">
              <p>Click on a node to see details and related articles.</p>
            </div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="h-full w-full">
            <svg ref={graphRef} className="h-full w-full" />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default App;