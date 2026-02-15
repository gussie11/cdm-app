# CDM Strategy Map Generator

A professional full-stack application built with **FastAPI** and **React** that generates comprehensive Customer Decision Maps (CDM) using the **RUBIE Adoption Lens** framework and **Google Gemini 2.0 Flash**.

## Features

- **Multi-Altitude Control**: Generate strategy maps at three granular levels (Strategic Overview, Phased Lifecycle, and Street View Detail).
- **RUBIE Framework**: Exhaustive mapping across 5 distinct stakeholder lenses (Ripple, User, Benefactor, Implementor, Economic Buyer).
- **Interactive Result Views**: High-density grid-based cards or a sortable interactive list view.
- **AI-Powered Insights**: (Optional) Dynamic "Customer Thinking," "Sales Questions," and "AI Prompts" tailored to each decision obligation.
- **Export to CSV**: Download your strategy maps for easy integration into other tools.
- **Local Caching**: Optimized performance using locally cached Gemini responses.

## Tech Stack

- **Frontend**: React (Vite), TailwindCSS-inspired CSS, Lucide Icons.
- **Backend**: FastAPI (Python), Google Generative AI (Gemini 2.0 Flash).
- **Styling**: Vanilla CSS with modern dark mode aesthetics.

## Quick Start

### 1. Prerequisites
- Python 3.9+
- Node.js & npm
- Gemini API Key

### 2. Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Add your GEMINI_API_KEY
python3 main.py
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## Usage
1. Enter your **Product/Service** and target **Company/Industry**.
2. Select your desired **Scope** (Overview vs. Deep Dive).
3. Toggle optional fields like "Sales Questions" or "Customer Thinking".
4. Generate and analyze your strategy map!
