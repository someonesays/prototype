export enum Visibility {
  Private = 0,
  Public = 1,
}

export const prompts = [
  {
    id: "1",
    visibility: Visibility.Public,
    prompt: "click the buttons",
    url: {
      host: "localhost:5173",
      secure: false,
    },
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "2",
    visibility: Visibility.Public,
    prompt: "kill youself",
    url: {
      host: "example.com",
      secure: true,
    },
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
