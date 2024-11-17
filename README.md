# SmartChain

<img width="1569" alt="Screenshot 2024-11-17 at 14 39 33" src="https://github.com/user-attachments/assets/9507ee87-3369-47f2-9f75-3fc93d482160">

My submission to Llama hack 2024 London.

## What is SmartChain?

SmartChain is an AI agent that helps protect renewable energy supply chains & ensure project success. It tackles a critical but often overlooked challenge in the green energy transition: volatile supply chains.

For example, copper - a core ingredient in electrical wiring and transformers - can experience massive price fluctuations. Project directors often need alternatives like aluminum but lack the tools to monitor these effectively. This leads to unexpected costs, project overruns, and sometimes even cancellation.

## How it Works

1. **Knowledge Graph Generation**
   - Builds insights from news articles, earnings calls, and market data
   - Extracts key information about materials used in renewable projects
   - Sends critical alerts to users

2. **Alternative Materials**
   - Tracks both primary materials and their alternatives
   - Monitors pricing trends and availability
   - Suggests optimal timing for material switches

3. **AI Analysis**
   - Users can request in-depth market analysis
   - Get clear visibility into the AI's reasoning
   - Make informed decisions about contract negotiations

## Tech Stack

- **Frontend**: Next.js, React, Cytoscape for visualizations
- **Backend**: Python with FastAPI
- **Data**: Custom knowledge graph generation

## Try it Out

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && python app/main.py
```

Built for a sustainable future 🌿
