import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEngineeringOutput } from './geminiService';

// Mock the Supabase client's Edge Function transport — geminiService now
// calls supabase.functions.invoke('gemini-proxy', ...) instead of the
// Gemini SDK directly (the SDK only runs server-side, in
// supabase/functions/gemini-proxy). Everything downstream of the raw
// response text (JSON parsing, per-field re-parsing, friendly error
// mapping) is unchanged from before, so these assertions carry over as-is.
const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }));

vi.mock('./supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

describe('generateEngineeringOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SUCCESS CASE
  it('should successfully parse a valid response from the API', async () => {
    mockInvoke.mockResolvedValue({
      data: {
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
      },
      error: null,
    });

    const result = await generateEngineeringOutput('test prompt', ['Civil Engineering Agent'], 'Balanced', [], false, null);

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
    mockInvoke.mockResolvedValue({
      data: {
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
      },
      error: null,
    });

    const result = await generateEngineeringOutput('test prompt', ['Civil Engineering Agent'], 'Balanced', [], false, null);

    expect(result.status).toBe('success');
    expect(result.inputs_confirmed).toEqual({ load: '100kN' });
    expect(result.engineering_output).toEqual({
      error: 'Invalid JSON format from model',
      content: "{\"beam_size\"::\"300x600\"}",
    });
  });

  // ERROR CASES
  it('should throw a specific error for an invalid API key', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'API key not valid' } });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Authentication failed: The API Key is not valid. Please ensure it is configured correctly.');
  });

  it('should throw a specific error for a 400 bad request', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: '[400 Bad Request] Invalid argument' } });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Invalid request: The model could not process the request. This might be due to an unclear prompt or a configuration issue. Please try rephrasing your request or check the selected agents.');
  });

  it('should throw a specific error for a 429 quota exceeded error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: '429 Resource has been exhausted (e.g. check quota).' } });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Quota exceeded: You have exceeded your request limit for the AI model. Please check your usage or try again later.');
  });

  it('should throw a specific error for a 500 internal server error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: '500 Internal error' } });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Service error: The AI service encountered a temporary internal error. Please wait a moment and try again.');
  });

  it('should throw a specific error for a 503 service unavailable error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: '503 Service Unavailable' } });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Service unavailable: The AI service is currently unavailable or overloaded. Please try again in a few minutes.');
  });

  it('should throw a specific error for a network failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'fetch failed' } });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Network error: Failed to connect to the AI service. Please check your internet connection.');
  });

  // EDGE CASE: Empty response
  it('should throw an error for an empty response from the API', async () => {
    mockInvoke.mockResolvedValue({ data: { text: '' }, error: null });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('Received an invalid or empty response from the Gemini API.');
  });

  // JSON PARSING ERROR
  it('should throw an error if the API returns malformed JSON', async () => {
    mockInvoke.mockResolvedValue({ data: { text: '{"status": "success", ' }, error: null }); // Incomplete JSON
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow('The model returned a malformed JSON response.');
  });

  // EDGE CASE: Missing required fields
  it('should throw an error if the parsed JSON is missing required fields', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        text: JSON.stringify({
          // 'status' and 'active_agents' are missing
          final_recommendation: 'This is incomplete.',
        }),
      },
      error: null,
    });
    await expect(generateEngineeringOutput('test', ['test'], 'Balanced', [], false, null))
      .rejects
      .toThrow("The model's response is missing required data fields after parsing.");
  });

});
