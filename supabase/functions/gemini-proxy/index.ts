// Supabase Edge Function: gemini-proxy
//
// The ONLY place the Gemini API key exists. The browser never sees it.
// Every request must carry a valid Supabase user JWT (supabase-js attaches
// this automatically for a signed-in session when you call
// `supabase.functions.invoke(...)`) — unauthenticated requests are rejected
// before Gemini is ever called.
//
// Deploy with:  supabase functions deploy gemini-proxy
// Configure the secret with: supabase secrets set GEMINI_API_KEY=your-key

import { GoogleGenAI, Type, Modality } from "npm:@google/genai@^1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Keep in sync with constants.ts AGENT_NAMES in the frontend.
const AGENT_NAMES = [
  "Civil Engineering Agent",
  "Structural Engineering Agent",
  "Mechanical Engineering Agent",
  "Electrical Engineering Agent",
  "Surveyor Agent",
  "Architect Agent",
  "MEP Agent",
  "Project Planning Agent",
  "QA/QC Agent",
  "HSE Agent",
  "Document Automation Agent",
  "CAD Generation Agent",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!GEMINI_API_KEY) {
    return json({ error: "Server misconfigured: GEMINI_API_KEY secret is not set." }, 500);
  }

  // Authenticate the caller using their own forwarded JWT — this client
  // respects Row Level Security, so file downloads below only ever see
  // files the caller actually owns. No service-role key is used here.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return json({ error: "Authentication required. Please sign in and try again." }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    switch (body.action) {
      case "detect-agents":
        return json(await detectActiveAgents(ai, body.prompt ?? ""));
      case "generate":
        return json(await generateEngineeringOutput(ai, supabase, body));
      case "speech":
        return json(await generateSpeech(ai, body.text ?? ""));
      case "chat":
        return json(await generateChatResponse(ai, body.history ?? []));
      default:
        return json({ error: `Unknown action: ${body.action}` }, 400);
    }
  } catch (error) {
    console.error("gemini-proxy error:", error);
    const message = error instanceof Error ? error.message : String(error);
    // Preserve status-code hints (429/400/500/503) in the message so the
    // client's existing user-friendly error mapping keeps working.
    const status = /429|resource_exhausted/i.test(message)
      ? 429
      : /400|invalid argument/i.test(message)
      ? 400
      : /503|unavailable/i.test(message)
      ? 503
      : 500;
    return json({ error: message }, status);
  }
});

// ---------------------------------------------------------------------------
// Actions — ported from the original client-side services/geminiService.ts
// ---------------------------------------------------------------------------

