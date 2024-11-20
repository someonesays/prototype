import { expect, test } from "bun:test";
import {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  createMinigame,
  createPack,
  updateMinigame,
  addMinigameToPack,
  getPackMinigamesPublic,
  getMinigamePublic,
  getPackPublic,
  isMinigameInPack,
  updatePack,
  deletePack,
  deleteMinigame,
} from "../src/utils";
import { MinigamePathType, MinigameVisibility, PackVisibility } from "@/public";

test("user", async () => {
  const id = await createUser({ name: "Two" });
  const user = await getUser(id);
  expect(user?.name).toBe("Two");

  await updateUser({ id, name: "Three" });
  const user2 = await getUser(id);
  expect(user2?.name).toBe("Three");

  await deleteUser(id);
  const user3 = await getUser(id);
  expect(!user3).toBe(true);
});

test("minigames and packs", async () => {
  const authorId = await createUser({ name: "Two" });

  const minigameId = await createMinigame({
    name: "Click the buttons",
    authorId,
    description: "The objective of this game is to click the buttons.",
    previewImage: null,
    previewPlaceholderImage: null,
    visibility: MinigameVisibility.Public,
    prompt: "Someone says **click the buttons**",
    legalTermsUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    legalPrivacyUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    proxyUrl: "http://localhost:5173",
    pathType: MinigamePathType.WholePath,
    minimumPlayersToStart: 1, // (there's nothing stopping a player from leaving AFTER a game starts)
  });
  const minigame = await getMinigamePublic(minigameId);

  expect(minigame?.name).toBe("Click the buttons");
  expect(minigame?.author?.id).toBe(authorId);

  await updateMinigame({ id: minigameId, legalTermsUrl: "https://example.com" });
  const minigame2 = await getMinigamePublic(minigameId);
  expect(minigame2?.legal.terms).toBe("https://example.com");

  const packId = await createPack({
    authorId,
    name: "Example pack name",
    description: "This is the pack's description.",
    iconImage: null,
    iconPlaceholderImage: null, // This is meant for stuff such as ThumbHash.
    visibility: PackVisibility.Public,
  });
  const pack = await getPackPublic({ id: packId });

  expect(pack?.name).toBe("Example pack name");
  expect(minigame?.author?.id).toBe(authorId);

  await updatePack({ id: packId, name: "test" });
  const pack2 = await getPackPublic({ id: packId });
  expect(pack2?.name).toBe("test");

  await addMinigameToPack({ packId: pack!.id, minigameId: minigame!.id });
  const packMinigames = await getPackMinigamesPublic({ id: packId });

  expect(packMinigames.total).toBe(1);
  expect(packMinigames.minigames[0]?.name).toBe("Click the buttons");
  expect(packMinigames.minigames[0]?.author?.id).toBe(authorId);

  const exists = await isMinigameInPack({ packId, minigameId });
  const exists2 = await isMinigameInPack({ packId, minigameId: "test" });
  expect(exists).toBe(true);
  expect(exists2).toBe(false);

  await deletePack(packId);
  const pack3 = await getPackPublic({ id: packId });
  expect(!pack3).toBe(true);

  await deleteMinigame(minigameId);
  const minigame3 = await getMinigamePublic(minigameId);
  expect(!minigame3).toBe(true);

  await deleteUser(authorId);
});
