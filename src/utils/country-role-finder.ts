export class CountryRoleFinder {
  private static rollRegex = /([\S ]*?) (:flag[a-z_]*?:)/g;

  static getCountryByRole(input: string): string {
    const result = this.getMatches(input);
    return result[1];
  }

  static isCountryRole(input: string): boolean {
    const result = this.getMatches(input);
    return !!result.length;
  }

  private static getMatches(input: string) {
    let match;
    let result: string[] = [];
    while ((match = CountryRoleFinder.rollRegex.exec(input)) !== null) {
      if (match.index === CountryRoleFinder.rollRegex.lastIndex) {
        CountryRoleFinder.rollRegex.lastIndex++;
      }
      match.forEach((match) => {
        result.push(match);
      });
    }
    return result;
  }
}
