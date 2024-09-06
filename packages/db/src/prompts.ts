export enum Visibility {
  Private = 0,
  Public = 1,
}

export const prompts = [
  {
    id: "cm0p7w2ys0",
    visibility: Visibility.Public,
    prompt: "click the buttons",
    url: {
      host: "google.com",
      secure: true,
    },
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "mjax5z1doc",
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
