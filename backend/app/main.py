from http.client import HTTPException
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
from openai import AsyncOpenAI
import asyncio
from dotenv import load_dotenv
import os

# Load env file
load_dotenv()

# Initialize the AsyncOpenAI client
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY")
)

MODEL = "llama-3.1-70b-versatile"

app = FastAPI()

async def analyze_situation(data_entry):
    # Format the insights and contract info into a prompt
    insights_text = "\n".join([f"- {insight}" for insight in data_entry["insights"]])
    
    prompt = f"""
    Project Context:
    Project LLaMA is implementing a low-carbon grid adaptation leveraging renewable energy and storage solutions for regional energy transformation. Material supply chain reliability is critical for project success.
    
    Material: {data_entry["material"]}
    Usage: {data_entry["usage"]}
    Current Supplier: {data_entry["supplier"]}
    
    Recent Market Insights:
    {insights_text}
    
    Contract Terms Summary:
    - Price volatility threshold: 15% change triggers renegotiation
    - Force majeure includes supply disruptions causing 10%+ reduction in production
    - Contract can be terminated if price negotiations fail after 60 days
    
    Alternative Material Available:
    - Material: {data_entry["alternate_materials"][0]["material"]}
    - Supplier: {data_entry["alternate_materials"][0]["supplier"]}
    
    Based on these insights and contract terms, analyze:
    1. Do current market conditions meet the contract thresholds for renegotiation or force majeure?
    2. What are the key risks and impacts to our supply chain and Project LLaMA's renewable energy goals?
    3. What are our contractual options and their implications for maintaining reliable material supply for the project?
    
    Core objective is always to protect the project from unexpected cost rises or delays and you are acting with that goal in mind.

    Provide your analysis in a clear, structured format focusing just on the current situation and its impact on Project LLaMA's objectives.
    """

    analysis_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system", 
                "content": "You are an expert supply chain analyst specializing in renewable energy projects. Analyze the situation objectively and identify key issues and contractual implications that could impact low-carbon grid implementation."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model=MODEL,
        temperature=0.4,
        max_tokens=1000
    )

    return analysis_completion.choices[0].message.content

async def draft_supplier_email(data_entry, analysis):
    prompt = f"""
    Project Context:
    You are drafting an email to our current supplier based on our analysis of the situation.

    Supplier Contact:
    Name: {data_entry["supplier_contact"]["name"]}
    Position: {data_entry["supplier_contact"]["position"]}
    Email: {data_entry["supplier_contact"]["email"]}
    Company: {data_entry["supplier"]}

    Material: {data_entry["material"]} 
    Current Usage: {data_entry["usage"]}
    
    Analysis of Situation:
    {analysis}

    Draft a professional business email to the supplier that:
    1. References our existing supply agreement
    2. Highlights specific market conditions and challenges identified in the analysis
    3. Clearly states our requested action (e.g. contract renegotiation, addressing supply issues)
    4. Maintains a constructive, partnership-focused tone
    5. Proposes next steps or a timeline for discussion

    Format the email with appropriate subject line, greeting, body and signature.
    Sign the email as:
    Douglas Adams
    Sourcing Director, Project LLaMA
    Date: November 17, 2024
    """

    email_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a professional procurement manager responsible for supplier relationships. Draft clear, diplomatic business communications that protect the company's interests while maintaining positive supplier relationships."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ],
        model=MODEL,
        temperature=0.4,
        max_tokens=1000
    )

    return email_completion.choices[0].message.content

