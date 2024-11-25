export const validateUrl = (value: string) => {
  return value.length >= 1 && value.length <= 999 && /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value);
};
