import { supabase } from './supabaseClient';
import { AGENT_NAMES } from '../constants';
import { EngineeringOutput, GenerationMode, UploadedFile, ChatMessage, GeoLocation } from '../types';

// All Gemini calls go through the 'gemini-proxy' Supabase Edge Function —
// the API key lives only there (see supabase/functions/gemini-proxy). This
// file keeps the response parsing, validation, and user-facing error
// messages that used to sit around the direct SDK call, so behavior for
// callers (and the existing test suite) is unchanged.
async function invokeProxy<T>(action: string, payload: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action, ...payload },
  });

  if (error) {
    let message = error.message;
    const context: any = (error as any).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json();
        if (body?.error) message = body.error;
      } catch {
        // Response body wasn't JSON (or already consumed) — fall back to error.message.
      }
    }
    throw new Error(message);
  }

  return data as T;
}

export async function detectActiveAgents(prompt: string): Promise<string[]> {
  if (!prompt.trim()) {
    return [];
  }
  try {
    const { text } = await invokeProxy<{ text: string }>('detect-agents', { prompt });
    const detectedAgents = (text || '').split(',').map((name) => name.trim()).filter((name) => AGENT_NAMES.includes(name));
    return detectedAgents;
  } catch (error) {
    console.error('Error detecting active agents:', error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
      throw new Error('You have exceeded your request quota for agent detection. Please wait a moment before trying again.');
    }
    throw new Error('Failed to detect agents. Please check your connection or try again.');
  }
}

export async function generateEngineeringOutput(
  prompt: string,
  activeAgents: string[],
  mode: GenerationMode,
  files: UploadedFile[],
  isRedactionEnabled: boolean,
  alphaEarthLocation: GeoLocation | null
): Promise<EngineeringOutput> {
  try {
    const { text: jsonString } = await invokeProxy<{ text: string }>('generate', {
      prompt,
      activeAgents,
      mode,
      files: files.map((f) => ({ name: f.name, mimeType: f.mimeType, storagePath: f.storagePath })),
      isRedactionEnabled,
      alphaEarthLocation,
    });

    if (!jsonString || jsonString.trim() === '') {
      throw new Error('Received an invalid or empty response from the Gemini API.');
    }

    let result: any;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse initial JSON response from API:', jsonString);
      throw new Error('The model returned a malformed JSON response.');
    }

    const fieldsToParse: (keyof EngineeringOutput)[] = [
      'inputs_confirmed', 'engineering_output', 'design_files', 'cad_scripts', 'bom',
      'compliance', 'qa_qc', 'hse', 'method_statement', 'risk_assessment', 'alphaearth_visualizations'
    ];

    const parsedResult: any = { ...result };

    for (const field of fieldsToParse) {
      if (parsedResult[field] && typeof parsedResult[field] === 'string') {
        try {
          parsedResult[field] = JSON.parse(parsedResult[field]);
        } catch (e) {
          console.warn(`Could not parse stringified JSON for field ${field}:`, parsedResult[field]);
          parsedResult[field] = field === 'alphaearth_visualizations' ? [] : { error: 'Invalid JSON format from model', content: parsedResult[field] };
        }
      } else if (!parsedResult[field]) {
        parsedResult[field] = field === 'alphaearth_visualizations' ? [] : {};
      }
    }

    if (!parsedResult.final_recommendation) {
      parsedResult.final_recommendation = 'Analysis complete. Refer to the detailed engineering output sections for specific data.';
    }

    if (typeof parsedResult.status !== 'string' || !Array.isArray(parsedResult.active_agents)) {
      console.error('Final parsed object is missing required properties:', parsedResult);
      throw new Error("The model's response is missing required data fields after parsing.");
    }

    return parsedResult as EngineeringOutput;

  } catch (error) {
    console.error('Error in generateEngineeringOutput:', error);
    let userFriendlyMessage = 'An unknown error occurred while generating the report.';
    if (error instanceof Error) {
      const message = error.message;
      const lowerCaseMessage = message.toLowerCase();
      if (message.startsWith('Received an invalid') || message.startsWith('The model returned a malformed') || message.startsWith("The model's response is missing")) {
        userFriendlyMessage = message;
      } else if (lowerCaseMessage.includes('authentication required') || lowerCaseMessage.includes('sign in')) {
        userFriendlyMessage = 'Your session has expired. Please sign in again.';
      } else if (lowerCaseMessage.includes('api key not valid')) {
        userFriendlyMessage = 'Authentication failed: The API Key is not valid. Please ensure it is configured correctly.';
      } else if (lowerCaseMessage.includes('429') && (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('rate limit'))) {
        userFriendlyMessage = 'Quota exceeded: You have exceeded your request limit for the AI model. Please check your usage or try again later.';
      } else if (lowerCaseMessage.includes('400') || lowerCaseMessage.includes('invalid argument')) {
        userFriendlyMessage = 'Invalid request: The model could not process the request. This might be due to an unclear prompt or a configuration issue. Please try rephrasing your request or check the selected agents.';
      } else if (lowerCaseMessage.includes('500') || lowerCaseMessage.includes('internal error')) {
        userFriendlyMessage = 'Service error: The AI service encountered a temporary internal error. Please wait a moment and try again.';
      } else if (lowerCaseMessage.includes('503') || lowerCaseMessage.includes('unavailable')) {
        userFriendlyMessage = 'Service unavailable: The AI service is currently unavailable or overloaded. Please try again in a few minutes.';
      } else if (lowerCaseMessage.includes('fetch failed') || lowerCaseMessage.includes('network')) {
        userFriendlyMessage = 'Network error: Failed to connect to the AI service. Please check your internet connection.';
      } else {
        userFriendlyMessage = message || 'An unexpected error occurred while communicating with the AI service. Please try again.';
        console.error('Unhandled API Error:', error);
      }
    } else {
      userFriendlyMessage = `An unexpected non-error object was thrown: ${String(error)}`;
      console.error('Non-error thrown:', error);
    }
    throw new Error(userFriendlyMessage);
  }
}

export async function generateSpeech(textToSpeak: string): Promise<string> {
  try {
    const { audioBase64 } = await invokeProxy<{ audioBase64: string }>('speech', { text: textToSpeak });
    if (!audioBase64) {
      throw new Error('No audio data received from the API.');
    }
    return audioBase64;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech.');
  }
}

export async function generateChatResponse(history: ChatMessage[]): Promise<string> {
  if (!history.length) {
    return 'Please ask a question.';
  }
  try {
    const { text } = await invokeProxy<{ text: string }>('chat', {
      history: history.map((msg) => ({ role: msg.role, content: msg.content })),
    });
    return text || '';
  } catch (error) {
    console.error('Error in chat response:', error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
      throw new Error('Chat quota exceeded. Please wait a moment before sending another message.');
    }
    throw new Error('Sorry, I encountered an error responding. Please try again.');
  }
}
