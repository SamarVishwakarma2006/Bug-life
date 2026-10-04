export function levelTitle(level: number) {
  return level >= 50
    ? 'Debugging Legend'
    : level >= 30
      ? 'Bug Exterminator'
      : level >= 20
        ? 'Bug Hunter'
        : level >= 10
          ? 'Bug Slayer'
          : level >= 5
            ? 'Debugger'
            : 'Bug Rookie';
}
