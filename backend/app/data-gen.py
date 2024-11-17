"""
Main data generation script
---

Need to generate two .json files, one is a project table composed of:
- id: (str) the unique ID of this insight
- project ID: (str) the unique ID of the project, in this case we will only have one project
- project name: (str) the project name, in this case we will only have one project
- material: (str) the material that this insight is about 
    - rare earth elements --> neodymium, dysprosium, replaced with e.g., ferrite materials if cost too high
    - cobalt for battery cathodes --> replace iwth nickel-rich cathodes or iron-phosphate batteries
    - copper / aluminium 
    - ...
- usage
- alternate materials: List[str] alternate materials for this project 
- insight: (str) an insight on something that has changed with this material 
- article: (str) an article from which the insight was extracted
- (with the insight) - basically to be used as a ref 
- contract terms
- supplier 
- significant change (yes/no)

"""

ID = 'ajcivirh'
PROJECT_NAME = 'Project LLaMA: Low-carbon Lifecycle and Microgrid Adaption'
materials={
    "Copper": "Used extensively for electrical wiring in Project LLaMA's microgrids particularly in electrical transformers and energy generation systems",
    "Cobalt": "Critical for the cathodes in the large battery backend system being developed as part of Project LLaMAs",
    "Dysprosium": "The permanent magnets within Project LLaMA's wind turbines are heavily dependent on the Dy supplement to Neodymium"
}

alternatives = {
    "Copper": "Aluminium",
    "Cobalt": "Nickel",
    "Dysprosium": "Low-Dysprosium magnets"
}

# insight is LLM generated
# article is LLM generated from a group of insights
# contract terms is LLM generated

suppliers = {
    "Copper": "Aurora Conductors Ltd.",
    "Aluminium": "AlumaTech Solutions",
    "Cobalt": "Bluecore Mining Co",
    "Nickel": "Nickel Nexus Resources",
    "Dysprosium": "RareEarth Dynamics",
    "Low-Dysprosium magnets": "EcoMagnetics Inc."
}

supplier_contact_name = {
    "Aurora Conductors Ltd.": "Jane Smith",
    "AlumaTech Solutions": "John Doe",
    "Bluecore Mining Co": "Michael Brown",
    "Nickel Nexus Resources": "Sarah Johnson",
    "RareEarth Dynamics": "Emily Davis",
    "EcoMagnetics Inc.": "Daniel Wilson"
}

supplier_contact_email = {
    "Aurora Conductors Ltd.": "jane.smith@auroraconductors.com",
    "AlumaTech Solutions": "john.doe@alumatech.com",
    "Bluecore Mining Co": "michael.brown@bluecoremining.com",
    "Nickel Nexus Resources": "sarah.johnson@nickelnexus.com",
    "RareEarth Dynamics": "emily.davis@rareearthdyn.com",
    "EcoMagnetics Inc.": "daniel.wilson@ecomagnetics.com"
}

supplier_contact_position = {
    "Aurora Conductors Ltd.": "Sales Manager",
    "AlumaTech Solutions": "Account Executive",
    "Bluecore Mining Co": "Business Development Manager",
    "Nickel Nexus Resources": "Procurement Specialist",
    "RareEarth Dynamics": "Operations Manager",
    "EcoMagnetics Inc.": "Technical Advisor"
}


# first generate 3 insights per material
# then combine 3 insights per material into one stack and make an article
# also we will generate contract terms based on (a) price constraints e.g., this contract is valid when the price of copper is below xyz and can be revoked after xyz months

import json
import os 
import random
import pandas as pd 
from dotenv import load_dotenv
from openai import AsyncOpenAI
import asyncio
# import networx as nx 

# Load env file
load_dotenv()
# Initialize the AsyncOpenAI client
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY")
)

MODEL = "llama-3.1-8b-instant"

async def generate_insight(material, num_records=18):
    insights = []
    for _ in range(num_records):
        # Get previously generated insights to maintain consistency
        prev_insights = ""
        if len(insights) > 0:
            prev_insights = "\n".join(insights)
            context = f"Previously generated insights about {material}:\n{prev_insights}\n\nGenerate a new insight that aligns with these previous insights while adding new information."
        else:
            context = f"Generate the first insight about {material}."

        insight_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert analyst specialising in sustainable energy supply chains and material alternatives."},
                {
                    "role": "user", "content": f"""
                    {context}

                    Create a short insight (no more than 1-2 sentences) that could describe a recent event in geopolitics or weather or anything really that could impact the price or production of {material}. This can be the kind of thing you might extract from an earnings call or a news article or something like this, ideally includes some sort of data point or conclusion about what has happened and how it could impact this material. Do not cite a source."""
                }
            ],
            model=MODEL,
            temperature=0.5
        )

        insight = insight_completion.choices[0].message.content
        # print(insight)
        insights.append(insight)
    return insights

# now function to take 3 insights on a material and combine them into an article
    
