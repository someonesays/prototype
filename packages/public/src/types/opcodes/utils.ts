export type EnumValueStrings<T> = T[keyof T] extends infer U ? (U extends number ? `${U}` : never) : never;
