import google.generativeai as genai
from google.api_core import exceptions
import time
import os
from dotenv import load_dotenv
from cache_utils import init_cache, get_cached_response, cache_response, generate_cache_key

# Initialize cache on startup
init_cache()

load_dotenv()

# --- API SETUP ---
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

MODEL_NAME = 'gemini-2.0-flash'

RUBIE_DEFINITIONS = """
**RUBIE Adoption Lenses (Apply one or more of these perspectives to the output):**
1. RIPPLE (Indirectly Affected): Downstream impact, disruption, shared resource, shared service, and shadow processes.
2. USER (Direct Usage): Usability, effort, operation, and day-to-day engagement.
3. BENEFACTOR (Outcome Owner): Intangible outcomes, productivity, employee motivation, strategy, company fit, value realization, general benefit.
4. IMPLEMENTOR (Deployment): Feasibility, complexity, service, training, platform, tech stack, compliance, legal, and integration.
5. ECONOMIC BUYER (Budget): ROI, financial risk, and opportunity cost. Tangible outcomes.
"""

# --- PROMPTS ---
PROMPTS = {
    "full": {"text": "Map the entire lifecycle from Stage 0 to Stage 9, including all transition stages (0->1, 1->2, 2->3, 3->Prepare for use, 4->6). Provide a high-level strategic overview."},
    "phase_1": {"text": "START AT STAGE 0. END AT STAGE 3. Focus on the Buying Cycle: Stages 0, 0->1, 1, 1->2, 2, 2->3, and 3."},
    "phase_2": {"text": "START AT STAGE 3. END AT STAGE 4. Focus on the Transition: Stages 3 (Ordered), 3->Prepare for Use, and 4 (Usage)."},
    "phase_3": {"text": "START AT STAGE 4. END AT STAGE 6. Focus on Value Confirmation: Stages 4 (Usage), 4->6 (Value Stage), and 6 (Assessment). SKIP STAGE 5."},
    "phase_4": {"text": "START AT STAGE 7. END AT STAGE 9. Focus on Commercial Growth: Stages 7 (Renew), 8 (Add), and 9 (Expand)."},
    "detail_0_1": {"text": "START AT STAGE 0. END AT STAGE 0->1. High-Density EXHAUSTIVE detail on Stages 0 and 0->1 only."},
    "detail_1_2": {"text": "START AT STAGE 1. END AT STAGE 2. High-Density EXHAUSTIVE detail on Stages 1 and 2 only. Do not generate Stage 0."},
    "detail_2_3": {"text": "START AT STAGE 2. END AT STAGE 3. High-Density EXHAUSTIVE detail on Stages 2 and 3 only. Do not generate Stage 0 or 1."},
    "detail_3_4": {"text": "START AT STAGE 3. END AT STAGE 4. High-Density EXHAUSTIVE detail on Stages 3 (Ordered) and 4 (Usage). Do not generate Stage 0, 1, or 2."},
    "detail_4_6": {"text": "START AT STAGE 4. END AT STAGE 6. High-Density EXHAUSTIVE detail on Stages 4 (Usage) and 6 (Assessment). SKIP STAGE 5."},
    "detail_6_7": {"text": "START AT STAGE 6. END AT STAGE 7. High-Density EXHAUSTIVE detail on Stages 6 and 7. Do not generate earlier stages."},
    "detail_6_8": {"text": "START AT STAGE 6. END AT STAGE 8. High-Density EXHAUSTIVE detail on Stages 6 and 8. Do not generate earlier stages."},
    "detail_6_9": {"text": "START AT STAGE 6. END AT STAGE 9. High-Density EXHAUSTIVE detail on Stages 6 and 9. Do not generate earlier stages."}
}

