import { supabase } from './supabaseClient';
import {
  ChatMessage,
  EngineeringOutput,
  GenerationMode,
  GeoLocation,
  Project,
  ProjectVersion,
  UploadedFile,
} from '../types';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in.');
  return data.user.id;
}

function rowToProject(
  row: any,
  versions: ProjectVersion[],
  chatHistory: ChatMessage[],
  uploadedFiles: UploadedFile[]
): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    prompt: row.prompt ?? '',
    selectedAgents: row.selected_agents ?? [],
    uploadedFiles,
    generationMode: (row.generation_mode ?? 'Balanced') as GenerationMode,
    isRedactionEnabled: !!row.is_redaction_enabled,
    output: row.output ?? null,
    chatHistory,
    alphaEarthLocation: row.alpha_earth_location ?? null,
    versions,
  };
}

function rowToVersion(row: any): ProjectVersion {
  return {
    id: row.id,
    timestamp: row.created_at,
    name: row.name,
    prompt: row.prompt,
    selectedAgents: row.selected_agents ?? [],
    generationMode: row.generation_mode as GenerationMode,
    output: row.output ?? null,
  };
}

function rowToChatMessage(row: any): ChatMessage {
  return { id: row.id, role: row.role, content: row.content };
}

function rowToFile(row: any): UploadedFile {
  return { id: row.id, name: row.name, mimeType: row.mime_type, storagePath: row.storage_path };
}

export async function listProjects(): Promise<Project[]> {
  const { data: projectRows, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (projectsError) throw new Error(projectsError.message);

  const ids = (projectRows ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const [{ data: versionRows, error: versionsError }, { data: chatRows, error: chatError }, { data: fileRows, error: filesError }] =
    await Promise.all([
      supabase.from('project_versions').select('*').in('project_id', ids).order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').in('project_id', ids).order('created_at', { ascending: true }),
      supabase.from('project_files').select('*').in('project_id', ids).order('created_at', { ascending: true }),
    ]);
  if (versionsError) throw new Error(versionsError.message);
  if (chatError) throw new Error(chatError.message);
  if (filesError) throw new Error(filesError.message);

  const versionsByProject = groupBy(versionRows ?? [], 'project_id');
  const chatByProject = groupBy(chatRows ?? [], 'project_id');
  const filesByProject = groupBy(fileRows ?? [], 'project_id');

  return (projectRows ?? []).map((row) =>
    rowToProject(
      row,
      (versionsByProject[row.id] ?? []).map(rowToVersion),
      (chatByProject[row.id] ?? []).map(rowToChatMessage),
      (filesByProject[row.id] ?? []).map(rowToFile)
    )
  );
}

function groupBy<T extends { project_id: string }>(rows: T[], _key: 'project_id'): Record<string, T[]> {
  return rows.reduce((acc, row) => {
    (acc[row.project_id] ??= []).push(row);
    return acc;
  }, {} as Record<string, T[]>);
}

export async function createProject(name: string, description: string): Promise<Project> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, name, description })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToProject(data, [], [], []);
}

export interface ProjectPatch {
  name?: string;
  description?: string;
  prompt?: string;
  selectedAgents?: string[];
  generationMode?: GenerationMode;
  isRedactionEnabled?: boolean;
  output?: EngineeringOutput | null;
  alphaEarthLocation?: GeoLocation | null;
}

export async function updateProject(id: string, patch: ProjectPatch): Promise<string> {
  const row: Record<string, any> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.prompt !== undefined) row.prompt = patch.prompt;
  if (patch.selectedAgents !== undefined) row.selected_agents = patch.selectedAgents;
  if (patch.generationMode !== undefined) row.generation_mode = patch.generationMode;
  if (patch.isRedactionEnabled !== undefined) row.is_redaction_enabled = patch.isRedactionEnabled;
  if (patch.output !== undefined) row.output = patch.output;
  if (patch.alphaEarthLocation !== undefined) row.alpha_earth_location = patch.alphaEarthLocation;

  const { data, error } = await supabase.from('projects').update(row).eq('id', id).select('updated_at').single();
  if (error) throw new Error(error.message);
  return data.updated_at;
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await requireUserId();
  // Best-effort cleanup of the project's files in Storage; the DB rows are
  // removed regardless (cascade), so a partial storage failure here never
  // blocks the delete.
  const { data: files } = await supabase.storage.from('project-files').list(`${userId}/${id}`);
  if (files && files.length > 0) {
    await supabase.storage.from('project-files').remove(files.map((f) => `${userId}/${id}/${f.name}`));
  }
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function saveVersion(
  projectId: string,
  name: string,
  data: Pick<Project, 'prompt' | 'selectedAgents' | 'generationMode' | 'output'>
): Promise<ProjectVersion> {
  const { data: row, error } = await supabase
    .from('project_versions')
    .insert({
      project_id: projectId,
      name,
      prompt: data.prompt,
      selected_agents: data.selectedAgents,
      generation_mode: data.generationMode,
      output: data.output,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToVersion(row);
}

export async function deleteVersion(versionId: string): Promise<void> {
  const { error } = await supabase.from('project_versions').delete().eq('id', versionId);
  if (error) throw new Error(error.message);
}

export async function addChatMessage(
  projectId: string,
  role: ChatMessage['role'],
  content: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ project_id: projectId, role, content })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToChatMessage(data);
}

export async function uploadProjectFile(projectId: string, file: File): Promise<UploadedFile> {
  const userId = await requireUserId();
  const id = crypto.randomUUID();
  const storagePath = `${userId}/${projectId}/${id}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream' });
  if (uploadError) throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`);

  const { data, error } = await supabase
    .from('project_files')
    .insert({ id, project_id: projectId, name: file.name, mime_type: file.type || 'application/octet-stream', storage_path: storagePath })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToFile(data);
}

export async function removeProjectFile(fileId: string, storagePath: string): Promise<void> {
  await supabase.storage.from('project-files').remove([storagePath]);
  const { error } = await supabase.from('project_files').delete().eq('id', fileId);
  if (error) throw new Error(error.message);
}
