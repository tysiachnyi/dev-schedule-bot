export interface GistFile {
  content: string;
}

export interface GistResponse {
  files: {
    [filename: string]: GistFile;
  };
}

export interface SlackMessage {
  text: string;
}