# --- GRANULARITY LEVELS ---
GRANULARITY_INSTRUCTIONS = {
    "OVERVIEW": "ALTITUDE: STRATEGIC OVERVIEW. Provide a high-level summary of what the customer is doing generally at each stage. Focus on broad organizational behavior and strategic outcomes. Aim for 1-2 essential items per lens.",
    "KEY_EVENTS": "ALTITUDE: KEY EVENTS. Zoom in to the key events, major milestones, and critical decision points happening at each stage. Focus on what triggers movement. Aim for 2-3 items per lens.",
    "STREET_VIEW": "ALTITUDE: STREET VIEW DETAIL. Provide EXHAUSTIVE detail. Map every granular micro-step, internal friction point, specific approval, and transition activity. This is 'Street View'. Aim for 5-8 distinct items per lens per stage to ensure no detail is missed."
}

MASTER_PROMPT = """
You are an expert in the "Customer Decision Map" (CDM) framework.
Your task is to map specific "Decision Obligations" for a customer buying cycle.

{granularity_instruction}

STRICT STAGE DEFINITIONS:
1. Stage 0 - Aware: No decision made yet; awareness of a problem or opportunity.
2. Stage 0->1 - Mobilizing: Internal consensus building and identifying the need for a solution. Consensus builds into a business case for change. Sources are found. Preliminary pricing is received from suppliers. The need and preliminary requirements are defined. Short list of suppliers.
3. Stage 1 - Sourced: Sourcing is completed. Budget and authority are achieved. The new goal is to select one supplier from the list. 
4. Stage 1 -> 2 - (Decide): Decide on the supplier. Mitigate risk. Evaluate proposals and suppliers from the short list. Understand the implications, implementation, and value of suppliers' proposals. If negotiation occurs before selection, negotiate the terms. Make a final selection.
5. Stage 2 - Selected: The final choice has been made but not yet formalized. In e-commerce, this is the shopping cart. 
6. Stage 2 -> 3 - (Order Prep): Order preparation: Do everything necessary to prepare the first order. Complete any final negotiations. 
7. Stage 3 - Ordered: Contracts signed, purchase completed. First order sent.
8. Stage 3 -> (Prepare for Use): Complete all tasks and activities to begin using the product or service.
9. Stage 4 - Usage (Initial): First steps of implementation and user adoption. This is the beginning of the product or service's value being recognized.
10. Stage 4 -> 6 (Value Stage): The product delivers the desired value. This includes service, support, documentation, and usage.
11. ADOPTION (Stage 5): [Note: This stage is individual to the customer and perception-based; AI provides general context only and cannot assess individual perception.]
12. Stage 6 - Assessment: Formal review of value realized and performance (Skip Stage 5). The customer is assessing renewal (replacement, reordering), addition or modification, or expansion with a different product or location.
13. Stage 7 - Renew: Decision to continue the service (reordering, replenishing). 
14. Stage 8 - Add: Decision to increase usage or add modules.
15. Stage 9 - Expand: Decision to roll out to other departments or regions, or an additional product.

{rubie_context}

INPUTS:
- Product/Service: {product}
- Targeted Customer: {industry}

CRITICAL INSTRUCTION:
- SCOPE: {scope_instruction}
- **RUBIE LENSES:** You MUST generate multiple rows for EQUALLY FOR EACH of the 5 RUBIE Lenses (RIPPLE, USER, BENEFACTOR, IMPLEMENTOR, ECONOMIC BUYER).
- Do NOT start at Stage 0 unless the Scope explicitly asks for it.
- **CONCISENESS:** KEEP ALL FIELDS EXTREMELY BRIEF (short phrases). This is REQUIRED to enable the high volume of rows needed for Street View.

OUTPUT REQUIREMENTS:
Return a JSON object containing a key "strategy_map" which is a list of objects. Each object represents a single obligation for a specific lens and MUST have the following keys:
1. "stage": Use ONLY the Main Stage Labels (e.g., "Stage 0 - Aware", "Stage 1 - Sourced").
2. "lens": One of the 5 RUBIE Lenses (e.g., "USER", "ECONOMIC BUYER").
3. "decision_obligation": Brief phrase(s) reflecting that specific lens.
4. "responsible_role": The role responsible for this obligation.
{customer_thinking_json_req}
{sales_question_json_req}
{ai_question_json_req}
5. "confidence": One of "High", "Med", "Low".

Example JSON structure (showing HIGH DENSITY matching Street View):
{{
  "strategy_map": [
    {{
      "stage": "Stage 0 - Aware",
      "lens": "RIPPLE",
      "decision_obligation": "Assess downstream workflow impact.",
      "responsible_role": "Ops Director",
      "confidence": "High"
    }},
    {{
      "stage": "Stage 0 - Aware",
      "lens": "RIPPLE",
      "decision_obligation": "Identify shared resource constraints.",
      "responsible_role": "Resource Manager",
      "confidence": "High"
    }},
    {{
      "stage": "Stage 0 - Aware",
      "lens": "RIPPLE",
      "decision_obligation": "Map inter-departmental data dependencies.",
      "responsible_role": "Data Architect",
      "confidence": "Med"
    }},
    {{
      "stage": "Stage 0 - Aware",
      "lens": "RIPPLE",
      "decision_obligation": "Audit shadow processes in finance.",
      "responsible_role": "Finance Ops",
      "confidence": "Low"
    }},
    {{
      "stage": "Stage 0 - Aware",
      "lens": "USER",
      "decision_obligation": "Log current manual intervention points.",
      "responsible_role": "End User",
      "confidence": "High"
    }}
  ]
}}

CRITICAL QUANTITY REQUIREMENT:
- For OVERVIEW: 1-2 items per lens per stage.
- For KEY EVENTS: 2-3 items per lens per stage.
- For STREET VIEW: **REQUIRED 5-8 items per lens per stage**. Do NOT provide only 3 items; map the micro-steps exhaustively.

Ensure your JSON response is complete and does not exceed token limits.

Return ONLY valid JSON.
"""