async function detectActiveAgents(ai: GoogleGenAI, prompt: string) {
  if (!prompt.trim()) return { text: "" };

  const geminiPrompt = `
    Based on the user's engineering request, identify which of the following agents should be activated.
    Respond with ONLY a comma-separated list of the agent names. Do not add any explanation or formatting.
    Available Agents: ${AGENT_NAMES.join(", ")}

    User Request: "${prompt}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: geminiPrompt,
  });

  return { text: response.text ?? "" };
}

async function generateEngineeringOutput(
  ai: GoogleGenAI,
  supabase: ReturnType<typeof createClient>,
  body: any,
) {
  const {
    prompt,
    activeAgents = [],
    mode = "Balanced",
    files = [] as { name: string; mimeType: string; storagePath: string }[],
    isRedactionEnabled = false,
    alphaEarthLocation = null,
  } = body;

  const newSystemPrompt = `You are ENGINEERING EXECUTION AI ENTERPRISE (EE-AI PRO) — a multi-agent engineering, operations, and production automation system for a full-scale engineering organization. You automate the entire engineering lifecycle for Civil, Structural, Mechanical, Electrical, Architectural, and MEP operations. You run like a real engineering department, not a chatbot. SECTION 1 — ENTERPRISE-GRADE RULES: 1.1 Zero-Hallucination Policy (Strict Mode) - You may NEVER invent engineering values. If information is missing: → STOP and request required inputs → Use “Insufficient Data. Provide: […].” You may NOT guess: dimensions, loads, material strengths, soil conditions, equipment ratings, codes or standards, schedules, tolerances, safety requirements. Only produce calculations backed by internationally recognized engineering standards. 1.2 Engineering Codes (Allowed Only) - Civil/Structural: Eurocode 0–8, ACI 318, BS 8110, AISC, API, NBC (Nigeria); Mechanical: ASME, API 610, 650, 653, ISO, NFPA 20; Electrical: NEC, IEC 60364, NFPA 70, Nigerian Electrical Code; Architectural: ISO, IBC, Local Building Codes. If unsure of a standard → STOP and ask user. 1.3 Enterprise-Safe Output Format - Every output MUST follow this structured format: Task Understanding, Required Inputs, Assumptions, Codes Used, Calculations, Analysis & Safety Checks, Engineering Decision, BOQ / Material List, CAD / Drawing JSON Schema, Construction / Fabrication Procedures, QA/QC Requirements, HSE Requirements, Final Summary, Next Steps / Additional Input Needed. SECTION 2 — MULTI-AGENT ENTERPRISE SYSTEM - You run specialized engineering agents. ENGINEERING AGENTS: Civil, Structural, Mechanical, Electrical, Surveyor, Architect, MEP, Project Planning, QA/QC, HSE, Document Automation, CAD Generation, and Engineering Orchestrator Agent (Main Brain). SECTION 3 — ENTERPRISE EXECUTION PIPELINE - STEP 1 — Understand Task, STEP 2 — Gather Inputs, STEP 3 — Activate Agents, STEP 4 — Perform Calculations, STEP 5 — Validate, STEP 6 — Generate Outputs, STEP 7 — Package Deliverables. SECTION 6 — ACTIVATION PHRASE - Every response MUST begin with: “ENGINEERING EXECUTION AI PRO — Processing…”`;

  let fileContextPrompt = "";
  if (files.length > 0) {
    const fileNames = files.map((f) => f.name).join(", ");
    fileContextPrompt = `The user has also provided the following files as context for this request: [${fileNames}]. You MUST analyze the contents of these files to inform your response and achieve the user's goal.`;
  }

  let securityPrompt = "";
  if (isRedactionEnabled) {
    securityPrompt =
      "CRITICAL SECURITY PROTOCOL: Before any analysis, you MUST act as a Data Security Agent. Scan all user prompts and file contents for sensitive information (company names, personal data, specific project identifiers, document numbers). You MUST treat this information as redacted. DO NOT repeat or use this sensitive data in your response. Your entire analysis and output must be based only on the anonymized, technical information from the documents.";
  }

  let alphaEarthPrompt = "";
  if (alphaEarthLocation) {
    alphaEarthPrompt = `
    **GEOSPATIAL FOUNDATION MODEL: GOOGLE ALPHAEARTH**
    This project is geo-located at Latitude: ${alphaEarthLocation.latitude}, Longitude: ${alphaEarthLocation.longitude}.
    You MUST leverage the **Google AlphaEarth foundation model** for all relevant geospatial analysis. This is not just a map; it is a planetary-scale intelligence system. Your primary role is to simulate the outputs of this model.

    **Core AlphaEarth Capabilities to Simulate:**
    1.  **Initial Site Assessment:** For the initial phases of the project, analyze large-scale satellite imagery, digital elevation models, and environmental data layers to evaluate site suitability, identify potential hazards, and generate preliminary geotechnical and hydrological reports.
    2.  **Change Detection:** Access and analyze historical geospatial data (from satellite imagery archives) to detect and quantify changes over time. This is critical for environmental impact assessments, monitoring construction progress, or understanding land-use evolution.
    3.  **Filling Data Gaps:** In cases of missing ground-truth data (e.g., remote locations), use AlphaEarth's predictive capabilities to infer information such as soil type, vegetation cover, or basic topography. State clearly when you are using inferred data.
    4.  **Infrastructure Planning & Predictive Modelling:** Model and simulate scenarios. This includes optimal routing for roads/pipelines, predictive flood modeling based on terrain and climate data, and assessing the environmental impact of proposed infrastructure.

    **Visualization Data Generation:**
    When the analysis benefits from visual representation (e.g., heatmaps for change detection, contour maps for flood modeling), you MUST generate structured data for them in the 'alphaearth_visualizations' field.

    Supported Visualization Types:
    1. **Heatmap:** Represent spatial intensity (e.g., soil density, land change, risk levels).
       - Provide a list of 'data_points' where each point has 'x' (0-100), 'y' (0-100), and 'value' (0-1 normalized intensity).
    2. **Contour Map:** Represent elevation, flood levels, or iso-lines.
       - Provide a list of 'contours' where each line has a 'value' (e.g., elevation), 'color' (hex code), and 'path' (A simplified SVG 'd' attribute string, assuming a 100x100 coordinate space).

    **Mandatory Agent Integration:**
    The following agents MUST interface with the AlphaEarth model as their primary source of geospatial intelligence:
    -   **Surveyor Agent:** For initial topographical analysis, change detection, and filling data gaps.
    -   **Civil Engineering Agent:** For site assessment, infrastructure planning, and predictive flood/drainage modeling.
    -   **Project Planning Agent:** For logistics planning based on terrain analysis and predictive modeling of site conditions.
    -   **HSE Agent:** For identifying and modeling environmental risks (e.g., landslide susceptibility, flood plains).
    -   **Architect Agent:** For large-scale site analysis and master planning context.

    All relevant engineering outputs must be explicitly grounded in the analysis derived from the AlphaEarth system at the specified coordinates.
    `;
  }

  const finalInstruction = `${securityPrompt} ${alphaEarthPrompt} The user has provided a request and the following agents have been activated: ${activeAgents.join(", ")}. Your task is to act as the Engineering Orchestrator Agent (Main Brain). Interpret the user's request, process it using the logic of the activated agents, and generate a complete, structured JSON response according to the provided schema. CRITICAL OVERRIDE: Disregard the text-based "Enterprise-Safe Output Format" (Section 1.3) for your final output. You MUST produce your final output as a single, valid JSON object that conforms to the provided \`responseSchema\`. Populate the fields of this JSON object using the content you would have generated for the text-based sections. For instance: 'inputs_confirmed' should contain "Required Inputs" and "Assumptions". 'engineering_output' should contain "Calculations", "Analysis & Safety Checks", and "Engineering Decision". 'bom' should contain the "BOQ / Material List". 'cad_scripts' should contain the "CAD / Drawing JSON Schema". 'method_statement' should contain "Construction / Fabrication Procedures". 'qa_qc' should contain "QA/QC Requirements". 'hse' should contain "HSE Requirements". 'compliance' should contain "Codes Used". 'final_recommendation' should contain "Task Understanding", "Final Summary", and "Next Steps / Additional Input Needed". 'alphaearth_visualizations' should contain the structured visualization data. IMPORTANT: For the following fields, you MUST provide a valid, stringified JSON object: 'inputs_confirmed', 'engineering_output', 'design_files', 'cad_scripts', 'bom', 'compliance', 'qa_qc', 'hse', 'method_statement', 'risk_assessment', 'alphaearth_visualizations'. Example for 'bom': "{\\"rebar\\":{\\"quantity\\":\\"100kg\\"},\\"concrete\\":{\\"volume\\":\\"5m^3\\"}}" ${fileContextPrompt}`;

  const systemInstruction = `${newSystemPrompt}\n\n${finalInstruction}`;

  let model = "gemini-2.5-pro";
  const config: any = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["success", "need_more_info", "error"] },
        active_agents: { type: Type.ARRAY, items: { type: Type.STRING } },
        inputs_confirmed: { type: Type.STRING, description: "A stringified JSON object of confirmed inputs." },
        engineering_output: { type: Type.STRING, description: "A stringified JSON object of engineering outputs." },
        design_files: { type: Type.STRING, description: "A stringified JSON object of design files information." },
        cad_scripts: { type: Type.STRING, description: "A stringified JSON object for CAD scripts." },
        bom: { type: Type.STRING, description: "A stringified JSON object for the Bill of Materials." },
        compliance: { type: Type.STRING, description: "A stringified JSON object for compliance checks." },
        qa_qc: { type: Type.STRING, description: "A stringified JSON object for the QA/QC plan." },
        hse: { type: Type.STRING, description: "A stringified JSON object for the HSE plan." },
        method_statement: { type: Type.STRING, description: "A stringified JSON object for the method statement." },
        risk_assessment: { type: Type.STRING, description: "A stringified JSON object for the risk assessment." },
        alphaearth_visualizations: { type: Type.STRING, description: "A stringified JSON array of Visualization objects." },
        final_recommendation: { type: Type.STRING, description: "A concise summary of the Task Understanding, Final Recommendations, and Next Steps." },
      },
    },
  };

  if (mode === "Fast") {
    model = "gemini-flash-lite-latest";
  } else if (mode === "Complex") {
    model = "gemini-2.5-pro";
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const contentParts: any[] = [{ text: `User Request: "${prompt}"` }];

  // Fetch each attached file from Storage using the CALLER's own JWT, so
  // Row Level Security guarantees this can only ever read files the
  // requesting user actually owns.
  for (const file of files) {
    const { data: blob, error: downloadError } = await supabase.storage
      .from("project-files")
      .download(file.storagePath);
    if (downloadError || !blob) {
      throw new Error(`Could not read attached file "${file.name}": ${downloadError?.message ?? "not found"}`);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    contentParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: encodeBase64(bytes),
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contentParts },
    config,
  });

  if (!response || typeof response.text !== "string" || response.text.trim() === "") {
    throw new Error("Received an invalid or empty response from the Gemini API.");
  }

  return { text: response.text };
}

async function generateSpeech(ai: GoogleGenAI, textToSpeak: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: textToSpeak }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
    },
  });

  const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) {
    throw new Error("No audio data received from the API.");
  }
  return { audioBase64 };
}

async function generateChatResponse(ai: GoogleGenAI, history: { role: "user" | "model"; content: string }[]) {
  if (!history.length) return { text: "Please ask a question." };

  const contents = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });

  return { text: response.text ?? "" };
}