async def generate_article_from_insights(material, insights):
    # Process insights in batches of 3 and generate an article for each batch
    articles = []
    for i in range(0, len(insights), 3):
        batch = insights[i:i+3]
        
        # Format the batch of insights into a coherent prompt
        insights_text = "\n".join([f"- {insight}" for insight in batch])
        prompt = f"""
                Material: {material}
                Usage: {materials[material]}
                Alternative Material: {alternatives.get(material, 'No direct alternative')}
                Key Supplier: {suppliers.get(material, 'Unknown supplier')}

                Recent insights:
                {insights_text}

                Based on these insights about {material}, write a detailed 500-word analytical article that:
                1. Synthesizes the insights into a coherent narrative
                2. Analyzes the potential impact on supply chains and pricing
                3. Discusses possible mitigation strategies, including the use of alternative materials
                4. Considers the broader implications for sustainable energy projects

                The article should be written in a professional tone suitable for industry analysts and decision-makers. Do not return any fluff, just the contract."""

        # Generate the article using the LLM
        article_completion = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert analyst specializing in sustainable energy supply chains and material markets. Write detailed, well-structured articles that provide valuable insights for industry professionals."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=MODEL,
            temperature=0.5,
            max_tokens=1500
        )

        article = article_completion.choices[0].message.content
        # print(f"Generatd article {len(articles) + 1} for {material}")
        articles.append(article)
        
    return articles

async def generate_contract_clauses(material, insights):
    # Format all insights into a prompt for contract generation
    insights_text = "\n".join([f"- {insight}" for insight in insights])
    prompt = f"""
            Material: {material}
            Usage: {materials[material]}
            Key Supplier: {suppliers.get(material, 'Unknown supplier')}

            Recent market insights:
            {insights_text}

            Based on these market insights about {material}, generate 3-4 key contract clauses that:
            1. Address price volatility and establish thresholds for contract renegotiation
            2. Define force majeure conditions specific to this material's supply chain
            3. Include provisions for sustainability and environmental compliance

            You should be specifc about numbers in this. Never say something like 'price [X]'.

            Write these in formal legal language suitable for a supply contract."""

    # Generate the contract clauses using the LLM
    contract_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are an expert legal counsel specializing in supply chain contracts and procurement agreements. Generate precise, well-structured contract clauses that protect both parties while addressing specific material supply risks."
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

    contract_clauses = contract_completion.choices[0].message.content
    # print(f"Generated contract clauses for {material}")
    return contract_clauses

async def generate_alternate_insights(material, num_records=6):
    insights = []
    for _ in range(num_records):
        # Get previously generated insights to maintain consistency
        prev_insights = ""
        if len(insights) > 0:
            prev_insights = "\n".join(insights)
            context = f"Previously generated insights about {material}:\n{prev_insights}\n\nGenerate a new insight that aligns with these previous insights while adding new information."
        else:
            context = f"Generate the first insight about {material}."

        insight_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert analyst specialising in sustainable energy supply chains and material alternatives. Focus on positive market developments and stability."},
                {
                    "role": "user", "content": f"""
                    {context}

                    Create a short insight (no more than 1-2 sentences) that describes a recent positive development or stability indicator for {material}. This should highlight price stability, increased production capacity, or technological improvements that make the material more cost-effective. Include specific data points where possible but do not cite sources."""
                }
            ],
            model=MODEL,
            temperature=0.7,
            max_tokens=150
        )

        insight = insight_completion.choices[0].message.content.strip()
        insights.append(insight)
        
    return insights



    
async def main():
    if os.path.exists("generated_data.json"):
        print("Generated data already exists in 'generated_data.json'. Skipping regeneration.")
        return

    all_data = []
    entry_id = 0
    for material in materials:
        print(f"\nGenerating insights for {material}")
        insights = await generate_insight(material, num_records=6)
        
        print(f"\nGenerating articles for {material}")
        articles = await generate_article_from_insights(material, insights)
        
        print(f"\nGenerating contract clauses for {material}")
        contract_clauses = await generate_contract_clauses(material, insights)
        
        # Get the specific alternative material for this material from alternatives dict
        alt_material = alternatives.get(material)
        if alt_material:
            print(f"\nGenerating insights for alternative material: {alt_material}")
            alt_insights = await generate_alternate_insights(alt_material, num_records=6)
            alternate_materials = [{
                "material": alt_material,
                "supplier": suppliers.get(alt_material, "Unknown supplier"),
                "supplier_contact": {
                    "name": supplier_contact_name.get(suppliers.get(alt_material, "Unknown supplier"), "Unknown"),
                    "email": supplier_contact_email.get(suppliers.get(alt_material, "Unknown supplier"), "Unknown"),
                    "position": supplier_contact_position.get(suppliers.get(alt_material, "Unknown supplier"), "Unknown")
                },
                "insights": alt_insights
            }]
        else:
            alternate_materials = []

        # Create separate entries for each article with its corresponding insights
        for i in range(0, len(articles)):
            article_insights = insights[i*3:(i+1)*3]  # Get the 3 insights used for this article
            
            data_entry = {
                "id": entry_id,
                "material": material,
                "usage": materials[material],
                "supplier": suppliers.get(material, "Unknown supplier"),
                "supplier_contact": {
                    "name": supplier_contact_name.get(suppliers.get(material, "Unknown supplier"), "Unknown"),
                    "email": supplier_contact_email.get(suppliers.get(material, "Unknown supplier"), "Unknown"),
                    "position": supplier_contact_position.get(suppliers.get(material, "Unknown supplier"), "Unknown")
                },
                "insights": article_insights,
                "article": articles[i],
                "contract_clauses": contract_clauses,
                "alternate_materials": alternate_materials
            }
            all_data.append(data_entry)
            entry_id += 1
        
    # Save as JSON to preserve data structure
    with open("generated_data.json", "w") as f:
        json.dump(all_data, f, indent=2)
    print("\nAll data saved to 'generated_data.json'")

# Run the async main function
asyncio.run(main())