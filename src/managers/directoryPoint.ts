import loggr from '../logger';
const logger = loggr('dpoint');

import { match } from '../match';
import { PresenceMetadata } from '../rpc';
import { MAIN_DIRECTORY_POINT } from '../constants';
import { settings } from './settings';
import { Collection } from '@discordjs/collection';

interface DirectoryPoint {
  directories: Array<GitHubRepoDirectory|ExternalDirectory|MetadataDirectory>;
  url?: string;
}

interface GitHubRepoDirectory {
  type: 'github_repo';
  repo: string;
  match: string;
  branch?: string;
}

interface MetadataDirectory extends PresenceMetadata {
  type: 'metadata';
}

interface ExternalDirectory {
  type: 'multi_metadata' | 'external_metadata';
  url: string;
}

interface GitHubTree {
  sha: string;
  truncated: boolean;
  url: string;
  tree: Array<{
    type: 'tree' | 'blob';
    path: string;
    sha: string;
    url: string;
    mode: string;
  }>
}

export const lastRead: Collection<number, PresenceMetadata> = new Collection();
export let lastPointRead: DirectoryPoint = null;

export function getDirectoryPoint(): string {
	return settings.get('directoryPoint', MAIN_DIRECTORY_POINT) as string;
}

export async function readDirectoryPoint(): Promise<boolean> {
  lastRead.clear();
  try {
    const directoryPoint = await fetch(getDirectoryPoint()).then(r => r.json()) as DirectoryPoint;
    lastPointRead = directoryPoint;
    
    for (const directory of directoryPoint.directories) {
      if(directory.type === 'github_repo') {
        if (!directory.branch) directory.branch = 'master';
        const repoTree = await fetch(`https://api.github.com/repos/${directory.repo}/git/trees/${directory.branch}?recursive=1`).then(r => r.json()) as GitHubTree;
        const metadatas = repoTree.tree.filter(file => file.type === 'blob' && match(directory.match, file.path));
        
        for (const metadata of metadatas) {
          try {
            const metadataURL = `https://github.com/${directory.repo}/raw/${directory.branch}/${metadata.path}`;
            const json = await fetch(metadataURL).then(r => r.json()) as PresenceMetadata;
            if (!json.script_url && metadataURL.endsWith('/metadata.json'))
              json.script_url = metadataURL.replace('/metadata.json', '/index.ts');
            if (!json.script_url) continue;
            lastRead.set(json.app_id, json);
          } catch (e) {
            logger.info(`Could not get metadata on ${directory.repo}#${directory.branch}@${metadata.path}`, e);
            continue;
          }
        }
      } else if(directory.type === 'multi_metadata') {
        try {
          const metadatas = await fetch(directory.url).then(r => r.json()) as Array<PresenceMetadata>;
          metadatas.forEach(metadata => {
            if (!metadata.script_url) return;
            lastRead.set(metadata.app_id, metadata);
          });
        } catch (e) {
          logger.info('Could not get multi metadata @', directory.url, e);
          continue;
        }
      } else if(directory.type === 'external_metadata') {
        try {
          const metadata = await fetch(directory.url).then(r => r.json()) as PresenceMetadata;
          if (!metadata.script_url && directory.url.endsWith('/metadata.json'))
            metadata.script_url = directory.url.replace('/metadata.json', '/index.ts');
          if (!metadata.script_url) continue;
          lastRead.set(metadata.app_id, metadata);
        } catch (e) {
          logger.info('Could not get external metadata @', directory.url, e);
          continue;
        }
      } else if(directory.type === 'metadata') {
        if (!directory.script_url) continue;
        delete directory.type;
        lastRead.set(directory.app_id, directory);
      }
    }
    return true;
  } catch (e) {
    logger.info('Failed to read directory point', e);
    return false;
  }
}