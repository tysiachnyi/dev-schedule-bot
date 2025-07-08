export function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

export function format(devs: string[]): string {
  return devs.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n');
}

export function rotate(devs: string[]): string[] {
  return [...devs.slice(1), devs[0]];
}
