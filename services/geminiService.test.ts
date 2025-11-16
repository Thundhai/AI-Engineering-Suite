// This is a conceptual test file. In a real project, you would use a test runner
// like Vitest or Jest to execute this. You would also need to install the
// necessary dev dependencies (e.g., `npm install -D vitest @vitest/globals`).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEngineeringOutput } from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { EngineeringOutput } from '../types';

// FIX: Create a mock function in a scope accessible by both the mock factory and the tests.
const mockGenerateContent = vi.fn();

// Mock the entire @google/genai module
vi.mock('@google/genai', () => {
  const GoogleGenAI = vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));
  return { GoogleGenAI, Type: { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY' } };
});

describe('generateEngineeringOutput', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  // SUCCESS CASE
  it('should successfully parse a valid response from the API', async () => {
    const mockApiResponse = {
      text: JSON.stringify({
        status: 'success',
        active_agents: ['Civil Engineering Agent'],
        inputs_confirmed: "{\"load\":\"100kN\"}",
        engineering_output: "{\"beam_size\":\"300x600\"}",
        design_files: "{}",
        cad_scripts: "{\"freecad_macro.py\":\"import FreeCAD\"}",
        bom: "{\"concrete\":\"1m^3\"}",
        compliance: "{\"code\":\"Eurocode 2\"}",
        qa_qc: "{\"checks\":[\"rebar placement\"]}",
        hse: "{\"risks\":[\"working at height\"]}",
        method_statement: "{\"steps\":[\"erect formwork\"]}",
        risk_assessment: "{\"hazard\":\"fall\"}",
        final_recommendation: 'Proceed with design.',
      }),
    };

    (mockGenerateContent as any).mockResolvedValue(mockApiResponse);

    // FIX: Added missing 'mode' argument.
    const result = await generateEngineeringOutput('test prompt', ['Civil Engineering Agent'], 'Balanced');

    expect(result.status).toBe('success');
    expect(result.active_agents).toEqual(['Civil Engineering Agent']);
    expect(result.inputs_confirmed).toEqual({ load: '100kN' });
    expect(result.engineering_output).toEqual({ beam_size: '300x600' });
    expect(result.cad_scripts).toEqual({ "freecad_macro.py": "import FreeCAD" });
    expect(result.bom).toEqual({ concrete: '1m^3' });
    expect(result.final_recommendation).toBe('Proceed with design.');
  });
  
  // EDGE CASE: Malformed nested JSON string
  it('should handle malformed nested JSON by returning an error object for the field', async () => {
    const mockApiResponse = {
      text: JSON.stringify({
        status: 'success',
        active_agents: ['Civil Engineering Agent'],
        inputs_confirmed: "{\"load\":\"100kN\"}",
        engineering_output: "{\"beam_size\"::\"300x600\"}", // Malformed JSON here
        design_files: "{}",
        cad_scripts: "{}",
        bom: "{}",
        compliance: "{}",
        qa_qc: "{}",
        hse: "{}",
        method_statement: "{}",
        risk_assessment: "{}",
        final_recommendation: 'Proceed with design.',
      }),
    };

    (mockGenerateContent as any).mockResolvedValue(mockApiResponse);

    // FIX: Added missing 'mode' argument.
    const result = await generateEngineeringOutput('test prompt', ['Civil Engineering Agent'], 'Balanced');

    expect(result.status).toBe('success');
    expect(result.inputs_confirmed).toEqual({ load: '100kN' });
    expect(result.engineering_output).toEqual({
      error: "Invalid JSON format from model",
      content: "{\"beam_size\"::\"300x600\"}",
    });
  });


  // ERROR CASES
  it('should throw a specific error for an invalid API key', async () => {
    (mockGenerateContent as any).mockRejectedValue(new Error('API key not valid'));
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Authentication failed: The API Key is not valid. Please ensure it is configured correctly.");
  });
  
  it('should throw a specific error for a 400 bad request', async () => {
    (mockGenerateContent as any).mockRejectedValue(new Error('[400 Bad Request] Invalid argument'));
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Invalid request: The model could not process the request. This might be due to an unclear prompt or a configuration issue. Please try rephrasing your request or check the selected agents.");
  });
  
  it('should throw a specific error for a 429 quota exceeded error', async () => {
    (mockGenerateContent as any).mockRejectedValue(new Error('429 Resource has been exhausted (e.g. check quota).'));
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Quota exceeded: You have exceeded your request limit for the AI model. Please check your usage or try again later.");
  });

  it('should throw a specific error for a 500 internal server error', async () => {
    (mockGenerateContent as any).mockRejectedValue(new Error('500 Internal error'));
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Service error: The AI service encountered a temporary internal error. Please wait a moment and try again.");
  });

  it('should throw a specific error for a 503 service unavailable error', async () => {
    (mockGenerateContent as any).mockRejectedValue(new Error('503 Service Unavailable'));
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Service unavailable: The AI service is currently unavailable or overloaded. Please try again in a few minutes.");
  });
  
  it('should throw a specific error for a network failure', async () => {
    (mockGenerateContent as any).mockRejectedValue(new Error('fetch failed'));
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Network error: Failed to connect to the AI service. Please check your internet connection.");
  });

  // EDGE CASE: Empty response
  it('should throw an error for an empty response from the API', async () => {
    (mockGenerateContent as any).mockResolvedValue({ text: '' });
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("Received an invalid or empty response from the Gemini API.");
  });
  
  // JSON PARSING ERROR
  it('should throw an error if the API returns malformed JSON', async () => {
    (mockGenerateContent as any).mockResolvedValue({ text: '{"status": "success", ' }); // Incomplete JSON
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("The model returned a malformed JSON response.");
  });

  // EDGE CASE: Missing required fields
  it('should throw an error if the parsed JSON is missing required fields', async () => {
    const mockApiResponse = {
      text: JSON.stringify({
        // 'status' and 'active_agents' are missing
        final_recommendation: 'This is incomplete.',
      }),
    };
    (mockGenerateContent as any).mockResolvedValue(mockApiResponse);
    // FIX: Added missing 'mode' argument.
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced'))
        .rejects
        .toThrow("The model's response is missing required data fields after parsing.");
  });

});