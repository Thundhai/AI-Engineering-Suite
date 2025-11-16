



import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AGENT_NAMES } from '../constants';
import { EngineeringOutput, GenerationMode, UploadedFile, ChatMessage, GeoLocation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function detectActiveAgents(prompt: string): Promise<string[]> {
  if (!prompt.trim()) {
    return [];
  }
  try {
    const geminiPrompt = `
      Based on the user's engineering request, identify which of the following agents should be activated.
      Respond with ONLY a comma-separated list of the agent names. Do not add any explanation or formatting.
      Available Agents: ${AGENT_NAMES.join(', ')}

      User Request: "${prompt}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: geminiPrompt,
    });
    
    const text = response.text;
    const detectedAgents = text.split(',').map(name => name.trim()).filter(name => AGENT_NAMES.includes(name));
    return detectedAgents;
  } catch (error) {
    console.error("Error detecting active agents:", error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        throw new Error("You have exceeded your request quota for agent detection. Please wait a moment before trying again.");
    }
    throw new Error("Failed to detect agents. Please check your connection or try again.");
  }
}

export async function generateEngineeringOutput(prompt: string, activeAgents: string[], mode: GenerationMode, files: UploadedFile[], isRedactionEnabled: boolean, alphaEarthLocation: GeoLocation | null): Promise<EngineeringOutput> {
  const newSystemPrompt = `You are ENGINEERING EXECUTION AI ENTERPRISE (EE-AI PRO) — a multi-agent engineering, operations, and production automation system for a full-scale engineering organization. You automate the entire engineering lifecycle for Civil, Structural, Mechanical, Electrical, Architectural, and MEP operations. You run like a real engineering department, not a chatbot. SECTION 1 — ENTERPRISE-GRADE RULES: 1.1 Zero-Hallucination Policy (Strict Mode) - You may NEVER invent engineering values. If information is missing: → STOP and request required inputs → Use “Insufficient Data. Provide: […].” You may NOT guess: dimensions, loads, material strengths, soil conditions, equipment ratings, codes or standards, schedules, tolerances, safety requirements. Only produce calculations backed by internationally recognized engineering standards. 1.2 Engineering Codes (Allowed Only) - Civil/Structural: Eurocode 0–8, ACI 318, BS 8110, AISC, API, NBC (Nigeria); Mechanical: ASME, API 610, 650, 653, ISO, NFPA 20; Electrical: NEC, IEC 60364, NFPA 70, Nigerian Electrical Code; Architectural: ISO, IBC, Local Building Codes. If unsure of a standard → STOP and ask user. 1.3 Enterprise-Safe Output Format - Every output MUST follow this structured format: Task Understanding, Required Inputs, Assumptions, Codes Used, Calculations, Analysis & Safety Checks, Engineering Decision, BOQ / Material List, CAD / Drawing JSON Schema, Construction / Fabrication Procedures, QA/QC Requirements, HSE Requirements, Final Summary, Next Steps / Additional Input Needed. SECTION 2 — MULTI-AGENT ENTERPRISE SYSTEM - You run specialized engineering agents. ENGINEERING AGENTS: Civil, Structural, Mechanical, Electrical, Surveyor, Architect, MEP, Project Planning, QA/QC, HSE, Document Automation, CAD Generation, and Engineering Orchestrator Agent (Main Brain). SECTION 3 — ENTERPRISE EXECUTION PIPELINE - STEP 1 — Understand Task, STEP 2 — Gather Inputs, STEP 3 — Activate Agents, STEP 4 — Perform Calculations, STEP 5 — Validate, STEP 6 — Generate Outputs, STEP 7 — Package Deliverables. SECTION 6 — ACTIVATION PHRASE - Every response MUST begin with: “ENGINEERING EXECUTION AI PRO — Processing…”`;
  
  let fileContextPrompt = '';
  if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      fileContextPrompt = `The user has also provided the following files as context for this request: [${fileNames}]. You MUST analyze the contents of these files to inform your response and achieve the user's goal.`;
  }
  
  let securityPrompt = '';
  if (isRedactionEnabled) {
      securityPrompt = 'CRITICAL SECURITY PROTOCOL: Before any analysis, you MUST act as a Data Security Agent. Scan all user prompts and file contents for sensitive information (company names, personal data, specific project identifiers, document numbers). You MUST treat this information as redacted. DO NOT repeat or use this sensitive data in your response. Your entire analysis and output must be based only on the anonymized, technical information from the documents.';
  }

  let alphaEarthPrompt = '';
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

  const finalInstruction = `${securityPrompt} ${alphaEarthPrompt} The user has provided a request and the following agents have been activated: ${activeAgents.join(', ')}. Your task is to act as the Engineering Orchestrator Agent (Main Brain). Interpret the user's request, process it using the logic of the activated agents, and generate a complete, structured JSON response according to the provided schema. CRITICAL OVERRIDE: Disregard the text-based "Enterprise-Safe Output Format" (Section 1.3) for your final output. You MUST produce your final output as a single, valid JSON object that conforms to the provided \`responseSchema\`. Populate the fields of this JSON object using the content you would have generated for the text-based sections. For instance: 'inputs_confirmed' should contain "Required Inputs" and "Assumptions". 'engineering_output' should contain "Calculations", "Analysis & Safety Checks", and "Engineering Decision". 'bom' should contain the "BOQ / Material List". 'cad_scripts' should contain the "CAD / Drawing JSON Schema". 'method_statement' should contain "Construction / Fabrication Procedures". 'qa_qc' should contain "QA/QC Requirements". 'hse' should contain "HSE Requirements". 'compliance' should contain "Codes Used". 'final_recommendation' should contain "Task Understanding", "Final Summary", and "Next Steps / Additional Input Needed". IMPORTANT: For the following fields, you MUST provide a valid, stringified JSON object: 'inputs_confirmed', 'engineering_output', 'design_files', 'cad_scripts', 'bom', 'compliance', 'qa_qc', 'hse', 'method_statement', 'risk_assessment'. Example for 'bom': "{\\"rebar\\":{\\"quantity\\":\\"100kg\\"},\\"concrete\\":{\\"volume\\":\\"5m^3\\"}}" ${fileContextPrompt}`;
  
  const systemInstruction = `${newSystemPrompt}\n\n${finalInstruction}`;
  
  let model = 'gemini-2.5-pro';
  const config: any = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ['success', 'need_more_info', 'error'] },
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
          final_recommendation: { type: Type.STRING }
        }
      },
  };

  if (mode === 'Fast') {
      // FIX: Use 'gemini-flash-lite-latest' model name as per guidelines.
      model = 'gemini-flash-lite-latest';
  } else if (mode === 'Complex') {
      model = 'gemini-2.5-pro';
      config.thinkingConfig = { thinkingBudget: 32768 };
  }
  
  const contentParts: any[] = [{ text: `User Request: "${prompt}"` }];
  for (const file of files) {
      contentParts.push({
          inlineData: {
              mimeType: file.mimeType,
              data: file.data
          }
      });
  }

  try {
     const response = await ai.models.generateContent({
        model,
        contents: { parts: contentParts },
        config,
     });
    
    if (!response || typeof response.text !== 'string' || response.text.trim() === '') {
      throw new Error("Received an invalid or empty response from the Gemini API.");
    }

    const jsonString = response.text;
    let result: any;

    try {
        result = JSON.parse(jsonString);
    } catch(parseError) {
        console.error("Failed to parse initial JSON response from API:", jsonString);
        throw new Error("The model returned a malformed JSON response.");
    }

    const fieldsToParse: (keyof EngineeringOutput)[] = [
      'inputs_confirmed', 'engineering_output', 'design_files', 'cad_scripts', 'bom', 
      'compliance', 'qa_qc', 'hse', 'method_statement', 'risk_assessment'
    ];

    const parsedResult: any = { ...result };

    for (const field of fieldsToParse) {
        if (parsedResult[field] && typeof parsedResult[field] === 'string') {
            try {
                parsedResult[field] = JSON.parse(parsedResult[field]);
            } catch (e) {
                console.warn(`Could not parse stringified JSON for field ${field}:`, parsedResult[field]);
                parsedResult[field] = { error: "Invalid JSON format from model", content: parsedResult[field] };
            }
        } else if (!parsedResult[field]) {
            parsedResult[field] = {}; // Ensure field exists as an object if model returns null/undefined
        }
    }

    if (typeof parsedResult.status !== 'string' || !Array.isArray(parsedResult.active_agents)) {
        console.error("Final parsed object is missing required properties:", parsedResult);
        throw new Error("The model's response is missing required data fields after parsing.");
    }

    return parsedResult as EngineeringOutput;

  } catch (error) {
    console.error("Error in generateEngineeringOutput:", error);
    let userFriendlyMessage = "An unknown error occurred while generating the report.";
    if (error instanceof Error) {
      const message = error.message;
      const lowerCaseMessage = message.toLowerCase();
      if (message.startsWith("Received an invalid") || message.startsWith("The model returned a malformed") || message.startsWith("The model's response is missing")) {
        userFriendlyMessage = message;
      } else if (lowerCaseMessage.includes('api key not valid')) {
        userFriendlyMessage = "Authentication failed: The API Key is not valid. Please ensure it is configured correctly.";
      } else if (lowerCaseMessage.includes('429') && (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('rate limit'))) {
        userFriendlyMessage = "Quota exceeded: You have exceeded your request limit for the AI model. Please check your usage or try again later.";
      } else if (lowerCaseMessage.includes('400') || lowerCaseMessage.includes('invalid argument')) {
        userFriendlyMessage = "Invalid request: The model could not process the request. This might be due to an unclear prompt or a configuration issue. Please try rephrasing your request or check the selected agents.";
      } else if (lowerCaseMessage.includes('500') || lowerCaseMessage.includes('internal error')) {
        userFriendlyMessage = "Service error: The AI service encountered a temporary internal error. Please wait a moment and try again.";
      } else if (lowerCaseMessage.includes('503') || lowerCaseMessage.includes('service unavailable')) {
        userFriendlyMessage = "Service unavailable: The AI service is currently unavailable or overloaded. Please try again in a few minutes.";
      } else if (lowerCaseMessage.includes('fetch failed') || lowerCaseMessage.includes('network')) {
        userFriendlyMessage = "Network error: Failed to connect to the AI service. Please check your internet connection.";
      } else {
        userFriendlyMessage = "An unexpected error occurred while communicating with the AI service. Please try again.";
        console.error("Unhandled API Error:", error);
      }
    } else {
      userFriendlyMessage = `An unexpected non-error object was thrown: ${String(error)}`;
      console.error("Non-error thrown:", error);
    }
    throw new Error(userFriendlyMessage);
  }
}

export async function generateSpeech(textToSpeak: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from the API.");
        }
        return base64Audio;
    } catch(error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
}

export async function generateChatResponse(history: ChatMessage[]): Promise<string> {
  if (!history.length) {
    return "Please ask a question.";
  }

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });
    return response.text;
  } catch (error) {
    console.error("Error in chat response:", error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        throw new Error("Chat quota exceeded. Please wait a moment before sending another message.");
    }
    throw new Error("Sorry, I encountered an error responding. Please try again.");
  }
}