async def draft_alternate_supplier_email(data_entry, alternative_analysis):
    alt_material_data = data_entry["alternate_materials"][0]
    
    prompt = f"""
    Project Context:
    You are drafting an initial email to a potential alternative supplier based on our analysis of market conditions and materials.

    Supplier Contact:
    Name: {alt_material_data["supplier_contact"]["name"]}
    Position: {alt_material_data["supplier_contact"]["position"]} 
    Email: {alt_material_data["supplier_contact"]["email"]}
    Company: {alt_material_data["supplier"]}

    Material of Interest: {alt_material_data["material"]}
    Current Material Being Replaced: {data_entry["material"]}
    Estimated Usage Requirements: {data_entry["usage"]}
    
    Analysis of Alternative Material Option:
    {alternative_analysis}

    Draft a professional business email to the potential supplier that:
    1. Introduces Project LLaMA and our organization's focus on renewable energy and low-carbon grid solutions
    2. Expresses interest in their {alt_material_data["material"]} supply capabilities
    3. Briefly outlines our material requirements and timeline considerations
    4. Requests an initial discussion about potential supply partnership
    5. Maintains a professional but exploratory tone
    6. Proposes specific next steps (e.g. virtual meeting, RFI process)

    Format the email with appropriate subject line, greeting, body and signature.
    Keep the tone professional but avoid sharing sensitive details about our current supply situation.
    Sign the email as:
    Douglas Adams
    Sourcing Director, Project LLaMA
    Date: November 17, 2024
    """

    email_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a strategic sourcing manager exploring new supplier relationships. Draft professional business communications that generate supplier interest while maintaining appropriate confidentiality and negotiating leverage."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ],
        model=MODEL,
        temperature=0.4,
        max_tokens=1000
    )

    return email_completion.choices[0].message.content



async def analyze_alternative(data_entry, current_analysis):
    # Extract insights for both materials
    primary_insights_text = "\n".join([f"- {insight}" for insight in data_entry["insights"]])
    alt_material_data = data_entry["alternate_materials"][0]
    alt_insights_text = "\n".join([f"- {insight}" for insight in alt_material_data["insights"]])
    
    prompt = f"""
    Project Context:
    Project LLaMA is evaluating alternative materials to mitigate supply chain risks while maintaining its low-carbon grid adaptation goals.
    
    Current Situation Analysis:
    {current_analysis}
    
    Primary Material Analysis:
    - Material: {data_entry["material"]}
    - Current Usage: {data_entry["usage"]}
    - Current Supplier: {data_entry["supplier"]}
    
    Recent Market Insights for {data_entry["material"]}:
    {primary_insights_text}
    
    Alternative Material Analysis:
    - Material: {alt_material_data["material"]}
    - Potential Supplier: {alt_material_data["supplier"]}
    
    Recent Market Insights for {alt_material_data["material"]}:
    {alt_insights_text}
    
    Given the current situation analysis and market insights for both materials:
    1. What are the compelling reasons to consider switching from {data_entry["material"]} to {alt_material_data["material"]}?
    2. How does the alternative material's market stability compare to the current material?
    3. What are the key advantages and risks of switching to this alternative?
    4. What is the feasibility of establishing a supply relationship with {alt_material_data["supplier"]}?
    5. How would switching to this alternative impact Project LLaMA's:
       - Supply chain resilience
       - Cost structure
       - Sustainability goals
       - Technical performance
    
    Provide your analysis in a clear, structured format with specific recommendations on whether Project LLaMA should consider switching materials.
    """

    alternative_analysis = await client.chat.completions.create(
        messages=[
            {
                "role": "system", 
                "content": "You are an expert materials analyst specializing in renewable energy projects. Compare materials objectively, considering market conditions, technical requirements, and commercial implications for low-carbon grid implementation. Focus on providing actionable recommendations."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model=MODEL,
        temperature=0.4,
        max_tokens=1000
    )

    return alternative_analysis.choices[0].message.content

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def load_data():
    # Replace CSV reading with JSON reading
    with open("generated_data.json") as f:
        insights = pd.DataFrame(json.load(f))
    with open("generated_articles.json") as f:
        articles = pd.DataFrame(json.load(f))
    return insights, articles

def create_graph_data(insights, articles):
    nodes = []
    edges = []
    seen_nodes = set()

    for _, row in insights.iterrows():
        # Add nodes if not already added
        if row['Material'] not in seen_nodes:
            nodes.append({
                "id": row['Material'],
                "label": row['Material'],
                "type": "Material"
            })
            seen_nodes.add(row['Material'])

        if row['Supplier'] not in seen_nodes:
            nodes.append({
                "id": row['Supplier'],
                "label": row['Supplier'],
                "type": "Supplier"
            })
            seen_nodes.add(row['Supplier'])

        if row['Adjacent Product'] not in seen_nodes:
            nodes.append({
                "id": row['Adjacent Product'],
                "label": row['Adjacent Product'],
                "type": "Material"
            })
            seen_nodes.add(row['Adjacent Product'])

        # Add edges
        edges.append({
            "source": row['Material'],
            "target": row['Supplier'],
            "relationship": "supplied_by"
        })
        edges.append({
            "source": row['Material'],
            "target": row['Adjacent Product'],
            "relationship": "alternative_to"
        })

    # Add article nodes and connect them to relevant materials
    for idx, article in articles.iterrows():
        article_id = f"article_{idx}"
        # Use the Topic field as the title
        title = article['Topic']
        content = article['Article']
        
        nodes.append({
            "id": article_id,
            "label": title[:30] + "..." if len(title) > 30 else title,
            "type": "Article",
            "full_title": title,
            "content": content
        })
        
        # Connect article to its related material, supplier and adjacent product
        material = article['Material']
        supplier = article['Supplier']
        adjacent = article['Adjacent_Product']
        
        if material in seen_nodes:
            edges.append({
                "source": article_id,
                "target": material,
                "relationship": "discusses"
            })
        if supplier in seen_nodes:
            edges.append({
                "source": article_id,
                "target": supplier,
                "relationship": "discusses"
            })
        if adjacent in seen_nodes:
            edges.append({
                "source": article_id,
                "target": adjacent,
                "relationship": "discusses"
            })

    return {"nodes": nodes, "edges": edges, "articles": articles.to_dict('records')}

@app.get("/analyse")
async def analyse_material(material: str):
    # Load the generated data
    with open("generated_data.json", "r") as f:
        data = json.load(f)
    
    # Find the entry for the requested material
    material_entry = next((entry for entry in data if entry["material"] == material), None)
    
    if not material_entry:
        raise HTTPException(status_code=404, detail=f"Material {material} not found")

    # Get situation analysis
    analysis = await analyze_situation(material_entry)
    
    # Get alternative materials analysis
    alt_analysis = await analyze_alternative(material_entry, analysis)

    print('analysis', analysis)
    print('alt analysis',alt_analysis)

    # Generate a concise recommendation summary
    recommendation_prompt = f"""
    Based on the following analyses:
    
    Situation Analysis:
    {analysis}
    
    Alternative Analysis:
    {alt_analysis}
    
    Provide a concise 50-word actionable recommendation on what steps should be taken regarding this material and potential alternatives.
    """

    recommendation = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a materials procurement expert. Provide clear, actionable recommendations in 50 words or less."
            },
            {
                "role": "user", 
                "content": recommendation_prompt
            }
        ],
        model=MODEL,
        temperature=0.3,
        max_tokens=100
    )

    summary = recommendation.choices[0].message.content
    print('summary:', summary)
    
    return {
        "material": material,
        "situation_analysis": analysis,
        "alternative_analysis": alt_analysis,
        "summary": summary
    }


