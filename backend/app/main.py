from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def load_data():
    insights = pd.read_csv("synthetic_insights.csv")
    # Load articles from JSON instead of CSV to preserve data types
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

@app.get("/graph")
async def get_graph():
    insights, articles = load_data()
    graph_data = create_graph_data(insights.head(10), articles)
    return graph_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
