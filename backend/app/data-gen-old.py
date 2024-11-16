import os
import random
import pandas as pd
from dotenv import load_dotenv
from openai import AsyncOpenAI
import asyncio
import networkx as nx
import matplotlib.pyplot as plt

# Load environment variables from .env file
load_dotenv()

# Initialize the AsyncOpenAI client
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY")
)

# Step 1: Define the synthetic data components
materials = ["Cobalt", "Nickel"]
suppliers = ["Supplier A", "Supplier B"]

# Step 2: Create linked data
def generate_insight(num_records=50):
    data = []
    for _ in range(num_records):
        material = random.choice(materials)
        supplier = random.choice(suppliers)
        price_change = random.uniform(-20, 20)  # % change in price
        timeline = f"Q{random.randint(1, 4)} {2024 + random.randint(0, 2)}"
        
        insight = {
            "Topic": f"{material} supply disruption",
            "Material": material,
            "Supplier": supplier,
            "Price Impact (%)": round(price_change, 2),
            "Timeline": timeline,
            "Adjacent Product": random.choice(materials),
        }
        data.append(insight)
    return pd.DataFrame(data)

# Generate and save synthetic insights
if not os.path.exists("synthetic_insights.csv"):
    insights = generate_insight(100)
    insights.to_csv("synthetic_insights.csv", index=False)
    print("Synthetic insights generated and saved to 'synthetic_insights.csv'")
else:
    insights = pd.read_csv("synthetic_insights.csv")
    print("Synthetic insights loaded from 'synthetic_insights.csv'")

# Step 4: Generate articles
async def generate_article(row):
    # Format the prompt
    prompt = f"""
    Topic: {row['Topic']}
    Material: {row['Material']}
    Supplier: {row['Supplier']}
    Price Impact: {row['Price Impact (%)']}%
    Timeline: {row['Timeline']}
    Adjacent Product: {row['Adjacent Product']}

    Write a detailed 500-word article based on this insight, explaining the situation, its impact on the supply chain, and potential mitigation strategies.
    """

    # Call the Groq API to generate the article
    chat_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that writes detailed articles about supply chain and market insights.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama3-8b-8192",
        temperature=0.5,
        max_tokens=1024,
        top_p=1,
        stop=None,
        stream=False,
    )

    # Extract the generated article
    article = chat_completion.choices[0].message.content
    # Return a flattened structure instead of nested dictionary
    return {
        "Topic": row['Topic'],
        "Material": row['Material'],
        "Supplier": row['Supplier'],
        "Price_Impact": row['Price Impact (%)'],
        "Timeline": row['Timeline'],
        "Adjacent_Product": row['Adjacent Product'],
        "Article": article
    }

async def main():
    if os.path.exists("generated_articles.csv"):
        print("Generated articles already exist in 'generated_articles.csv'. Skipping regeneration.")
    else:
        tasks = []
        for index, row in insights.head(10).iterrows():
            task = generate_article(row)
            tasks.append(task)
            print(f"Started task for article {index + 1}")
        
        articles = await asyncio.gather(*tasks)
        
        # Convert to DataFrame with flattened structure
        articles_df = pd.DataFrame(articles)
        
        # Save as CSV with all columns preserved
        articles_df.to_csv("generated_articles.csv", index=False)
        print("Articles saved to 'generated_articles.csv'.")

        # Alternatively, save as JSON to preserve data types better
        articles_df.to_json("generated_articles.json", orient="records", indent=2)
        print("Articles also saved to 'generated_articles.json'.")

# Run the async main function
asyncio.run(main())