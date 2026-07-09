export const debounce = <A extends unknown[]>(func: (...args: A) => unknown, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function executedFunction(...args: A) {
    const later = () => {
      timeout = undefined;
      func(...args);
    };

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);
  };
};