@app.post("/take_action")
async def take_action(data: dict):
    # Extract data from request
    situation_analysis = data.get("situation_analysis")
    alternative_analysis = data.get("alternative_analysis")
    summary = data.get("summary")

    # Load supplier data
    insights, _ = load_data()
    
    # Get relevant supplier contacts
    material_entry = insights[insights["material"] == data["material"]].iloc[0]

    # Generate emails using helper functions
    current_supplier_email = await draft_supplier_email(material_entry, situation_analysis)
    alternative_supplier_email = await draft_alternate_supplier_email(material_entry, alternative_analysis)

    action_summary_prompt = f"""
    Based on the following actions taken:
    - Email drafted to current supplier ({material_entry["supplier_contact"]["name"]}) about supply chain optimization
    - Email drafted to alternative supplier ({material_entry["alternate_materials"][0]["supplier_contact"]["name"]}) about {material_entry["alternate_materials"][0]["material"]} supply
    
    Provide a concise action summary that:
    1. Lists the key actions initiated
    2. Outlines clear next steps
    3. Maintains a professional project management tone
    
    Do not include any placeholders in your answer, this is very important
    """

    action_summary_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a project manager summarizing action items and next steps. Be clear, concise and actionable."
            },
            {
                "role": "user",
                "content": action_summary_prompt
            }
        ],
        model=MODEL,
        temperature=0.3,
        max_tokens=300
    )

    action_summary = action_summary_completion.choices[0].message.content

    return {
        "current_supplier_email": current_supplier_email,
        "alternative_supplier_email": alternative_supplier_email,
        "action_summary": action_summary
    }


@app.get("/graph")
async def get_graph():
    insights, articles = load_data()
    graph_data = create_graph_data(insights.head(10), articles)
    return graph_data

@app.get("/insights")
async def get_insights():
    insights, _ = load_data()
    return insights.to_dict('records')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