def generate_strategy(product, industry, rubie_pov_list, scope_key, show_ai_q, show_customer_thinking=False, show_sales_question=False):
    import json
    if not api_key or api_key == "your_api_key_here":
        raise ValueError("GEMINI_API_KEY is missing or invalid in server environment.")

    # Determine Granularity Level
    if scope_key == "full":
        granularity = GRANULARITY_INSTRUCTIONS["OVERVIEW"]
    elif scope_key.startswith("phase_"):
        granularity = GRANULARITY_INSTRUCTIONS["KEY_EVENTS"]
    else:
        granularity = GRANULARITY_INSTRUCTIONS["STREET_VIEW"]

    # We provide all definitions to the AI for the batch request
    rubie_context_text = RUBIE_DEFINITIONS
    
    # JSON specific requirements
    customer_thinking_json_req = '5. "customer_thinking": Likely thoughts at this stage.' if show_customer_thinking else ""
    sales_question_json_req = '6. "sales_question": Qualitative question for salesperson.' if show_sales_question else ""
    ai_question_json_req = '7. "ai_question": Likely question for AI.' if show_ai_q else ""

    scope_instruction = PROMPTS.get(scope_key, {}).get("text", "Map the lifecycle.")

    final_prompt = MASTER_PROMPT.format(
        granularity_instruction=granularity,
        rubie_context=rubie_context_text,
        product=product, 
        industry=industry, 
        scope_instruction=scope_instruction,
        customer_thinking_json_req=customer_thinking_json_req,
        sales_question_json_req=sales_question_json_req,
        ai_question_json_req=ai_question_json_req
    )
    
    model = genai.GenerativeModel(MODEL_NAME)
    
    # --- CACHE CHECK ---
    cache_key = generate_cache_key(final_prompt)
    cached_data = get_cached_response(cache_key)
    if cached_data:
        return cached_data
    # -------------------
    
    delay = 2 
    max_retries = 3
    
    for attempt in range(1, max_retries + 1):
        try:
            generation_config = {
                "response_mime_type": "application/json",
                "max_output_tokens": 8192
            }
            response = model.generate_content(final_prompt, generation_config=generation_config)
            data = json.loads(response.text)
            strategy_map = data.get("strategy_map", [])
            
            # Convert JSON list of objects to List[List[str]] for compatibility
            headers = ["CDM Stage/Step", "Lens", "Decision Obligation", "Responsible Role"]
            key_map = [("stage", "CDM Stage/Step"), ("lens", "Lens"), ("decision_obligation", "Decision Obligation"), ("responsible_role", "Responsible Role")]
            
            if show_customer_thinking:
                headers.append("Customer Thinking")
                key_map.append(("customer_thinking", "Customer Thinking"))
            if show_sales_question:
                headers.append("Sales Question")
                key_map.append(("sales_question", "Sales Question"))
            if show_ai_q:
                headers.append("Likely AI Question")
                key_map.append(("ai_question", "Likely AI Question"))
            
            headers.append("Confidence")
            key_map.append(("confidence", "Confidence"))
            
            rows = [headers]
            for item in strategy_map:
                row = []
                for key, _ in key_map:
                    row.append(str(item.get(key, "")))
                rows.append(row)
            
            # Synthesize Markdown Table
            md_lines = ["| " + " | ".join(headers) + " |", "|" + "---|"*len(headers)]
            for row in rows[1:]:
                md_lines.append("| " + " | ".join(row) + " |")
            markdown_table = "\n".join(md_lines)
            
            # Pack it as a JSON string for the endpoint to parse (or return rows directly if modified there)
            # Actually, the endpoint expects a single string or custom structure.
            # Let's return a dictionary and fix the endpoint.
            result = {
                "markdown": markdown_table,
                "table": rows
            }
            
            # Since the current services.py returns a string, we'll pack it to keep compatibility with the loop
            # BUT we should really update the interface. I'll stick to a special delimited format or just return the JSON string.
            # Let's return the JSON string but encoded in a way that main.py can easily identify.
            final_output = json.dumps(result)
            
            # --- SAVE TO CACHE ---
            cache_response(cache_key, final_output)
            # ---------------------
            return final_output
            
        except exceptions.ResourceExhausted:
            print(f"⚠️ Quota exceeded. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2 
        except Exception as e:
            print(f"❌ Error generating content: {e}")
            raise RuntimeError(f"Gemini API Error: {str(e)}")
            
    raise RuntimeError("Failed to generate strategy after maximum retries. The AI service may be busy.")

def search_entities(query: str):
    """
    Identifies whether the query is a company or an industry and returns matches.
    """
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing.")

    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    You are a business classification assistant.
    The user has entered the query: "{query}" through a search bar.
    
    Identify if this query is likely a specific **Company** or a broader **Industry**.
    
    1. If it looks like a company name (e.g. "Oracle", "Salesforce"), return providing the official company name.
    2. If it looks like an industry (e.g. "Healthcare", "SaaS"), return likely standard industry names.
    3. If ambiguous, provide the most likely options for both.
    
    Return a JSON object with a key "matches" containing a list of objects.
    Each object must have:
    - "name": The official Name of the entity.
    - "type": Either "Company" or "Industry".
    - "description": A very brief 1-sentence description.
    
    Example Output:
    {{
        "matches": [
            {{"name": "Oracle Corporation", "type": "Company", "description": "Multinational computer technology corporation."}},
            {{"name": "Enterprise Software", "type": "Industry", "description": "Software used to satisfy the needs of an organization rather than individual users."}}
        ]
    }}
    
    Provide up to 5 matches. Return ONLY valid JSON.
    """
    
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        import json
        return json.loads(response.text).get("matches", [])
    except Exception as e:
        print(f"Error searching entities: {e}")
        return []

